import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { runGenerate } from '../../shared/runpod.ts';

// Trainings-Pipeline — Schritt 5: Bild aus dem trainierten LoRA erzeugen.
// Setzt voraus, dass das Set auf FERTIG trainiert ist (trainJobId hinterlegt).
// Die Generierung läuft auf demselben RunPod-Pod, auf dem auch trainiert
// wurde — das LoRA bleibt dort, muss nicht öffentlich hochgeladen werden.
// Das fertige PNG wird öffentlich abgelegt (stored publicly), damit es wie
// die anderen generierten Bilder direkt im Studio angezeigt werden kann.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Nur Admin' }, { status: 403 });

    const { setId, prompt, width, height, steps, guidance } = await req.json().catch(() => ({}));
    if (!setId || !prompt) return Response.json({ error: 'setId und prompt nötig' }, { status: 400 });

    const set = await base44.asServiceRole.entities.TrainingSet.get(setId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!set) return Response.json({ error: 'Set nicht gefunden' }, { status: 404 });
    if (set.trainStatus !== 'FERTIG' || !set.trainJobId) {
      return Response.json({ error: 'Set ist noch nicht trainiert — erst LoRA auf der GPU trainieren.' }, { status: 400 });
    }

    let blob;
    try {
      blob = await runGenerate({
        lora_job_id: set.trainJobId,
        prompt,
        width: width || 768,
        height: height || 1024,
        steps: steps || 28,
        guidance: guidance || 6.0,
      });
    } catch (e) {
      return Response.json({ error: e.message || 'Pod /generate fehlgeschlagen' }, { status: 502 });
    }

    const safeName = (set.personName || 'lora').replace(/[^a-z0-9_-]+/gi, '_');
    const file = new File([blob], `${safeName}-${Date.now()}.png`, { type: 'image/png' });
    const up = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file });
    const imageUrl = up?.file_url;
    if (!imageUrl) return Response.json({ error: 'Bild ließ sich nicht ablegen.' }, { status: 500 });
    return Response.json({ imageUrl });
  } catch (error) {
    console.error('runpodGenerate', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}