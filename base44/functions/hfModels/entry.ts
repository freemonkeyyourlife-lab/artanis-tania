import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Sucht Bildmodelle auf Hugging Face und meldet, welches Konto verbunden ist.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const query = (body.query || '').trim();

    let token = '';
    try {
      token = (await base44.asServiceRole.connectors.getConnection('hugging_face')).accessToken;
    } catch (connError) {
      console.log('hfModels: kein Hugging-Face-Zugang', connError.message);
    }
    const auth = token ? { Authorization: `Bearer ${token}` } : {};

    const params = new URLSearchParams({
      pipeline_tag: 'text-to-image',
      sort: 'downloads',
      direction: '-1',
      limit: '40',
      'expand[]': 'inferenceProviderMapping',
    });
    if (query) params.set('search', query);

    const [modelsRes, whoRes] = await Promise.all([
      fetch(`https://huggingface.co/api/models?${params}`, { headers: auth }),
      fetch('https://huggingface.co/api/whoami-v2', { headers: auth }),
    ]);

    if (!modelsRes.ok) {
      const text = await modelsRes.text();
      return Response.json({ error: `Hugging Face (${modelsRes.status}): ${text.slice(0, 200)}` }, { status: 502 });
    }

    const list = await modelsRes.json();
    const account = whoRes.ok ? (await whoRes.json()).name || null : null;

    // Die Liste liefert die Anbieter als Array, die Einzelabfrage als Objekt.
    const toList = (mapping) =>
      Array.isArray(mapping)
        ? mapping
        : Object.entries(mapping || {}).map(([provider, value]) => ({ provider, ...value }));

    // Nur Modelle, die auch wirklich laufen — ohne aktiven Anbieter liefern sie kein Bild.
    const models = list
      .map((m) => ({
        id: m.id,
        downloads: m.downloads || 0,
        providers: toList(m.inferenceProviderMapping)
          .filter((v) => v && v.status === 'live')
          .map((v) => v.provider),
      }))
      .filter((m) => m.providers.length > 0)
      .slice(0, 24);

    return Response.json({ account, models });
  } catch (error) {
    console.log('hfModels failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}