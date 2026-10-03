import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Erzeugt ein Bild über ein Modell aus dem Studio.
// Zwei Plattformen: Hugging Face (Konto des Betreibers) und Pollinations (frei, ohne Anmeldung).

const HF_API = 'https://huggingface.co/api/models';
const HF_CLASSIC = 'https://router.huggingface.co/hf-inference/models';
const POLLINATIONS = 'https://gen.pollinations.ai/image';
const POLL_FREE_MODEL = 'flux';

function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// Welcher Dienst das Modell gerade wirklich anbietet. fal-ai kann als Einziger
// Bilder über den Router erzeugen, die Haus-Schnittstelle nur die eigenen Modelle.
async function resolveProvider(modelId, token) {
  const res = await fetch(`${HF_API}/${modelId}?expand[]=inferenceProviderMapping`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const map = data.inferenceProviderMapping || {};
  const live = Object.entries(map).filter(([, v]) => v && v.status === 'live');
  const fal = live.find(([name]) => name === 'fal-ai');
  if (fal) return { provider: 'fal-ai', providerId: fal[1].providerId };
  const hf = live.find(([name]) => name === 'hf-inference');
  if (hf) return { provider: 'hf-inference', providerId: hf[1].providerId };
  return null;
}

async function readImage(res) {
  const type = res.headers.get('content-type') || '';
  if (type.startsWith('image/')) {
    const bytes = new Uint8Array(await res.arrayBuffer());
    return { imageUrl: `data:${type};base64,${toBase64(bytes)}` };
  }
  const text = await res.text();
  try {
    const parsed = JSON.parse(text);
    const first = parsed?.data?.[0] || parsed?.images?.[0];
    if (first?.b64_json) return { imageUrl: `data:image/png;base64,${first.b64_json}` };
    if (first?.url) return { imageUrl: first.url };
  } catch (parseError) {
    // keine JSON-Antwort
  }
  return { error: text.slice(0, 300) };
}

// Pollinations: kostenlos, kein Konto, keine Anmeldung. Ohne eigenen Schlüssel
// gibt der Dienst nur seine Standardgröße heraus — dann wird auch kein Format
// verlangt, sonst kommt eine Absage zurück statt eines Bildes.
async function generatePollinations(prompt) {
  // Frei und ohne Anmeldung nimmt der Dienst genau zwei Angaben an: sein
  // freies Modell und den Wunsch ohne Wasserzeichen. Jede weitere Angabe
  // (anderes Modell, Format, Seed) wird ohne Schlüssel abgelehnt — deshalb
  // wird hier auch nichts weiter verlangt.
  const params = new URLSearchParams({ model: POLL_FREE_MODEL, nologo: 'true' });
  const url = `${POLLINATIONS}/${encodeURIComponent(prompt.slice(0, 900))}?${params}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.log('Pollinations fehlgeschlagen', res.status, text.slice(0, 300));
    return { error: `Bilderdienst (${res.status}): ${text.slice(0, 200)}` };
  }
  return readImage(res);
}

async function generateHuggingFace(modelId, prompt, accessToken) {
  const auth = { Authorization: `Bearer ${accessToken}` };
  const target = await resolveProvider(modelId, accessToken);
  if (!target) {
    return { error: 'Für dieses Modell ist gerade kein Bild-Dienst verfügbar.' };
  }

  const res =
    target.provider === 'fal-ai'
      ? await fetch(`https://router.huggingface.co/fal-ai/${target.providerId}`, {
          method: 'POST',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })
      : await fetch(`${HF_CLASSIC}/${modelId}`, {
          method: 'POST',
          headers: { ...auth, 'Content-Type': 'application/json', Accept: 'image/png' },
          body: JSON.stringify({ inputs: prompt }),
        });

  if (!res.ok) {
    const text = await res.text();
    console.log('hfGenerate error', modelId, target?.provider, res.status, text.slice(0, 400));
    // Der Dienst prüft den Prompt vorab — freizügige Beschreibungen fallen durch.
    if (text.includes('content_policy_violation') || text.includes('content checker')) {
      return { error: 'Dieser Dienst mag den Prompt nicht: Er gilt als zu freizügig. Nimm ein freies Modell oder formuliere zarter.' };
    }
    return { error: `Hugging Face (${res.status}): ${text.slice(0, 300)}` };
  }
  return readImage(res);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const modelId = (body.modelId || '').trim();
    const prompt = (body.prompt || '').trim();
    const source = body.source || 'HUGGING_FACE';
    if (!prompt) return Response.json({ error: 'Prompt fehlt.' }, { status: 400 });

    const out =
      source === 'POLLINATIONS'
        ? await generatePollinations(prompt)
        : !modelId
          ? { error: 'Modell-ID fehlt.' }
          : await generateHuggingFace(
              modelId,
              prompt,
              (await base44.asServiceRole.connectors.getConnection('hugging_face')).accessToken
            );

    if (out.error) return Response.json({ error: out.error }, { status: 502 });
    return Response.json({ imageUrl: out.imageUrl });
  } catch (error) {
    console.log('hfGenerate failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}