import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const SIZES = { portrait: 'portrait_16_9', square: 'square_hd', landscape: 'landscape_16_9' };
const RATIOS = { portrait: '9:16', square: '1:1', landscape: '16:9' };

// Bild über fal.ai erzeugen. Die Modelle dort sind deutlich stärker als die
// kostenlosen Wege — der Prompt kommt fertig aus dem Studio an.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const modelId = (body?.modelId || 'fal-ai/flux/schnell').trim();
    const prompt = (body?.prompt || '').trim();
    if (!prompt) return Response.json({ error: 'Prompt fehlt.' }, { status: 400 });

    const key = secrets.get('FAL_KEY');
    if (!key) return Response.json({ error: 'FAL_KEY ist nicht hinterlegt.' }, { status: 500 });

    const aspect = body?.aspect || 'portrait';
    // Die Ultra-Modelle rechnen mit Seitenverhältnissen, die übrigen mit Bildgrößen.
    const payload = modelId.includes('ultra')
      ? { prompt, aspect_ratio: RATIOS[aspect] || RATIOS.portrait, num_images: 1 }
      : {
          prompt,
          image_size: SIZES[aspect] || SIZES.portrait,
          num_images: 1,
          output_format: 'jpeg',
          enable_safety_checker: false,
        };

    const res = await fetch(`https://fal.run/${modelId}`, {
      method: 'POST',
      headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = data?.detail?.[0]?.msg || data?.detail || data?.error;
      console.log('falGenerate fehlgeschlagen', modelId, res.status, JSON.stringify(data).slice(0, 400));
      return Response.json({ error: `fal.ai: ${detail || res.status}` }, { status: 502 });
    }

    const imageUrl = data?.images?.[0]?.url;
    if (!imageUrl) {
      console.log('falGenerate ohne Bild', modelId, JSON.stringify(data).slice(0, 400));
      return Response.json({ error: 'fal.ai hat kein Bild zurückgegeben.' }, { status: 502 });
    }

    return Response.json({ imageUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}