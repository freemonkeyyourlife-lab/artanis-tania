// Ein komplettes ZIP für den Export: alle Bilder, Videos und Audios aus
// Nachrichten oder einem Charakter plus ein Text-Verlauf. Geht direkt auf
// die Festplatte. Einzelne Dateien, die nicht geladen werden können
// (Cross-Origin, abgelaufener Link), werden übersprungen, der Text kommt
// immer mit.
import JSZip from "jszip";

const safe = (s) => String(s || "export").replace(/[^\wäöüÄÖÜß.-]+/g, "_").slice(0, 80);
const extOf = (u) => (String(u || "").split(/[?#]/)[0].split(".").pop() || "bin").slice(0, 5);

export async function fetchBlob(url) {
  try {
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) return null;
    return await r.blob();
  } catch {
    return null;
  }
}

// Alle Medien-Adressen aus einer Nachrichten-Liste einsammeln.
export function attachmentsFromMessages(messages) {
  const out = [];
  for (const m of messages || []) {
    const items = m.attachments?.length
      ? m.attachments
      : m.attachment
      ? [{ type: "image", url: m.attachment }]
      : [];
    for (const it of items) {
      if ((it.type === "image" || it.type === "video" || it.type === "audio") && it.url) {
        out.push({ url: it.url, kind: it.type });
      }
    }
    if (Array.isArray(m.images)) m.images.forEach((u) => u && out.push({ url: u, kind: "image" }));
    if (Array.isArray(m.videos)) m.videos.forEach((u) => u && out.push({ url: u, kind: "video" }));
  }
  return out;
}

// Ein schlichter Text-Verlauf, der in jede ZIP kommt.
export function transcriptText(meta, messages, kind = "chat") {
  const who = meta?.userName || "Gast";
  const other = kind === "therapy"
    ? meta?.therapistName || "Tania"
    : meta?.creatorName || meta?.participantName || "Chat";
  const lines = [
    "ARTANIS × TANIA — EXPORT",
    "",
    kind === "therapy" ? `Sitzung: ${meta?.topic || "ohne Thema"}` : `Gespräch: ${who} / ${other}`,
    `Nachrichten: ${(messages || []).length}`,
    "",
  ];
  (messages || []).forEach((m) => {
    const when = m.created_date ? new Date(m.created_date).toLocaleString("de-DE") : "";
    const sender = m.senderType === "HUMAN" || m.senderType === "USER"
      ? who
      : m.senderType === "GUEST"
      ? "Gast"
      : m.sender || m.senderName || other;
    lines.push(`[${when}] ${sender}: ${m.text || ""}`);
    const items = m.attachments?.length
      ? m.attachments
      : m.attachment
      ? [{ type: "image", url: m.attachment }]
      : [];
    items.forEach((it) => {
      if (it.type === "video") lines.push(`   Video: ${it.url || ""}`);
      else if (it.type === "audio") lines.push(`   Sprachnachricht: ${it.url || ""}`);
      else if (it.url) lines.push(`   Bild${it.locked ? " (verschlossen)" : ""}: ${it.url}`);
    });
  });
  return lines.join("\n");
}

// Baut das ZIP und lädt es herunter. Gibt die Anzahl gespeicherter Medien
// zurück, damit die Oberfläche melden kann, ob etwas ankam.
export async function exportZip({ name, files = [], textName, text }) {
  const zip = new JSZip();
  const seen = new Set();
  let added = 0;
  let idx = 0;
  for (const f of files) {
    if (!f?.url || seen.has(f.url)) continue;
    seen.add(f.url);
    const blob = await fetchBlob(f.url);
    if (!blob) continue;
    const ext = f.ext || extOf(f.url);
    const fname = f.name || `${f.kind || "medium"}-${String(idx + 1).padStart(2, "0")}.${ext}`;
    zip.file(fname, blob);
    idx++;
    added++;
  }
  if (text != null) zip.file(textName || "verlauf.txt", text);
  if (added === 0 && text == null) return 0;
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe(name)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return added;
}