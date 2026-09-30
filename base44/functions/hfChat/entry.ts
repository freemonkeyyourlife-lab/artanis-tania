import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Spricht über das verbundene Hugging-Face-Konto mit einem Text-Modell.
// action "models": listet alle Modelle, die über das Konto wirklich laufen.
// sonst: eine Chat-Antwort des gewählten Modells.

const ROUTER = 'https://router.huggingface.co/v1';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('hugging_face');
    const auth = { Authorization: `Bearer ${accessToken}` };

    if (body.action === 'models') {
      const listRes = await fetch(`${ROUTER}/models`, { headers: auth });
      if (!listRes.ok) return Response.json({ error: `Hugging Face (${listRes.status})` }, { status: 502 });
      const data = await listRes.json();
      const models = (data.data || []).map((m) => ({ id: m.id, provider: m.owned_by || '' }));
      return Response.json({ models });
    }

    const modelId = (body.modelId || '').trim();
    const prompt = (body.prompt || '').trim();
    if (!modelId || !prompt) return Response.json({ error: 'Modell oder Text fehlt.' }, { status: 400 });

    const messages = [];
    if (body.system) messages.push({ role: 'system', content: body.system });
    messages.push({ role: 'user', content: prompt });

    // Denk-Modelle sollen direkt antworten, nicht laut nachdenken.
    const res = await fetch(`${ROUTER}/chat/completions`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId, messages, max_tokens: 1200, temperature: 0.9, chat_template_kwargs: { enable_thinking: false } }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.log('hfChat error', modelId, res.status, text.slice(0, 300));
      return Response.json({ error: `Hugging Face (${res.status}): ${text.slice(0, 200)}` }, { status: 502 });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      return Response.json({ error: 'Antwort nicht lesbar.' }, { status: 502 });
    }

    const answer = data.choices?.[0]?.message || {};
    // Nie die Denk-Notizen des Modells in den Chat geben. Bleibt keine echte
    // Antwort übrig, kommt ein leerer Text zurück — dann antwortet die Standard-KI.
    let out = String(answer.content || '').replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();
    if (/^(here'?s a thinking process|thinking process|\*\*?analy[sz]e|okay,? (so|let me)|let me think|we need to|the user)/i.test(out)) {
      console.log('hfChat: Denk-Notizen statt Antwort verworfen', modelId);
      out = '';
    }
    return Response.json({ text: out });
  } catch (error) {
    console.log('hfChat failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}