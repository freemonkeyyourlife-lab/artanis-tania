# RunPod-Pod-Training (narrow_blush_egret)

Die App spricht nicht mehr den RunPod-Serverless-Endpoint an, sondern ein
kleines HTTP-Service, das **einmal** auf deinem Pod läuft.

## 1. Pod vorbereiten (einmalig)

```bash
cd /workspace
git clone https://github.com/kohya-ss/sd-scripts
cd sd-scripts && pip install -r requirements.txt
pip install flask requests diffusers peft
# SDXL-Base-Modell ablegen (oder Pfad über BASE_MODEL anpassen):
# /workspace/models/sd_xl_base_1.0.safetensors  — wird für Training UND
# LoRA-Generierung (Schritt 5) gebraucht.
```

## 2. Service starten

```bash
export POD_TOKEN="ein-geheimes-token"
nohup python3 /workspace/train_server.py > /workspace/train_server.log 2>&1 &
```

## 3. Pod-Port öffnen

In den Pod-Einstellungen (RunPod-Dashboard) Port **8080** öffentlich freigeben.
Die öffentliche Adresse steht dann z.B. auf `http://<pod-ip>:8080`.

## 4. In der App eintragen (Dashboard → Secrets)

- `RUNPOD_POD_URL`   = `http://<pod-ip>:8080`
- `RUNPOD_POD_TOKEN` = derselbe Wert wie `POD_TOKEN` auf dem Pod

(Die alten `RUNPOD_ENDPOINT_ID` / `RUNPOD_API_KEY` werden für das Training
nicht mehr gebraucht — lass sie ruhig stehen.)

Danach „GPU-Training starten" im Assistenten (Schritt 4) stößt den Job auf
dem Pod an; der Status pollt, bis das LoRA fertig ist, und lädt die
`.safetensors` direkt in die App.

## 5. LoRA-Bilder erzeugen (gleicher Pod)

Auf derselben Pod läuft zusätzlich `POST /generate` (in `train_server.py`
enthalten): die Resultate-Seite ruft `runpodGenerate` auf, der Pod lädt das
Basis-Modell + die LoRA-Datei des Jobs und liefert ein PNG. Dafür muss
`diffusers` und `peft` installiert sein (siehe oben) und das SDXL-Base-Modell
muss unter `BASE_MODEL` liegen. Die Pipeline wird pro LoRA einmal geladen und
gecacht — der erste Aufruf pro Charakter dauert etwas länger.