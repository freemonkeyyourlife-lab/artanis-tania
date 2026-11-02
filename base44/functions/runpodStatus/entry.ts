import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getStatus } from '../../shared/runpod.ts';

// Trainings-Pipeline — Schritt 4 (GPU): Status des Pod-Jobs abholen.
// Bei COMPLETED wird das .safetensors vom Pod geladen und stored privately
// abgelegt; das Set geht auf TRAINIERT. Bei FAILED wird der Fehler
// gespeichert. Der Aufruf ist idempotent — schon fertige Sets bleiben so.
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

    // Schon fertig — nichts zu tun.
    if (set.trainStatus === 'FERTIG' && set.modelUri) {
      return Response.json({ ok: true, trainStatus: 'FERTIG', modelUri: set.modelUri });
    }
    if (!set.trainJobId) {
      return Response.json({ error: 'Kein Trainings-Job hinterlegt.' }, { status: 400 });
    }

    let status, error, modelUrl;
    try {
      ({ status, error, model_url: modelUrl } = await getStatus(set.trainJobId));
    } catch (e) {
      // Pod nicht erreichbar / falsch konfiguriert — kein harter 500,
      // sondern sauber zurückmelden, damit die Abfrage weiterlaufen kann.
      return Response.json({ ok: false, trainStatus: 'LÄUFT', transient: true, error: e.message });
    }

    if (status === 'queued' || status === 'running') {
      return Response.json({ ok: true, trainStatus: 'LÄUFT', runpod: status });
    }

    if (status === 'completed') {
      if (!modelUrl) {
        await base44.asServiceRole.entities.TrainingSet.update(set.id, {
          trainStatus: 'FEHLER',
          trainError: 'Job fertig, aber keine Modell-URL vom Pod.',
        });
        return Response.json({ ok: false, trainStatus: 'FEHLER', error: 'no model url' }, { status: 502 });
      }
      // Modell vom Pod herunterladen und stored privately ablegen.
      const blob = await fetch(modelUrl, { signal: AbortSignal.timeout(120000) })
        .then((r) => r.blob()).catch(() => null);
      if (!blob) {
        await base44.asServiceRole.entities.TrainingSet.update(set.id, {
          trainStatus: 'FEHLER',
          trainError: 'Modell ließ sich nicht vom Pod laden.',
        });
        return Response.json({ ok: false, trainStatus: 'FEHLER', error: 'download failed' }, { status: 502 });
      }
      const file = new File([blob], `${set.personName || 'lora'}.safetensors`, { type: 'application/octet-stream' });
      const up = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
      const modelUri = up?.file_uri || '';
      await base44.asServiceRole.entities.TrainingSet.update(set.id, {
        modelUri,
        modelUrl: '',
        trainStatus: 'FERTIG',
        trainError: '',
        status: 'TRAINIERT',
      });
      return Response.json({ ok: true, trainStatus: 'FERTIG', modelUri });
    }

    // failed / sonstiges.
    const msg = error || status || 'unbekannt';
    await base44.asServiceRole.entities.TrainingSet.update(set.id, {
      trainStatus: 'FEHLER',
      trainError: String(msg),
    });
    return Response.json({ ok: false, trainStatus: 'FEHLER', error: String(msg) }, { status: 502 });
  } catch (error) {
    console.error('runpodStatus', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}