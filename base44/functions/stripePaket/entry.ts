import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';

// Godmode-Paketverwaltung: legt Stripe-Produkte + Preise + offene Zahlungslinks
// fuer VIP-Abos und Story-Kapitel-Einzelkaeufe an. Preise sind nur hier aenderbar.
// Stripe Checkout / Payment Links handhaben 2D (non-OTP) und 3D Secure automatisch.

const STRIPE = 'https://api.stripe.com/v1';
const VERSION = '2025-10-29.clover';

function headers(idempotency) {
  const h = {
    Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
    'Stripe-Version': VERSION,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (idempotency) h['Idempotency-Key'] = idempotency;
  return h;
}

async function stripePost(path, kv, idempotency) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(kv)) {
    if (v === undefined || v === null || v === '') continue;
    body.set(k, String(v));
  }
  const resp = await fetch(STRIPE + path, {
    method: 'POST',
    headers: headers(idempotency),
    body: body.toString(),
  });
  const data = await resp.json();
  if (!resp.ok) {
    console.error('Stripe error', path, data && data.error && data.error.message);
    throw new Error((data && data.error && data.error.message) || 'Stripe Fehler');
  }
  return data;
}

const appId = () => secrets.get('BASE44_APP_ID') || '';
const archivePrice = (id) => stripePost(`/prices/${id}`, { active: 'false' }, crypto.randomUUID()).catch(() => {});
const deactivateLink = (id) => stripePost(`/payment_links/${id}`, { active: 'false' }, crypto.randomUUID()).catch(() => {});

async function makeLink(paket) {
  return stripePost('/payment_links', {
    'line_items[0][price]': paket.stripePriceId,
    'line_items[0][quantity]': '1',
    'metadata[base44_app_id]': appId(),
    'metadata[art]': paket.art,
    'metadata[paket_name]': (paket.name || '').slice(0, 140),
  }, crypto.randomUUID());
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Nur Admin' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'list');

    if (action === 'list') {
      const page = await base44.entities.Paket.filter({}, { sort: 'order', limit: 100 });
      return Response.json({ items: page.items || [] });
    }

    if (action === 'create') {
      const name = String(body.name || '').trim().slice(0, 120);
      const art = body.art === 'KAPITEL' ? 'KAPITEL' : 'VIP_ABO';
      const wiederkehrend = art === 'VIP_ABO';
      const betragCents = Math.round(Number(body.betrag) * 100);
      const intervall = ['WEEK', 'MONTH', 'YEAR'].includes(body.intervall) ? body.intervall : 'MONTH';
      const beschreibung = String(body.beschreibung || '').slice(0, 600);
      const order = Number(body.order) || 0;
      if (!name) return Response.json({ error: 'Name fehlt' }, { status: 400 });
      if (!Number.isFinite(betragCents) || betragCents <= 0) {
        return Response.json({ error: 'Ungueltiger Betrag' }, { status: 400 });
      }

      const product = await stripePost('/products', {
        name,
        description: beschreibung,
        'metadata[base44_app_id]': appId(),
        'metadata[art]': art,
        'metadata[source]': 'paket',
      }, crypto.randomUUID());

      const priceKv = {
        product: product.id,
        currency: 'eur',
        unit_amount: betragCents,
        'metadata[base44_app_id]': appId(),
        'metadata[art]': art,
      };
      if (wiederkehrend) priceKv['recurring[interval]'] = intervall.toLowerCase();
      const price = await stripePost('/prices', priceKv, crypto.randomUUID());

      const link = await makeLink({ stripePriceId: price.id, art, name });

      const rec = await base44.entities.Paket.create({
        name, art, beschreibung,
        betragCents, waehrung: 'EUR',
        wiederkehrend, intervall: wiederkehrend ? intervall : 'MONTH',
        stripeProductId: product.id,
        stripePriceId: price.id,
        stripeLinkId: link.id,
        stripeLinkUrl: link.url,
        stripeLinkActive: true,
        aktiv: true,
        order,
      });
      return Response.json({ paket: rec });
    }

    if (action === 'updatePrice') {
      const id = String(body.id || '');
      const paket = await base44.entities.Paket.get(id).catch(() => null);
      if (!paket) return Response.json({ error: 'Nicht gefunden' }, { status: 404 });
      const betragCents = Math.round(Number(body.betrag) * 100);
      if (!Number.isFinite(betragCents) || betragCents <= 0) {
        return Response.json({ error: 'Ungueltiger Betrag' }, { status: 400 });
      }

      const priceKv = {
        product: paket.stripeProductId,
        currency: 'eur',
        unit_amount: betragCents,
        'metadata[base44_app_id]': appId(),
        'metadata[art]': paket.art,
      };
      if (paket.wiederkehrend) priceKv['recurring[interval]'] = (paket.intervall || 'MONTH').toLowerCase();
      const price = await stripePost('/prices', priceKv, crypto.randomUUID());

      const link = await makeLink({ stripePriceId: price.id, art: paket.art, name: paket.name });

      await archivePrice(paket.stripePriceId);
      if (paket.stripeLinkId) await deactivateLink(paket.stripeLinkId);

      const updated = await base44.entities.Paket.update(id, {
        betragCents,
        stripePriceId: price.id,
        stripeLinkId: link.id,
        stripeLinkUrl: link.url,
        stripeLinkActive: true,
      });
      return Response.json({ paket: updated });
    }

    if (action === 'toggleActive') {
      const id = String(body.id || '');
      const paket = await base44.entities.Paket.get(id).catch(() => null);
      if (!paket) return Response.json({ error: 'Nicht gefunden' }, { status: 404 });
      const aktiv = !paket.aktiv;
      await stripePost(`/products/${paket.stripeProductId}`, { active: aktiv ? 'true' : 'false' }, crypto.randomUUID()).catch(() => {});
      if (paket.stripeLinkId) {
        await stripePost(`/payment_links/${paket.stripeLinkId}`, { active: aktiv ? 'true' : 'false' }, crypto.randomUUID()).catch(() => {});
      }
      const updated = await base44.entities.Paket.update(id, { aktiv, stripeLinkActive: aktiv });
      return Response.json({ paket: updated });
    }

    if (action === 'newLink') {
      const id = String(body.id || '');
      const paket = await base44.entities.Paket.get(id).catch(() => null);
      if (!paket) return Response.json({ error: 'Nicht gefunden' }, { status: 404 });
      const link = await makeLink({ stripePriceId: paket.stripePriceId, art: paket.art, name: paket.name });
      if (paket.stripeLinkId) await deactivateLink(paket.stripeLinkId);
      const updated = await base44.entities.Paket.update(id, {
        stripeLinkId: link.id,
        stripeLinkUrl: link.url,
        stripeLinkActive: true,
      });
      return Response.json({ paket: updated });
    }

    if (action === 'delete') {
      const id = String(body.id || '');
      const paket = await base44.entities.Paket.get(id).catch(() => null);
      if (!paket) return Response.json({ error: 'Nicht gefunden' }, { status: 404 });
      if (paket.stripeLinkId) await deactivateLink(paket.stripeLinkId);
      await archivePrice(paket.stripePriceId);
      await stripePost(`/products/${paket.stripeProductId}`, { active: 'false' }, crypto.randomUUID()).catch(() => {});
      await base44.entities.Paket.delete(id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unbekannte Aktion' }, { status: 400 });
  } catch (error) {
    console.error('stripePaket failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}