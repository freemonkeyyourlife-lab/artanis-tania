import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { runJob } from '../../shared/runpod.ts';

// Trainings-Pipeline — Schritt 4 (GPU): ein fertiges Set (>= Ziel, Status
// BEREIT) an den RunPod-Serverless-Endpoint schicken. Die 12 Bilder werden
// zu temporär signierten URLs gemacht, damit die GPU sie laden kann.
// Das fertige LoRA (.safetensors) holt runpodStatus später ab.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Nur Admin' }, { status: 403 });

    const { setId } = await req.json().catch(() => ({}));
    if (!setId) return Response.json({ error: 'setId fehlt' }, { status: 400 });

    const set = await base44.asServiceRole.entities.TrainingSet.get(setId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!set) return Response.json({ error: 'Set nicht gefunden' }, { status: 404 });

    // Alle Bilder (echte + erzeugte) zusammenfassen — aussortierte (andere
    // Person) wegwerfen und das Fokus-Bild nach vorne, damit das Modell die
    // richtige Person lernt.
    const ex = new Set(set.excludeImages || []);
    const all = [...(set.images || []), ...(set.generatedImages || [])].filter(Boolean).filter((u) => !ex.has(u));
    const ordered = set.focusImage && all.includes(set.focusImage)
      ? [set.focusImage, ...all.filter((u) => u !== set.focusImage)]
      : all;
    if (ordered.length < 1) {
      return Response.json({ error: 'Set hat keine Bilder — erst auffüllen oder Ausschluss prüfen.' }, { status: 400 });
    }

    // Private Uris zu temporär signierten öffentlichen URLs machen, damit
    // die RunPod-GPU sie ohne Anmeldung laden kann.
    const imageUrls = [];
    for (const u of ordered) {
      if (u.startsWith('http')) { imageUrls.push(u); continue; }
      const s = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: u, expires_in: 7200,
      }).catch(() => null);
      if (s?.signed_url) imageUrls.push(s.signed_url);
    }
    if (!imageUrls.length) {
      return Response.json({ error: 'Bilder ließen sich nicht freigeben.' }, { status: 500 });
    }

    const trigger = (set.personName || 'person').trim();
    const params = {
      name: trigger,
      trigger_word: trigger,
      images: imageUrls,
      steps: 1200,
      base_model: 'stable-diffusion-xl-base-1.0',
    };

    const jobId = await runJob(params);

    await base44.asServiceRole.entities.TrainingSet.update(set.id, {
      trainJobId: jobId,
      trainStatus: 'LÄUFT',
      trainError: '',
      trainParams: params,
    });

    return Response.json({ ok: true, jobId, trainStatus: 'LÄUFT' });
  } catch (error) {
    console.error('runpodTrain', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}