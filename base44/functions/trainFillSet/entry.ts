import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Trainings-Pipeline — Schritt 3: ein Set mit passenden (nicht zufaelligen)
// Bildern auffuellen, bis das Ziel erreicht ist. Die Referenz ist das erste
// echte Bild des Sets plus die Aussehen-Beschreibung des Charakters, damit
// die erzeugten Bilder dieselbe Person zeigen.
const TARGET = 12;
const CAP = 8; // pro Lauf max. 8 erzeugen, damit es nicht endlos laeuft.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Nur Admin' }, { status: 403 });

    const { setId, characterName } = await req.json().catch(() => ({}));
    if (!setId && !characterName) return Response.json({ error: 'setId/characterName fehlt' }, { status: 400 });

    // Set laden — direkt oder ueber den Personennamen.
    let set = null;
    if (setId) {
      set = await base44.asServiceRole.entities.TrainingSet.get(setId)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    }
    if (!set && characterName) {
      const page = await base44.asServiceRole.entities.TrainingSet.filter({ personName: characterName }, { limit: 1 });
      set = (page.items || page || [])[0] || null;
    }
    if (!set) return Response.json({ error: 'Set nicht gefunden' }, { status: 404 });

    const target = set.targetCount || TARGET;
    const realImages = set.images || [];
    const genImages = set.generatedImages || [];
    const total = realImages.length + genImages.length;
    const need = Math.max(0, target - total);

    // Schon voll — nur den Status korrigieren.
    if (need === 0) {
      if (set.status !== 'BEREIT') {
        await base44.asServiceRole.entities.TrainingSet.update(set.id, { status: 'BEREIT' });
      }
      return Response.json({ ok: true, generated: 0, total, status: 'BEREIT' });
    }

    // Referenzbild signieren (falls privat) + Aussehen des Charakters holen.
    const refUri = realImages[0] || genImages[0];
    let refUrl = null;
    if (refUri) {
      if (refUri.startsWith('http')) {
        refUrl = refUri;
      } else {
        const s = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
          file_uri: refUri,
          expires_in: 3600,
        }).catch(() => null);
        refUrl = s?.signed_url || null;
      }
    }

    let appearance = '';
    const charsPage = await base44.asServiceRole.entities.Character.list({ limit: 200 });
    const chars = charsPage.items || charsPage || [];
    const char = chars.find((c) => c.name && c.name.toLowerCase() === (set.personName || '').toLowerCase());
    appearance = char?.appearance || '';

    const toGen = Math.min(need, CAP);
    const newGen = [...genImages];
    for (let i = 0; i < toGen; i++) {
      const prompt =
        `Porträt einer Person namens ${set.personName}. ` +
        (appearance ? `${appearance} ` : '') +
        'Neue Pose, gleiche Person, fotorealistisch, neutraler Hintergrund, gleiches Licht. Erwachsene Person, keine realen Personen.';
      try {
        const res = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt,
          existing_image_urls: refUrl ? [refUrl] : [],
        });
        if (res?.url) newGen.push(res.url);
      } catch (e) {
        console.error('trainFillSet generate', e);
      }
    }

    const newTotal = realImages.length + newGen.length;
    const status = newTotal >= target ? 'BEREIT' : 'SAMMLUNG';
    await base44.asServiceRole.entities.TrainingSet.update(set.id, {
      generatedImages: newGen,
      status,
    });
    return Response.json({ ok: true, generated: newGen.length - genImages.length, total: newTotal, status });
  } catch (error) {
    console.error('trainFillSet', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}