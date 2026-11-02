import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Trainings-Pipeline — Schritt 1: eine neue Archiv-Quelle automatisch dem
// passenden Charakter zuordnen. Der Charakter wird am Namen/Tag erkannt
// (wie im Archiv per Dateiname), characterId + characterName gesetzt und
// ein "auto-zugeordnet"-Tag angehaengt. Schon zugeordnete Quellen bleiben unberuehrt.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Nur Admin' }, { status: 403 });

    const { quelleId } = await req.json().catch(() => ({}));
    if (!quelleId) return Response.json({ error: 'quelleId fehlt' }, { status: 400 });

    const quelle = await base44.asServiceRole.entities.Quelle.get(quelleId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!quelle) return Response.json({ error: 'Quelle nicht gefunden' }, { status: 404 });

    // Schon zugeordnet — nichts zu tun, aber den Namen fuer den naechsten Schritt melden.
    if (quelle.characterId) {
      return Response.json({ ok: true, tagged: false, characterId: quelle.characterId, characterName: quelle.characterName || '' });
    }

    const charsPage = await base44.asServiceRole.entities.Character.list({ limit: 200 });
    const chars = charsPage.items || charsPage || [];
    const hay = `${quelle.name || ''} ${(quelle.tags || []).join(' ')} ${quelle.note || ''}`.toLowerCase();
    const hit = chars.find((c) => c.name && hay.includes(c.name.toLowerCase()));

    if (!hit) {
      return Response.json({ ok: true, tagged: false, characterId: null, characterName: null, reason: 'kein treffer' });
    }

    const tags = [...new Set([...(quelle.tags || []), 'auto-zugeordnet', hit.name])];
    const updated = await base44.asServiceRole.entities.Quelle.update(quelleId, {
      characterId: hit.id,
      characterName: hit.name,
      tags,
    });
    return Response.json({ ok: true, tagged: true, characterId: hit.id, characterName: hit.name, quelle: updated });
  } catch (error) {
    console.error('trainTagQuelle', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}