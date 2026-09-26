import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import Stripe from 'npm:stripe@17';
import { secrets } from 'base44:runtime';

// Stripe webhook: marks a pending PPV transaction as paid.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'), { apiVersion: '2025-10-29.clover' });

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, secrets.get('STRIPE_WEBHOOK_SECRET'));
    } catch (err) {
      console.error('Webhook signature verification failed', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const txId = session.metadata && session.metadata.transaction_id;
      if (txId) {
        await base44.asServiceRole.entities.Transaction.update(txId, { status: 'PAID', providerId: session.id });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}