import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Erzeugt ein Bild über ein Modell auf Hugging Face (Account des Betreibers).
// Der rechnende Anbieter wird automatisch ermittelt — so funktioniert jede Modell-ID.

const HF_API = 'https://huggingface.co/api/models';
const CLASSIC = 'https://router.huggingface.co/hf-inference/models';

async function resolveProvider(modelId, token) {
  const res = await fetch(`${HF_API}/${modelId}?expand[]=inferenceProviderMapping`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const map = data.inferenceProviderMapping || {};
  const live = Object.entries(map).filter(([, v]) => v && v.status === 'live');
  if (!live.length) return null;
  const pick = live.find(([name]) => name === 'fal-ai') || live[0];
  return { provider: pick[0], providerId: pick[1].providerId };
}

function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function readImage(res) {
  const type = res.headers.get('content-type') || '';
  if (type.startsWith('image/')) {
    const bytes = new Uint8Array(await res.arrayBuffer());
    return { imageUrl: `data:${type};base64,${toBase64(bytes)}` };
  }
  const text = await res.text();
  try {
    const first = JSON.parse(text)?.data?.[0];
    if (first?.b64_json) return { imageUrl: `data:image/png;base64,${first.b64_json}` };
    if (first?.url) return { imageUrl: first.url };
  } catch (parseError) {
    // keine JSON-Antwort
  }
  return { error: text.slice(0, 300) };
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
    if (!modelId || !prompt) {
      return Response.json({ error: 'Modell und Prompt werden gebraucht.' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('hugging_face');
    const auth = { Authorization: `Bearer ${accessToken}` };
    const target = await resolveProvider(modelId, accessToken);

    const res =
      target && target.provider !== 'hf-inference'
        ? await fetch(`https://router.huggingface.co/${target.provider}/v1/images/generations`, {
            method: 'POST',
            headers: { ...auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: target.providerId, prompt }),
          })
        : await fetch(`${CLASSIC}/${modelId}`, {
            method: 'POST',
            headers: { ...auth, 'Content-Type': 'application/json', Accept: 'image/png' },
            body: JSON.stringify({ inputs: prompt }),
          });

    if (!res.ok) {
      const text = await res.text();
      console.log('hfGenerate error', modelId, target?.provider, res.status, text.slice(0, 400));
      return Response.json(
        { error: `Hugging Face (${res.status}): ${text.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const out = await readImage(res);
    if (out.error) return Response.json({ error: `Unerwartete Antwort: ${out.error}` }, { status: 502 });

    return Response.json({ imageUrl: out.imageUrl });
  } catch (error) {
    console.log('hfGenerate failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}