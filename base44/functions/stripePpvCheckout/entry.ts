import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';

// Creates a Stripe Checkout Session for a paid chat unlock (PPV).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const label = String(body.label || 'Freischaltung').slice(0, 120);
    const creatorId = body.creatorId ? String(body.creatorId) : '';

    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: 'Ungültiger Betrag' }, { status: 400 });
    }

    const tx = await base44.entities.Transaction.create({
      userId: user.id,
      type: 'PPV',
      amount,
      currency: 'EUR',
      status: 'PENDING',
      provider: 'stripe',
      contentId: creatorId,
    });

    const origin = req.headers.get('origin') || 'https://artanis-tania-live.base44.app';
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('line_items[0][price_data][currency]', 'eur');
    params.set('line_items[0][price_data][product_data][name]', label);
    params.set('line_items[0][price_data][unit_amount]', String(Math.round(amount * 100)));
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', origin + '/messages?checkout=success');
    params.set('cancel_url', origin + '/messages?checkout=cancel');
    params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');
    params.set('metadata[transaction_id]', tx.id);

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
        'Stripe-Version': '2025-10-29.clover',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: params.toString(),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error('Stripe checkout error', data && data.error && data.error.message);
      return Response.json({ error: (data && data.error && data.error.message) || 'Stripe Fehler' }, { status: 400 });
    }

    await base44.entities.Transaction.update(tx.id, { providerId: data.id });
    return Response.json({ url: data.url, transactionId: tx.id });
  } catch (error) {
    console.error('stripePpvCheckout failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}