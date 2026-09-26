import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';
import {
  COIN_VALUE,
  COIN_PACKAGES,
  DAILY_BONUS,
  getOrCreateWallet,
  creditCoins,
  debitCoins,
} from '../../shared/coins.ts';

// The coin "Börse": balance + history, daily bonus, spending, and topping up via Stripe.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'get');

    if (action === 'get') {
      const wallet = await getOrCreateWallet(base44, user.id);
      const entries = await base44.asServiceRole.entities.CoinLedger.filter(
        { userId: user.id },
        '-created_date',
        50,
      );
      const daily = await base44.asServiceRole.entities.CoinLedger.filter(
        { userId: user.id, sourceId: 'daily' },
        '-created_date',
        1,
      );
      const lastDaily = daily[0] ? new Date(daily[0].created_date).getTime() : 0;

      return Response.json({
        balance: wallet.balance,
        coinValueInCurrency: COIN_VALUE,
        packages: COIN_PACKAGES,
        dailyBonus: DAILY_BONUS,
        dailyAvailable: Date.now() - lastDaily > 24 * 60 * 60 * 1000,
        entries,
      });
    }

    if (action === 'daily') {
      const daily = await base44.asServiceRole.entities.CoinLedger.filter(
        { userId: user.id, sourceId: 'daily' },
        '-created_date',
        1,
      );
      const lastDaily = daily[0] ? new Date(daily[0].created_date).getTime() : 0;
      if (Date.now() - lastDaily < 24 * 60 * 60 * 1000) {
        return Response.json({ error: 'Tagesbonus schon geholt' }, { status: 400 });
      }

      const balance = await creditCoins(base44, user.id, DAILY_BONUS, 'BONUS', 'Täglicher Bonus', 'daily');
      return Response.json({ balance, credited: DAILY_BONUS });
    }

    if (action === 'spend') {
      const amount = Math.round(Number(body.amount));
      if (!Number.isFinite(amount) || amount <= 0) {
        return Response.json({ error: 'Ungültiger Betrag' }, { status: 400 });
      }

      const result = await debitCoins(
        base44,
        user.id,
        amount,
        'CONTENT',
        String(body.description || 'Freischaltung').slice(0, 120),
      );
      if (result.error) return Response.json({ error: result.error }, { status: 400 });

      return Response.json({ balance: result.balance, spent: amount });
    }

    if (action === 'purchase') {
      const pkg = COIN_PACKAGES.find((p) => p.id === body.packageId);
      if (!pkg) return Response.json({ error: 'Unbekanntes Paket' }, { status: 400 });

      const tx = await base44.entities.Transaction.create({
        userId: user.id,
        type: 'COIN_PURCHASE',
        amount: pkg.price,
        currency: 'EUR',
        status: 'PENDING',
        provider: 'stripe',
      });

      const origin = req.headers.get('origin') || 'https://artanis-triania-live.base44.app';
      const params = new URLSearchParams();
      params.set('mode', 'payment');
      params.set('line_items[0][price_data][currency]', 'eur');
      params.set('line_items[0][price_data][product_data][name]', pkg.coins + ' Coins');
      params.set('line_items[0][price_data][unit_amount]', String(Math.round(pkg.price * 100)));
      params.set('line_items[0][quantity]', '1');
      params.set('success_url', origin + '/coins?checkout=success');
      params.set('cancel_url', origin + '/coins?checkout=cancel');
      params.set('metadata[base44_app_id]', secrets.get('BASE44_APP_ID') || '');
      params.set('metadata[kind]', 'coins');
      params.set('metadata[user_id]', user.id);
      params.set('metadata[coins]', String(pkg.coins));
      params.set('metadata[transaction_id]', tx.id);

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
        console.error('Stripe coin checkout error', data && data.error && data.error.message);
        return Response.json(
          { error: (data && data.error && data.error.message) || 'Stripe Fehler' },
          { status: 400 },
        );
      }

      await base44.entities.Transaction.update(tx.id, { providerId: data.id });
      return Response.json({ url: data.url, transactionId: tx.id });
    }

    return Response.json({ error: 'Unbekannte Aktion' }, { status: 400 });
  } catch (error) {
    console.error('coinWallet failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}