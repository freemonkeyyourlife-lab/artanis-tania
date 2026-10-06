import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const APP_URL = "https://artanis-tania-live.base44.app";
const COOLDOWN_MS = 5 * 60 * 1000;

// Ein Gast wartet im Chat — die Admins bekommen eine Mail (und Push, wenn die App installiert ist).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await req.json();
    if (!conversationId) return Response.json({ error: 'conversationId required' }, { status: 400 });

    const conv = await base44.asServiceRole.entities.Conversation.get(conversationId);
    // Nur der Gast selbst darf diese Meldung auslösen — und nur für sein eigenes Gespräch.
    if (!conv || conv.userId !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const last = conv.notifiedAt ? new Date(conv.notifiedAt).getTime() : 0;
    if (Date.now() - last < COOLDOWN_MS) return Response.json({ ok: true, skipped: true });

    await base44.asServiceRole.entities.Conversation.update(conversationId, { notifiedAt: new Date().toISOString() });

    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
    const link = APP_URL + "/leitstand";
    const who = conv.userName || "Ein Gast";
    const with_whom = conv.creatorName || "einem Charakter";
    const subject = "ARTANIS × TANIA — jemand wartet im Chat";
    const body =
      who + " will mit " + with_whom + " chatten und wartet auf dich.\n\n" +
      "Übernehmen: " + link + "\n\n" +
      "Antwortest du nicht, übernimmt die KI von selbst — bist du nicht da, sofort.";

    let sent = 0;
    for (const admin of admins) {
      if (admin.email) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({ to: admin.email, subject, body });
          sent++;
        } catch (e) {
          console.error("SendEmail failed for admin #" + admin.id + ": " + (e && e.message));
        }
      }
      // Push braucht einen nativen App-Build mit eingerichteten Push-Zugangsdaten.
      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: admin.id,
          title: "Jemand wartet im Chat",
          content: who + " will mit " + with_whom + " chatten.",
          action_label: "Leitstand",
          action_url: link,
        });
      } catch (e) {
        console.error("Push failed for admin #" + admin.id + ": " + (e && e.message));
      }
    }

    return Response.json({ ok: true, sent });
  } catch (error) {
    console.error("notifyWaitingChat error: " + (error && error.message));
    return Response.json({ error: error && error.message }, { status: 500 });
  }
}