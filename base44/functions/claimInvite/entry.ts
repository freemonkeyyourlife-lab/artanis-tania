import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// A user opens the app through an invite link (?invite=token) and receives the
// status the admin attached to that link — GOLD means everything is free.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    const body = await req.json().catch(() => ({}));
    const token = String(body.token || '').trim();
    if (!token) return Response.json({ error: 'Kein Token' }, { status: 400 });

    const found = await base44.asServiceRole.entities.InviteLink.filter({ token });
    const invite = found[0];
    if (!invite) return Response.json({ error: 'Einladung nicht gefunden' }, { status: 404 });
    if (invite.active === false) return Response.json({ error: 'Einladung ist deaktiviert' }, { status: 400 });
    if (invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now()) {
      return Response.json({ error: 'Einladung ist abgelaufen' }, { status: 400 });
    }

    const claimedBy = invite.claimedBy || [];
    const grantStatus = invite.grantStatus || 'GOLD';
    const maxUses = Number(invite.maxUses) || 0;

    // Besucher ohne Konto: der Status wird im Browser gespeichert statt am User.
    // Nur bei unbegrenzten Einladungen, sonst könnte man die Grenze umgehen.
    if (!user) {
      if (maxUses > 0) return Response.json({ error: 'Bitte zuerst anmelden' }, { status: 401 });
      return Response.json({ status: grantStatus, label: invite.label || null, anonymous: true });
    }

    if (claimedBy.includes(user.id)) {
      return Response.json({ status: grantStatus, label: invite.label || null, already: true });
    }

    if (maxUses > 0 && claimedBy.length >= maxUses) {
      return Response.json({ error: 'Einladung ist aufgebraucht' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(user.id, { memberStatus: grantStatus });
    await base44.asServiceRole.entities.InviteLink.update(invite.id, {
      claimedBy: [...claimedBy, user.id],
      useCount: (invite.useCount || 0) + 1,
      registrationCount: (invite.registrationCount || 0) + 1,
    });

    return Response.json({ status: grantStatus, label: invite.label || null });
  } catch (error) {
    console.error('claimInvite failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}