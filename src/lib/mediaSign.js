import { base44 } from "@/api/base44Client";

// Macht aus einem privaten Datei-URI eine zeitlich begrenzte URL, die auch für
// Vorschauen oder als Referenz an die Bildgenerierung gereicht werden kann.
export async function signMedia(uri) {
  if (!uri) return null;
  if (String(uri).startsWith("http")) return uri;
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: uri,
      expires_in: 3600,
    });
    return r.signed_url || null;
  } catch {
    return null;
  }
}