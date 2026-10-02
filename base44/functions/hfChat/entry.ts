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

    // Massen-Übernahme: alles, was über das Konto wirklich antwortet, kommt in die Liste.
    // Läuft in Wellen und hört rechtzeitig auf — der Rest kommt beim nächsten Aufruf.
    if (body.action === 'importAll') {
      const listRes = await fetch(`${ROUTER}/models`, { headers: auth });
      if (!listRes.ok) return Response.json({ error: `Hugging Face (${listRes.status})` }, { status: 502 });
      const data = await listRes.json();
      const all = (data.data || []).map((m) => ({ id: m.id, provider: m.owned_by || '' }));

      const existing = await base44.entities.TextModel.list('created_date', 2000);
      const taken = new Set(existing.map((m) => m.modelId));
      const todo = all.filter((m) => !taken.has(m.id));

      const started = Date.now();
      const BUDGET = 95000;
      const WAVE = 6;
      const toRecord = (m) => ({
        name: m.id.split('/').pop(),
        modelId: m.id,
        note: m.provider ? `Läuft über ${m.provider}` : '',
        enabled: true,
      });
      let added = 0;
      let failed = 0;
      let index = 0;

      // Nach jeder Welle speichern — so ist alles Gefundene auch dann drin,
      // wenn der Funktion zwischendurch die Zeit ausgeht.
      while (index < todo.length && Date.now() - started < BUDGET) {
        const wave = todo.slice(index, index + WAVE);
        index += wave.length;
        const tested = await Promise.all(wave.map(async (m) => {
          try {
            const res = await fetch(`${ROUTER}/chat/completions`, {
              method: 'POST',
              headers: { ...auth, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: m.id,
                messages: [{ role: 'user', content: 'Antworte mit genau einem Wort: Bereit.' }],
                max_tokens: 60,
              }),
            });
            if (!res.ok) {
              console.log('hfChat importAll: läuft nicht', m.id, res.status);
              return null;
            }
            const d = await res.json();
            const text = String(d.choices?.[0]?.message?.content || '').trim();
            return text ? m : null;
          } catch (e) {
            console.log('hfChat importAll: Fehler', m.id, e.message);
            return null;
          }
        }));
        const ok = tested.filter(Boolean);
        failed += wave.length - ok.length;
        if (ok.length) {
          await base44.entities.TextModel.bulkCreate(ok.map(toRecord));
          added += ok.length;
        }
      }

      const remaining = todo.length - index;
      return Response.json({ tested: index, added, failed, remaining, done: remaining === 0 });
    }

    const modelId = (body.modelId || '').trim();
    const prompt = (body.prompt || '').trim();
    if (!modelId || !prompt) return Response.json({ error: 'Modell oder Text fehlt.' }, { status: 400 });

    const messages = [];
    if (body.system) messages.push({ role: 'system', content: body.system });
    messages.push({ role: 'user', content: prompt });

    // Denk-Modelle sollen direkt antworten, nicht laut nachdenken. Manche Modelle
    // kennen den Schalter nicht — dann ohne ihn noch einmal fragen.
    const payload = (withFlag: boolean) =>
      JSON.stringify({
        model: modelId,
        messages,
        max_tokens: 1200,
        temperature: 0.9,
        ...(withFlag ? { chat_template_kwargs: { enable_thinking: false } } : {}),
      });

    let res = await fetch(`${ROUTER}/chat/completions`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: payload(true),
    });

    let text = await res.text();
    if (!res.ok && text.includes('chat_template_kwargs')) {
      res = await fetch(`${ROUTER}/chat/completions`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: payload(false),
      });
      text = await res.text();
    }

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