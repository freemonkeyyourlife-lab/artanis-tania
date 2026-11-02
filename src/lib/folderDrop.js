// Ordner per Drag-and-Drop rekursiv auslesen (Entry-API) und auf Medien filtern.
// Wird von Galerie, Archiv-Upload und überall genutzt, wo ganze Ordner reinfallen.
export const isImage = (name) => /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(name || "");
export const isVideo = (name) => /\.(mp4|mov|webm|avi|mkv|m4v)$/i.test(name || "");
export const isMediaFile = (f) =>
  isImage(f.name) ||
  isVideo(f.name) ||
  (f.type && (f.type.startsWith("image") || f.type.startsWith("video")));

const readEntries = (reader) =>
  new Promise((res) => reader.readEntries((e) => res(e), () => res([])));

const collectEntry = async (entry, acc) => {
  if (!entry) return;
  if (entry.isFile) {
    const file = await new Promise((res, rej) => entry.file(res, rej));
    acc.push(file);
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    let batch = await readEntries(reader);
    while (batch.length > 0) {
      for (const c of batch) await collectEntry(c, acc);
      batch = await readEntries(reader);
    }
  }
};

// Liefert alle Medien-Dateien aus einem Drop-Event — ganze Ordner inklusive.
export async function collectDroppedFiles(dataTransfer) {
  const items = Array.from(dataTransfer.items || []);
  const entries = items
    .map((it) => it.webkitGetAsEntry && it.webkitGetAsEntry())
    .filter(Boolean);
  if (entries.length) {
    const acc = [];
    for (const en of entries) await collectEntry(en, acc);
    return acc.filter(isMediaFile);
  }
  return Array.from(dataTransfer.files || []).filter(isMediaFile);
}