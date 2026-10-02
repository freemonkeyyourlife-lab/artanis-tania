import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { therapySummaryPrompt } from '../../shared/therapySummary.ts';

// Die Erzählerin schreibt die Zusammenfassung der Sitzung — und sie landet
// direkt im Profil des Nutzers, damit die Erzähler beim nächsten Mal daran anknüpfen.
// Läuft am Sitzungsende automatisch (Workflow) und auf Wunsch auch von Hand.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const body = await req.json();
    const sessionId = body?.sessionId;
    if (!sessionId) return Response.json({ error: 'sessionId fehlt.' }, { status: 400 });

    const session = await db.TherapySession.get(sessionId);
    if (!session) return Response.json({ error: 'Sitzung nicht gefunden.' }, { status: 404 });
    // Ohne angemeldeten Nutzer kommt der Aufruf aus der Automatik am Sitzungsende.
    if (!user && session.status !== 'DONE') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const msgRes = await db.TherapyMessage.filter({ sessionId });
    const messages = Array.isArray(msgRes) ? msgRes : (msgRes?.items || []);
    if (messages.length === 0) return Response.json({ error: 'Diese Sitzung hat noch nichts gesagt.' }, { status: 400 });

    const narRes = await db.Narrator.filter({ active: { $ne: false } });
    const narrators = (Array.isArray(narRes) ? narRes : (narRes?.items || []))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice(0, 2);

    const prompt = therapySummaryPrompt({ session, narrators, messages });
    const raw = user
      ? await base44.integrations.Core.InvokeLLM({ prompt })
      : await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const summary = String(typeof raw === 'string' ? raw : (raw?.response || raw?.text || raw?.output || '')).trim();
    if (!summary) return Response.json({ error: 'Die Erzählerin hat nichts geschrieben.' }, { status: 502 });

    const summaryBy = narrators.map((n) => n.name).join(' & ') || 'Erzählerin';
    const at = new Date().toISOString();
    const updated = await db.TherapySession.update(sessionId, { summary, summaryBy, summaryAt: at });

    // Ins Profil: dort liegen alle Zusammenfassungen beisammen.
    const ownerId = session.userId || session.created_by_id;
    if (ownerId) {
      const prefRes = await db.UserPreference.filter({ userId: ownerId });
      const prefs = Array.isArray(prefRes) ? prefRes : (prefRes?.items || []);
      const entry = { sessionId, topic: session.topic || '', summaryBy, at, summary };
      if (prefs[0]) {
        const kept = (prefs[0].therapySummaries || []).filter((e) => e && e.sessionId !== sessionId);
        await db.UserPreference.update(prefs[0].id, { therapySummaries: [...kept, entry] });
      } else {
        await db.UserPreference.create({ userId: ownerId, therapySummaries: [entry] });
      }
    }

    return Response.json({ summary, summaryBy, session: updated });
  } catch (error) {
    console.log('therapySummary error', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}