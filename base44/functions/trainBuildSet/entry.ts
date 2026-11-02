import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Trainings-Pipeline — Schritt 2: fuer einen Charakter alle Bild-Quellen aus
// dem Archiv sammeln und das Trainingsset aufbauen bzw. auffrischen. Sobald genug
// Bilder (>= TARGET) vorhanden sind, wird der Status auf BEREIT gesetzt — dann
// ist das Set bereit fuer die GPU-Anbindung.
const TARGET = 12;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Nur Admin' }, { status: 403 });

    let { characterName, characterId } = await req.json().catch(() => ({}));
    if (!characterName && !characterId) return Response.json({ error: 'characterName/Id fehlt' }, { status: 400 });

    // Nur den Namen haben → Charakter nachladen, falls vorhanden.
    if (!characterName && characterId) {
      const c = await base44.asServiceRole.entities.Character.get(characterId)
        .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      characterName = c?.name || characterName || 'Charakter';
    }

    // Alle Bild-/GIF-Quellen des Charakters sammeln.
    const filter = characterId
      ? { characterId, kind: { $in: ['BILD', 'GIF'] } }
      : { characterName, kind: { $in: ['BILD', 'GIF'] } };
    const page = await base44.asServiceRole.entities.Quelle.filter(filter, { limit: 200 });
    const items = page.items || page || [];
    const images = items.map((q) => q.fileUri || q.url).filter(Boolean);

    const status = images.length >= TARGET ? 'BEREIT' : 'SAMMLUNG';

    // Bestehendes Set fuer die Person suchen (TrainingSet hat kein characterId-Feld).
    const existing = await base44.asServiceRole.entities.TrainingSet.filter({ personName: characterName }, { limit: 1 });
    const setList = existing.items || existing || [];

    let set;
    if (setList.length) {
      set = await base44.asServiceRole.entities.TrainingSet.update(setList[0].id, {
        images,
        avatar: images[0] || setList[0].avatar || '',
        status,
        targetCount: TARGET,
      });
    } else {
      set = await base44.asServiceRole.entities.TrainingSet.create({
        personName: characterName,
        name: `Auto-Set ${characterName}`,
        images,
        generatedImages: [],
        sourceMedia: [],
        avatar: images[0] || '',
        targetCount: TARGET,
        status,
      });
    }

    return Response.json({ ok: true, setId: set.id, count: images.length, status, characterName });
  } catch (error) {
    console.error('trainBuildSet', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}