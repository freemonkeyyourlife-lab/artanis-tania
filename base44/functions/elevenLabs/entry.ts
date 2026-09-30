import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { synthesize } from '../../shared/voiceNote.ts';

// Stimmen aus dem ElevenLabs-Konto holen und Text damit sprechen lassen.
// action "voices": die Stimmen, die im Konto liegen (eigene, geklonte, fertige).
// sonst: den übergebenen Text mit der gewählten Stimme sprechen und ablegen.

const API = 'https://api.elevenlabs.io/v1';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Beim Einfügen schleichen sich leicht Leerzeichen ein — die lehnt ElevenLabs ab.
    const key = (secrets.get('ELEVENLABS_API_KEY') || '').trim();
    if (!key) return Response.json({ error: 'Kein ElevenLabs-Schlüssel hinterlegt.' }, { status: 400 });

    const body = await req.json();

    if (body.action === 'voices') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

      const res = await fetch(`${API}/voices`, { headers: { 'xi-api-key': key } });
      const data = await res.json();
      if (!res.ok) {
        console.log('elevenLabs voices error', res.status, JSON.stringify(data).slice(0, 300));
        return Response.json({ error: data?.detail?.message || `ElevenLabs (${res.status})` }, { status: 502 });
      }

      const voices = (data.voices || []).map((v) => ({
        id: v.voice_id,
        name: v.name,
        category: v.category || '',
        description: v.description || '',
        labels: Object.values(v.labels || {}).filter(Boolean).slice(0, 4),
        preview: v.preview_url || '',
      }));
      return Response.json({ voices });
    }

    const voiceId = (body.voiceId || '').trim();
    const text = (body.text || '').trim();
    if (!voiceId || !text) return Response.json({ error: 'Stimme oder Text fehlt.' }, { status: 400 });

    // Tempo, Stimmung und Intensität aus der Stimmbank mitgeben — sonst klingt jede Stimme gleich.
    let bytes;
    try {
      bytes = await synthesize({
        key,
        voiceId,
        text,
        mood: body.mood,
        intensity: body.intensity,
        speed: body.speed,
        modelId: body.modelId,
      });
    } catch (error) {
      console.log('elevenLabs speak error', voiceId, error.message);
      return Response.json({ error: error.message }, { status: 502 });
    }

    // Ablegen, damit dasselbe Stück Ton nicht jedes Mal neu bezahlt wird.
    const file = new File([bytes], 'stimme.mp3', { type: 'audio/mpeg' });
    const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 3600,
    });

    return Response.json({ file_uri, url: signed_url });
  } catch (error) {
    console.log('elevenLabs failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}