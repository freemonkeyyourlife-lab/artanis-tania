import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Listet Dateien und Ordner im verbundenen Google Drive des Besitzers.
// Nur Admin — privates Studio. Nutzt den Shared-Connector googledrive.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const folderId = body.folderId || 'root';
    const pageToken = body.pageToken || '';
    const q = (body.q || '').trim();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    let query = 'trashed=false';
    if (folderId === 'root') query += " and 'root' in parents";
    else query += ` and '${folderId}' in parents`;
    if (q) query += ` and name contains '${q.replace(/'/g, "\\'")}'`;

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', query);
    url.searchParams.set('fields', 'nextPageToken, files(id,name,mimeType,thumbnailLink,webViewLink,iconLink,modifiedTime,size)');
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('orderBy', 'folder,name');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json({ error: err?.error?.message || 'Drive API error' }, { status: 502 });
    }
    const data = await res.json();
    const items = (data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      isFolder: f.mimeType === 'application/vnd.google-apps.folder',
      thumbnail: f.thumbnailLink || null,
      link: f.webViewLink || null,
      icon: f.iconLink || null,
      modified: f.modifiedTime || null,
      size: f.size || null,
    }));
    return Response.json({ items, nextPageToken: data.nextPageToken || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}