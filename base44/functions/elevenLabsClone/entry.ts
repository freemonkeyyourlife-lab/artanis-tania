import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// Aus einer hochgeladenen Aufnahme eine eigene Stimme machen, die jeden Text sprechen kann.

const API = 'https://api.elevenlabs.io/v1';

const TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  flac: 'audio/flac',
  webm: 'audio/webm',
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const key = secrets.get('ELEVENLABS_API_KEY');
    if (!key) return Response.json({ error: 'Kein ElevenLabs-Schlüssel hinterlegt.' }, { status: 400 });

    const body = await req.json();
    const fileUri = (body.fileUri || '').trim();
    const name = (body.name || '').trim();
    if (!fileUri || !name) return Response.json({ error: 'Aufnahme oder Name fehlt.' }, { status: 400 });

    const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: fileUri,
      expires_in: 600,
    });
    if (!signed?.signed_url) return Response.json({ error: 'Aufnahme nicht gefunden.' }, { status: 400 });

    const audioRes = await fetch(signed.signed_url);
    if (!audioRes.ok) return Response.json({ error: 'Aufnahme konnte nicht geladen werden.' }, { status: 502 });
    const bytes = new Uint8Array(await audioRes.arrayBuffer());

    const ext = ((fileUri.split('.').pop() || 'mp3').split('?')[0] || 'mp3').toLowerCase();
    const form = new FormData();
    form.append('name', name.slice(0, 100));
    if (body.description) form.append('description', String(body.description).slice(0, 300));
    form.append('files', new File([bytes], `stimme.${ext}`, { type: TYPES[ext] || 'audio/mpeg' }));

    const res = await fetch(`${API}/voices/add`, {
      method: 'POST',
      headers: { 'xi-api-key': key },
      body: form,
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.log('elevenLabs clone error', res.status, JSON.stringify(data).slice(0, 300));
      return Response.json({ error: data?.detail?.message || `ElevenLabs (${res.status})` }, { status: 502 });
    }

    return Response.json({ voiceId: data.voice_id });
  } catch (error) {
    console.log('elevenLabsClone failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}