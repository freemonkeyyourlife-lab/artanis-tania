import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Lädt ausgewählte Google-Drive-Dateien herunter und legt sie im App-Speicher ab
// (oeffentlich, damit sie in der Galerie und im Training angezeigt werden).
// Nur Admin — privates Studio.

const MEDIA = ['image/', 'video/', 'audio/'];
const isMedia = (mt) => MEDIA.some((m) => (mt || '').startsWith(m));

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const files = Array.isArray(body.files) ? body.files : [];
    if (!files.length) return Response.json({ error: 'files required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    const results = await Promise.allSettled(files.map(async (f) => {
      const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?fields=name,mimeType`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!metaRes.ok) throw new Error('Metadaten nicht abrufbar');
      const meta = await metaRes.json();
      if (!isMedia(meta.mimeType)) throw new Error('Keine Mediendatei');

      const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(60000),
      });
      if (!dlRes.ok) throw new Error('Download fehlgeschlagen');
      const blob = await dlRes.blob();
      const file = new File([blob], meta.name || f.name || 'drive-file', { type: meta.mimeType });
      const up = await base44.integrations.Core.UploadPublicFile({ file });
      return { name: meta.name || f.name, url: up.file_url, mimeType: meta.mimeType };
    }));

    const imported = results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { name: files[i].name, error: r.reason?.message || 'fehlgeschlagen' }
    );
    return Response.json({ imported });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}