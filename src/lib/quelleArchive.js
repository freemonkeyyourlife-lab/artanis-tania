import { base44 } from "@/api/base44Client";

// Universelles Archiv: Dateien, Links und Lesezeichen landen alle in der
// Quelle-Entity — mit Typ (BILD/VIDEO/AUDIO/TEXT …), Herkunft (UPLOAD/LINK)
// und optionalem Tag (z. B. Ordnername). Von hier holt man sie sich später
// für jeden Zweck, statt hundert separate Uploads zu pflegen.

const IMG = /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i;
const VID = /\.(mp4|mov|webm|avi|mkv|m4v|ogv)$/i;
const AUD = /\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i;
const DOC = /\.(txt|md|json|csv|pdf|docx?|xlsx?|rtf|html?)$/i;

export function kindFromName(name) {
  if (VID.test(name)) return "VIDEO";
  if (AUD.test(name)) return "AUDIO";
  if (IMG.test(name)) return "BILD";
  if (DOC.test(name)) return "TEXT";
  return "BILD";
}

export function kindFromUrl(url) {
  const u = (url || "").toLowerCase().split(/[?#]/)[0];
  if (VID.test(u)) return "VIDEO";
  if (AUD.test(u)) return "AUDIO";
  if (IMG.test(u)) return "BILD";
  return "TEXT";
}

// Datei ins Archiv legen (stored privately). folderName wird als Tag
// mitgegeben, damit sich der Upload später danach filtern lässt.
export async function storeFile(file, { folderName = "", note = "" } = {}) {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  const kind = kindFromName(file.name);
  const tags = folderName ? [folderName] : [];
  return base44.entities.Quelle.create({
    name: file.name || kind,
    kind,
    fileUri: file_uri,
    note,
    tags,
    source: "UPLOAD",
  });
}

// Link oder Lesezeichen ins Archiv legen — ohne Upload, nur die Adresse.
export async function storeLink(url, { name = "", note = "", tags = [] } = {}) {
  const kind = kindFromUrl(url);
  return base44.entities.Quelle.create({
    name: name || url,
    kind,
    url,
    note,
    tags,
    source: "LINK",
  });
}

// Gesamtes Archiv (neueste zuerst).
export async function loadArchiveQuellen(limit = 200) {
  const { items } = await base44.entities.Quelle.filter({}, {
    sort: "-created_date",
    limit,
  });
  return items;
}

// Signierte Anzeige-URL für ein privates Archiv-Bild (60 min gültig).
export async function signQuelleUrl(q) {
  if (q.url) return q.url;
  if (!q.fileUri) return "";
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: q.fileUri,
      expires_in: 3600,
    });
    return r.signed_url;
  } catch {
    return "";
  }
}