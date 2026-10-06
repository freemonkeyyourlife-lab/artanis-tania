import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';

// Zahlungslinks & Aufgaben: Link für einen beliebigen Betrag erzeugen und bezahlen.
const MAX_AMOUNT = 2000;

function makeToken() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

function publicLink(link) {
  return {
    id: link.id,
    token: link.token,
    title: link.title,
    description: link.description || '',
    amount: link.amount,
    currency: link.currency || 'EUR',
    kind: link.kind || 'LINK',
    billingType: link.billingType || 'ONE_TIME',
    interval: link.interval || 'MONTH',
    creatorName: link.creatorName || '',
    targetName: link.targetName || '',
    status: link.status || 'OPEN',
    paidByName: link.paidByName || '',
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'get');
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (action === 'create') {
      const amount = Math.round(Number(body.amount) * 100) / 100;
      const title = String(body.title || '').trim().slice(0, 120);
      if (!title) return Response.json({ error: 'Sag kurz, wofür.' }, { status: 400 });
      if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
        return Response.json({ error: 'Ungültiger Betrag' }, { status: 400 });
      }

      const isTask = body.kind === 'TASK';
      const isRecurring = body.billingType === 'RECURRING';
      const interval = ['WEEK', 'MONTH', 'YEAR'].includes(String(body.interval))
        ? String(body.interval)
        : 'MONTH';
      const link = await base44.entities.PaymentLink.create({
        token: makeToken(),
        title,
        description: String(body.description || '').slice(0, 600),
        amount,
        currency: 'EUR',
        kind: isTask ? 'TASK' : 'LINK',
        billingType: isRecurring ? 'RECURRING' : 'ONE_TIME',
        interval,
        creatorId: user.id,
        creatorName: user.full_name || user.email,
        targetName: String(body.targetName || '').slice(0, 120),
        visibility: isTask ? 'PUBLIC' : 'PRIVATE',
        status: 'OPEN',
        active: true,
      });

      return Response.json({ link: publicLink(link) });
    }

    if (action === 'get') {
      const token = String(body.token || '');
      const found = await base44.asServiceRole.entities.PaymentLink.filter({ token }, '-created_date', 1);
      if (!found[0]) return Response.json({ error: 'Nicht gefunden' }, { status: 404 });
      return Response.json({ link: publicLink(found[0]) });
    }

    if (action === 'checkout') {
      const token = String(body.token || '');
      const found = await base44.asServiceRole.entities.PaymentLink.filter({ token }, '-created_date', 1);
      const link = found[0];
      if (!link) return Response.json({ error: 'Nicht gefunden' }, { status: 404 });
      if (link.status !== 'OPEN') return Response.json({ error: 'Nicht mehr offen' }, { status: 400 });

      const tx = await base44.asServiceRole.entities.Transaction.create({
        userId: user.id,
        type: 'CUSTOM_CONTENT',
        amount: link.amount,
        currency: link.currency || 'EUR',
        status: 'PENDING',
        provider: 'stripe',
        contentId: link.id,
      });

      const appId = secrets.get('BASE44_APP_ID') || '';
      const recurring = link.billingType === 'RECURRING';

      const origin = req.headers.get('origin') || 'https://artanis-tania-live.base44.app';
      const params = new URLSearchParams();
      params.set('mode', recurring ? 'subscription' : 'payment');
      params.set('line_items[0][price_data][currency]', 'eur');
      params.set('line_items[0][price_data][product_data][name]', link.title.slice(0, 120));
      params.set('line_items[0][price_data][unit_amount]', String(Math.round(link.amount * 100)));
      params.set('line_items[0][quantity]', '1');
      if (recurring) {
        params.set('line_items[0][price_data][recurring][interval]', (link.interval || 'MONTH').toLowerCase());
      }
      params.set('success_url', origin + '/pay/' + link.token + '?checkout=success');
      params.set('cancel_url', origin + '/pay/' + link.token + '?checkout=cancel');
      params.set('metadata[base44_app_id]', appId);
      params.set('metadata[kind]', 'payment_link');
      params.set('metadata[billing_type]', recurring ? 'RECURRING' : 'ONE_TIME');
      params.set('metadata[link_id]', link.id);
      params.set('metadata[payer_id]', user.id);
      params.set('metadata[payer_name]', (user.full_name || user.email || '').slice(0, 120));
      params.set('metadata[transaction_id]', tx.id);
      if (recurring) {
        params.set('subscription_data[metadata][base44_app_id]', appId);
        params.set('subscription_data[metadata][link_id]', link.id);
        params.set('subscription_data[metadata][payer_id]', user.id);
      }

      const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + secrets.get('STRIPE_SECRET_KEY'),
          'Stripe-Version': '2025-10-29.clover',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: params.toString(),
      });

      const data = await resp.json();
      if (!resp.ok) {
        console.error('paymentLink checkout error', data && data.error && data.error.message);
        return Response.json(
          { error: (data && data.error && data.error.message) || 'Stripe Fehler' },
          { status: 400 },
        );
      }

      await base44.asServiceRole.entities.Transaction.update(tx.id, { providerId: data.id });
      return Response.json({ url: data.url, transactionId: tx.id });
    }

    if (action === 'cancel') {
      const id = String(body.id || '');
      const link = await base44.entities.PaymentLink.get(id).catch(() => null);
      if (!link) return Response.json({ error: 'Nicht gefunden' }, { status: 404 });
      if (link.creatorId !== user.id && user.role !== 'admin') {
        return Response.json({ error: 'Nur der Ersteller' }, { status: 403 });
      }
      await base44.entities.PaymentLink.update(id, { status: 'CANCELLED', active: false });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unbekannte Aktion' }, { status: 400 });
  } catch (error) {
    console.error('paymentLink failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}