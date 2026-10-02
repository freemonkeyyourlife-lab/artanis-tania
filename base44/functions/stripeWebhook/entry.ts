import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import Stripe from 'npm:stripe@17';
import { secrets } from 'base44:runtime';
import { creditCoins } from '../../shared/coins.ts';

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
      const meta = session.metadata || {};

      // Coin top-up: credit the buyer's wallet.
      if (meta.kind === 'coins' && meta.user_id) {
        const coins = parseInt(meta.coins, 10);
        if (Number.isFinite(coins) && coins > 0) {
          await creditCoins(base44, meta.user_id, coins, 'PURCHASE', coins + ' Coins gekauft');
        }
      }

      // Einmaliger Zahlungslink oder Aufgabe: als bezahlt markieren.
      // Ein Abo bleibt offen — es wiederholt sich, also muss der Link nutzbar bleiben.
      if (meta.kind === 'payment_link' && meta.link_id) {
        const lastPayer = {
          paidBy: meta.payer_id || '',
          paidByName: meta.payer_name || '',
          paidAt: new Date().toISOString(),
          transactionId: meta.transaction_id || '',
        };
        if (meta.billing_type === 'RECURRING') {
          await base44.asServiceRole.entities.PaymentLink.update(meta.link_id, lastPayer);
        } else {
          await base44.asServiceRole.entities.PaymentLink.update(meta.link_id, {
            ...lastPayer,
            status: 'PAID',
            active: false,
          });
        }
      }

      if (meta.transaction_id) {
        await base44.asServiceRole.entities.Transaction.update(meta.transaction_id, { status: 'PAID', providerId: session.id });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}