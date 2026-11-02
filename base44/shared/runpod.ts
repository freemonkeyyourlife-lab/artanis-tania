// RunPod-Pod-Anbindung (kein Serverless): auf dem Pod läuft ein kleines
// HTTP-Service (siehe runpod_pod/train_server.py). Die App spricht darüber:
//   POST {POD_URL}/train   -> { job_id }            (Job anstoßen)
//   GET  {POD_URL}/status/{id}  -> { status, error, model_url? }  (pollen)
//   GET  {POD_URL}/model/{id}   -> .safetensors-Bytes (herunterladen)
//
// Secrets: RUNPOD_POD_URL, RUNPOD_POD_TOKEN (Dashboard → Secrets).

import { secrets } from "base44:runtime";

function cfg() {
  const url = (secrets.get("RUNPOD_POD_URL") || "").replace(/\/+$/, "");
  const token = secrets.get("RUNPOD_POD_TOKEN");
  if (!url || !token) throw new Error("RUNPOD_POD_URL / RUNPOD_POD_TOKEN fehlen (Dashboard → Secrets).");
  return { url, token };
}

// Job auf dem Pod anstoßen. Gibt die Pod-Job-ID zurück.
export async function runJob(input) {
  const { url, token } = cfg();
  const res = await fetch(`${url}/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Token": token },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.job_id) {
    throw new Error(data?.error || `Pod /train ${res.status}`);
  }
  return data.job_id;
}

// Status eines Pod-Jobs abholen.
// Liefert { status: "queued"|"running"|"completed"|"failed", error, model_url }.
export async function getStatus(jobId) {
  const { url, token } = cfg();
  const res = await fetch(`${url}/status/${jobId}`, {
    headers: { "X-Token": token },
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Pod /status ${res.status}`);
  return {
    status: data.status,
    error: data.error,
    model_url: data.model_url || null,
  };
}

// Normiert den Pod-Status auf die internen Trainings-Status.
export function mapStatus(s) {
  if (s === "completed") return "FERTIG";
  if (s === "failed") return "FEHLER";
  return "LÄUFT"; // queued | running
}