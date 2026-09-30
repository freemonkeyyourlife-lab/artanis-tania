import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { voiceSettings } from '../../shared/voiceNote.ts';

// Die eigene Sprachnachricht in die Stimme eines Charakters verwandeln.
// Kann der Charakter eine ElevenLabs-Stimme, wird echt umgewandelt (Stimme →
// Stimme): Betonung, Tempo und Pausen bleiben deine. Hat er nur eine
// Grundstimme, wird erst verstanden und dann mit der Grundstimme gesprochen.

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
    const fileUri = String(body.fileUri || '').trim();
    const voiceId = String(body.voiceId || '').trim();
    if (!fileUri) return Response.json({ error: 'Keine Aufnahme übergeben.' }, { status: 400 });

    // Die Aufnahme liegt privat — kurz einen Abruf-Link dafür holen.
    let audioUrl = '';
    try {
      const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: fileUri,
        expires_in: 900,
      });
      audioUrl = signed?.signed_url || '';
    } catch (e) {
      audioUrl = '';
    }
    if (!audioUrl) return Response.json({ error: 'Aufnahme nicht gefunden.' }, { status: 400 });

    let bytes;

    if (voiceId) {
      const inputRes = await fetch(audioUrl);
      if (!inputRes.ok) return Response.json({ error: 'Aufnahme nicht lesbar.' }, { status: 400 });
      const input = new Uint8Array(await inputRes.arrayBuffer());

      const settings = voiceSettings(body.mood, body.intensity, body.ending);
      const form = new FormData();
      form.append('audio', new Blob([input], { type: 'audio/webm' }), 'aufnahme.webm');
      form.append('model_id', 'eleven_multilingual_sts_v2');
      form.append('voice_settings', JSON.stringify({
        stability: settings.stability,
        similarity_boost: settings.similarity_boost,
        style: settings.style,
        use_speaker_boost: true,
      }));

      const res = await fetch(`${API}/speech-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'xi-api-key': key, Accept: 'audio/mpeg' },
        body: form,
      });
      if (!res.ok) {
        const detail = await res.text();
        let message = `ElevenLabs (${res.status})`;
        try {
          message = JSON.parse(detail)?.detail?.message || message;
        } catch (parseError) {
          // keine JSON-Antwort — dann bleibt der Statuscode
        }
        console.log('voiceConvert umwandeln fehlgeschlagen', res.status, message);
        return Response.json({ error: message }, { status: 502 });
      }
      bytes = new Uint8Array(await res.arrayBuffer());
    } else {
      // Ersatzweg für Grundstimmen: erst den Text verstehen, dann sprechen.
      const baseVoice = String(body.baseVoice || 'honey');
      let text = '';
      try {
        const transcript = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
        text = typeof transcript === 'string'
          ? transcript
          : (transcript?.transcript || transcript?.text || transcript?.output || '');
      } catch (e) {
        text = '';
      }
      if (!String(text).trim()) {
        return Response.json({ error: 'In der Aufnahme war nichts zu verstehen.' }, { status: 400 });
      }

      const speech = await base44.asServiceRole.integrations.Core.GenerateSpeech({
        text: String(text).trim(),
        voice: baseVoice,
      });
      if (!speech?.url) return Response.json({ error: 'Die Stimme kam nicht zurück.' }, { status: 502 });
      const spokenRes = await fetch(speech.url);
      bytes = new Uint8Array(await spokenRes.arrayBuffer());
    }

    // Ablegen wie jede andere Sprachnachricht — privat, mit kurzem Abruf-Link.
    const file = new File([bytes], 'stimme.mp3', { type: 'audio/mpeg' });
    const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 3600,
    });

    return Response.json({ file_uri, url: signed_url });
  } catch (error) {
    console.log('voiceConvert failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}