// RunPod serverless LoRA-Training — gemeinsame Helfer für runpodTrain und
// runpodStatus. Beide Funktionen sprechen dieselbe API, deshalb hier
// zentral, damit der Vertrag nur an einer Stelle steht.
//
// Vertrag für den Serverless-Handler (Endpoint, den du bei RunPod
// deployest): das `input`-Objekt beim /run-Aufruf:
//   {
//     name:         "<Personenname>",     // Triggerwort & Dateiname
//     trigger_word: "<Personenname>",
//     images:       ["https://..", ...],  // 12 signierte Bild-URLs
//     steps:        1200,
//     base_model:   "stable-diffusion-xl-base-1.0"
//   }
// Ergebnis in job.output — mindestens einer dieser Schlüssel mit einer
// öffentlichen URL zur .safetensors:
//   { model_url } | { lora_url } | { safetensors_url } | { url }

import { secrets } from "base44:runtime";

const API = "https://api.runpod.ai/v2";

function creds() {
  const key = secrets.get("RUNPOD_API_KEY");
  const endpoint = secrets.get("RUNPOD_ENDPOINT_ID");
  if (!key || !endpoint) throw new Error("RUNPOD_API_KEY / RUNPOD_ENDPOINT_ID fehlen (Dashboard → Secrets).");
  return { key, endpoint };
}

// Job beim Serverless-Endpoint einreichen. Gibt die RunPod-Job-ID zurück.
export async function runJob(input) {
  const { key, endpoint } = creds();
  const res = await fetch(`${API}/${endpoint}/run`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id) {
    throw new Error(data?.error || `RunPod /run ${res.status}`);
  }
  return data.id;
}

// Status eines Jobs abholen. Liefert { status, output, error }.
export async function getStatus(jobId) {
  const { key, endpoint } = creds();
  const res = await fetch(`${API}/${endpoint}/status/${jobId}`, {
    headers: { "Authorization": `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `RunPod /status ${res.status}`);
  return {
    status: data.status, // IN_QUEUE | IN_PROGRESS | COMPLETED | FAILED | CANCELLED
    output: data.output,
    error: data.error,
  };
}

// Aus dem Job-Ergebnis die Modell-URL ziehen (verschiedene übliche Schlüssel).
export function modelUrlFromOutput(output) {
  if (!output || typeof output !== "object") return null;
  return output.model_url || output.lora_url || output.safetensors_url || output.url || null;
}