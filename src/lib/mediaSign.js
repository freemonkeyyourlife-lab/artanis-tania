import { useEffect, useState } from "react";
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

// Löst einen privaten Datei-URI (oder eine http-URL) in eine abrufbare URL auf.
// http-URLs kommen direkt zurück; private URIs werden signiert.
export function useSignedImage(uri) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!uri) { setSrc(null); return; }
    if (String(uri).startsWith("http")) { setSrc(uri); return; }
    signMedia(uri).then((u) => { if (alive) setSrc(u); });
    return () => { alive = false; };
  }, [uri]);
  return src;
}