import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// Die zentrale Schnittstelle zu OpenRouter: Text- und Bild-Modelle über einen
// Schlüssel. Jede Abfrage wird mit Modell, Tokens und Kosten festgehalten,
// damit im Admin-Bereich sichtbar ist, wohin das Guthaben fließt.

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// Modelle liefern JSON mal als reines JSON, mal in Fließtext eingebettet.
function firstJson(raw) {
  const text = String(raw || '');
  try {
    return JSON.parse(text);
  } catch (e) {
    // kein reines JSON — unten weitersuchen
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const action = body.action === 'image' ? 'image' : 'chat';
    const model = String(body.model || '').trim();
    const prompt = String(body.prompt || '').trim();
    if (!model) return Response.json({ error: 'Modell fehlt.' }, { status: 400 });
    if (!prompt) return Response.json({ error: 'Anfrage fehlt.' }, { status: 400 });

    const messages = [];
    if (body.system) messages.push({ role: 'system', content: String(body.system) });
    messages.push({ role: 'user', content: prompt });

    const build = (withFormat) => {
      const payload = { model, messages, usage: { include: true } };
      if (action === 'image') payload.modalities = ['image', 'text'];
      if (withFormat) payload.response_format = { type: 'json_object' };
      if (typeof body.temperature === 'number') payload.temperature = body.temperature;
      return payload;
    };

    const send = (payload) =>
      fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secrets.get('OPENROUTER_API_KEY')}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://artanis-tania-live.base44.app',
          'X-Title': 'Artanis x Tania',
        },
        body: JSON.stringify(payload),
      });

    // Nicht jedes Modell kann erzwungenes JSON — dann ein zweiter Versuch ohne.
    let wantJson = action === 'chat' && body.jsonSchema === true;
    let res = await send(build(wantJson));
    if (!res.ok && wantJson) {
      wantJson = false;
      res = await send(build(false));
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.error?.message || `OpenRouter ${res.status}`;
      console.log('openRouter error', model, res.status, message);
      return Response.json({ error: message }, { status: 502 });
    }

    const answer = data?.choices?.[0]?.message || {};
    const usage = data?.usage || {};
    const text = typeof answer.content === 'string' ? answer.content : '';
    const imageUrl = (answer.images || [])[0]?.image_url?.url || null;
    const costUsd = typeof usage.cost === 'number' ? usage.cost : 0;

    try {
      await base44.asServiceRole.entities.AiUsage.create({
        provider: 'OPENROUTER',
        modelId: model,
        modelName: data?.model || model,
        kind: body.kind || (action === 'image' ? 'BILD' : 'TEXT'),
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        costUsd,
        userName: user.full_name || user.email || '',
        success: true,
        note: String(body.note || '').slice(0, 200),
      });
    } catch (logError) {
      console.log('AiUsage nicht gespeichert', logError.message);
    }

    return Response.json({
      text,
      json: wantJson ? firstJson(text) : null,
      imageUrl,
      model: data?.model || model,
      costUsd,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
    });
  } catch (error) {
    console.log('openRouter failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}