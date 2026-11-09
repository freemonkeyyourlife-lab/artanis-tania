# RunPod-Pod-Trainings-Service  (für narrow_blush_egret)
#
# Ein winziges HTTP-Service, das die App anstößt: Job anlegen, LoRA trainieren,
# Status liefern, fertiges Modell ausliefern.  RunPod-Pods haben keine
# „Befehl ausführen“-API — deshalb läuft dieses Skript dauerhaft auf dem Pod.
#
# Einmal pro Pod einrichten:
#   cd /workspace
#   git clone https://github.com/kohya-ss/sd-scripts  (oder bestehendes Kohya)
#   pip install flask requests accelerate transformers diffusers safetensors
#   # ggf. im sd-scripts-Ordner:  pip install -r requirements.txt
#   export POD_TOKEN="dasselbe-token-wie-in-den-app-secrets"
#   nohup python3 /workspace/train_server.py > /workspace/train_server.log 2>&1 &
#
# Pod muss den Port 8080 öffentlich freigeben (Pod-Einstellungen → Ports).
# Die App bekommt dann  RUNPOD_POD_URL = http://<pod-ip>:8080
#                      RUNPOD_POD_TOKEN = <POD_TOKEN>

import os, json, uuid, threading, subprocess, urllib.request, time, traceback, io
from pathlib import Path
from flask import Flask, request, jsonify, send_file, abort

ROOT = Path("/workspace/pod_train")
ROOT.mkdir(parents=True, exist_ok=True)
SD = Path(os.environ.get("SD_SCRIPTS_DIR", "/workspace/sd-scripts"))
TOKEN = os.environ.get("POD_TOKEN", "")
BASE_MODEL = os.environ.get("BASE_MODEL", "/workspace/models/sd_xl_base_1.0.safetensors")
STEPS = int(os.environ.get("DEFAULT_STEPS", "1200"))

app = Flask(__name__)
jobs = {}            # id -> {status, error, model_path, model_url}
lock = threading.Lock()


def check_token():
    if not TOKEN: return True
    return request.headers.get("X-Token") == TOKEN


def run_training(job_id, payload):
    base = ROOT / job_id
    img = base / "img"; out = base / "out"
    img.mkdir(parents=True, exist_ok=True); out.mkdir(parents=True, exist_ok=True)
    try:
        images = payload.get("images", []) or []
        if not images:
            raise RuntimeError("keine Bilder")
        for i, url in enumerate(images):
            dest = img / f"img_{i:03d}.jpg"
            urllib.request.urlretrieve(url, dest)
            with open(dest.with_suffix(".txt"), "w") as f:
                f.write(f"{payload.get('trigger_word','person')}, {payload.get('name','person')}")
        trigger = payload.get("trigger_word", payload.get("name", "person"))
        steps = int(payload.get("steps", STEPS))
        config = base / "config.toml"
        config.write_text(f"""
pretrained_model_name_or_path = "{BASE_MODEL}"
train_data_dir = "{img}"
output_dir = "{out}"
output_name = "lora"
resolution = "768,1024"
max_train_steps = {steps}
learning_rate = 1e-4
train_batch_size = 1
gradient_checkpointing = true
mixed_precision = "fp16"
save_precision = "fp16"
save_model_as = "safetensors"
network_module = "networks.lora"
network_dim = 16
network_alpha = 8
text_encoder_lr = 5e-5
unet_lr = 1e-4
enable_bucket = true
""")
        cmd = [
            "accelerate", "launch", "--num_cpu_threads_per_process", "2",
            str(SD / "sdxl_train_network.py"), "--config", str(config),
        ]
        log = (base / "train.log").open("w")
        proc = subprocess.run(cmd, cwd=str(SD), stdout=log, stderr=subprocess.STDOUT)
        if proc.returncode != 0:
            raise RuntimeError(f"training exit {proc.returncode} — siehe {base/'train.log'}")
        model = out / "lora.safetensors"
        if not model.exists():
            raise RuntimeError("lora.safetensors nicht erzeugt")
        with lock:
            jobs[job_id].update(status="completed",
                                model_path=str(model),
                                model_url=f"{request.host_url.rstrip('/')}model/{job_id}")
    except Exception as e:
        with lock:
            jobs[job_id].update(status="failed", error=str(e))
        traceback.print_exc()


@app.post("/train")
def train():
    if not check_token(): abort(401)
    payload = request.get_json(force=True, silent=True) or {}
    jid = uuid.uuid4().hex
    with lock:
        jobs[jid] = {"status": "queued", "error": "", "model_path": "", "model_url": ""}
    threading.Thread(target=run_training, args=(jid, payload), daemon=True).start()
    return jsonify({"job_id": jid})


@app.get("/status/<jid>")
def status(jid):
    if not check_token(): abort(401)
    with lock:
        j = jobs.get(jid)
    if not j: abort(404)
    return jsonify({"status": j["status"], "error": j["error"], "model_url": j["model_url"]})


@app.get("/model/<jid>")
def model(jid):
    if not check_token(): abort(401)
    with lock:
        j = jobs.get(jid)
    if not j or not j["model_path"]: abort(404)
    return send_file(j["model_path"], as_attachment=True, download_name=f"{jid}.safetensors")


# --- LoRA-Inferenz -----------------------------------------------------------
# Bild mit dem trainierten LoRA erzeugen. Der Pod lädt das SDXL-Basis-Modell
# und die LoRA-Datei des Jobs, führt die Inference aus und liefert PNG-Bytes.
# Die Basis-Modell-Datei muss unter BASE_MODEL liegen. Pro LoRA wird die
# Pipeline einmal geladen und dann gecacht.
from diffusers import StableDiffusionXLPipeline
import torch

_pipes = {}  # lora_path -> pipeline

def _pipe_for(lora_path):
    if lora_path in _pipes:
        return _pipes[lora_path]
    pipe = StableDiffusionXLPipeline.from_single_file(BASE_MODEL, torch_dtype=torch.float16, variant="fp16").to("cuda")
    pipe.load_lora_weights(lora_path)
    pipe.fuse_lora()
    _pipes[lora_path] = pipe
    return pipe

@app.post("/generate")
def generate():
    if not check_token(): abort(401)
    payload = request.get_json(force=True, silent=True) or {}
    job = payload.get("lora_job_id")
    if not job:
        return jsonify({"error": "lora_job_id fehlt"}), 400
    lora_path = None
    with lock:
        j = jobs.get(job)
        if j and j.get("model_path"):
            lora_path = j["model_path"]
    if not lora_path:
        cand = ROOT / job / "out" / "lora.safetensors"
        if cand.exists():
            lora_path = str(cand)
    if not lora_path:
        return jsonify({"error": "LoRA nicht gefunden — erst trainieren."}), 404
    try:
        pipe = _pipe_for(lora_path)
        img = pipe(
            payload.get("prompt", ""),
            width=int(payload.get("width", 768)),
            height=int(payload.get("height", 1024)),
            num_inference_steps=int(payload.get("steps", 28)),
            guidance_scale=float(payload.get("guidance", 6.0)),
        ).images[0]
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return send_file(buf, mimetype="image/png")
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)