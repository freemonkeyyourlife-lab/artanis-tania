import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const APP_URL = "https://artanis-triania-live.base44.app";

// Schickt eine Meldung an alle Admins — aufgerufen von den Automatik-Regeln.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Automatik-Aufrufe kommen ohne Nutzer-Kontext; ein angemeldeter Nutzer muss Admin sein.
    let allowed = true;
    try {
      const user = await base44.auth.me();
      allowed = !user || user.role === "admin";
    } catch (e) {
      allowed = true;
    }
    if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { title, message, link } = await req.json();
    if (!title) return Response.json({ error: 'title required' }, { status: 400 });

    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
    const recipients = admins.map((a) => a.email).filter(Boolean);
    if (recipients.length === 0) return Response.json({ ok: true, sent: 0 });

    const url = link ? APP_URL + link : APP_URL;
    const subject = "ARTANIS × TRIANIA — " + title;
    const body =
      title + "\n\n" +
      (message ? message + "\n\n" : "") +
      "Direkt öffnen: " + url + "\n\n" +
      "Automatische Meldung aus deiner App.";

    let sent = 0;
    for (let i = 0; i < recipients.length; i++) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: recipients[i], subject, body });
        sent++;
      } catch (e) {
        console.error("SendEmail failed for recipient #" + i + ": " + (e && e.message));
      }
    }

    return Response.json({ ok: true, sent });
  } catch (error) {
    console.error("notifyAdmin error: " + (error && error.message));
    return Response.json({ error: error && error.message }, { status: 500 });
  }
}