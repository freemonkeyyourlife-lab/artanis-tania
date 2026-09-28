import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { buildHandoverPrompt } from '../../shared/handoverPrompt.ts';

// So lange darf der echte Charakter selbst antworten, bevor die KI einspringt.
const OVERDUE_MS = 3 * 60 * 1000;
const MAX_PER_RUN = 5;

// Springt ein, wenn ein Gast wartet und niemand antwortet — auch wenn sein Tab längst zu ist.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    // Aus dem Zeitplan kommt kein Nutzer mit — dann läuft der Aufruf als System.
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const now = Date.now();
    const convs = await base44.asServiceRole.entities.Conversation.filter({ conversationType: 'AI' }, '-lastMessageAt', 50);
    const due = convs
      .filter((c) => c.waitingSince && c.handledBy !== 'HUMAN' && now - new Date(c.waitingSince).getTime() >= OVERDUE_MS)
      .slice(0, MAX_PER_RUN);

    const taken = [];
    for (const conv of due) {
      const recent = await base44.asServiceRole.entities.Message.filter({ conversationId: conv.id }, '-created_date', 20);
      const newest = recent[0];
      // Kein offener Gast-Beitrag: hier gibt es nichts zu übernehmen.
      if (!newest || newest.senderType !== 'HUMAN') {
        await base44.asServiceRole.entities.Conversation.update(conv.id, { waitingSince: null });
        continue;
      }

      const creators = await base44.asServiceRole.entities.Creator.filter({ stageName: conv.creatorName });
      const ordered = [...recent].reverse();
      const history = ordered
        .map((m) => (m.senderType === 'HUMAN' ? 'Gast' : (conv.creatorName || 'Du')) + ': ' + (m.text || '[Bild]'))
        .join('\n');

      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: buildHandoverPrompt(creators[0], conv, history),
      });
      const raw = typeof res === 'string' ? res : (res && (res.response || res.text || res.output)) || '';
      if (!raw.trim()) continue;

      const suggestMatch = raw.match(/\[SUGGEST:([^\]]*)\]/i);
      const suggestions = suggestMatch
        ? suggestMatch[1].split('|').map((s) => s.trim()).filter(Boolean).slice(0, 4)
        : [];
      const text = raw
        .replace(/\[SUGGEST:[^\]]*\]/gi, '')
        .replace(/\[SEND_[A-Z]+:[^\]]*\]/gi, '')
        .trim();
      if (!text) continue;

      await base44.asServiceRole.entities.Message.create({
        conversationId: conv.id,
        sender: conv.creatorName || 'Charakter',
        senderType: 'AI',
        text,
        suggestions,
      });
      await base44.asServiceRole.entities.Conversation.update(conv.id, {
        lastMessageAt: new Date().toISOString(),
        waitingSince: null,
      });
      taken.push(conv.id);
    }

    return Response.json({ ok: true, checked: convs.length, taken: taken.length });
  } catch (error) {
    console.error('aiHandover error: ' + (error && error.message));
    return Response.json({ error: error && error.message }, { status: 500 });
  }
}