import { base44 } from "@/api/base44Client";

// Der Baukasten: aus einzelnen Bausteinen wird eine Szene, ein Charakter oder
// ein Paket zum Nachbauen. Alles ist frei zusammensetzbar — nichts ist fest.

export const BLOCK_KINDS = [
  {
    id: "SITUATION",
    label: "Situation mit Varianten",
    hint: "Grundsituation plus Schalter wie mit/ohne, rasiert/unrasiert — zum An- und Abwählen.",
  },
  {
    id: "DATEI",
    label: "Einzelne Datei",
    hint: "Eine Datei mit Schlagworten, die du später danach filterst.",
  },
  {
    id: "SZENE",
    label: "Szene zum Füllen",
    hint: "Mehrere Dateien als eine Szene, die du mehrfach mit anderem Inhalt füllst.",
  },
];

export const kindLabel = (id) => BLOCK_KINDS.find((k) => k.id === id)?.label || id;

export const SITUATION_PRESETS = [
  "Allein",
  "Zu zweit",
  "Heimlich",
  "Zuhause",
  "Unterwegs",
  "Im Auto",
  "Am Fenster",
  "Vor der Kamera",
  "Mit Zuschauer",
  "Im Studio",
];

export const VARIANT_PRESETS = [
  "mit Ton",
  "ohne Ton",
  "rasiert",
  "unrasiert",
  "hell",
  "dunkel",
  "Nahaufnahme",
  "weit",
  "mit Zuschauer",
  "allein",
];

export const MEDIA_LABEL = { IMAGE: "Bild", VIDEO: "Video", AUDIO: "Ton" };

export async function uploadMedia(files) {
  const out = [];
  for (const file of files) {
    const res = await base44.integrations.Core.UploadPublicFile({ file });
    const type = file.type.startsWith("video")
      ? "VIDEO"
      : file.type.startsWith("audio")
        ? "AUDIO"
        : "IMAGE";
    out.push({ url: res.file_url, type, caption: file.name || "" });
  }
  return out;
}

// Alles, was in einem Baustein an Medien hängt — einzeln oder als Szene.
export const blockMedia = (block) =>
  block.mediaItems?.length
    ? block.mediaItems
    : block.mediaUrl
      ? [{ url: block.mediaUrl, type: block.mediaType || "IMAGE" }]
      : [];

// Ein Paket als Datei — damit kannst du es sichern oder weitergeben.
export const exportKit = (kit, blocks) => {
  const payload = {
    format: "artanis-baukasten",
    version: 1,
    name: kit.name,
    description: kit.description || "",
    personaName: kit.personaName || "",
    tags: kit.tags || [],
    blocks: blocks.map((b) => ({
      title: b.title,
      blockKind: b.blockKind,
      personaName: b.personaName || "",
      situation: b.situation || "",
      variants: b.variants || [],
      activeVariants: b.activeVariants || [],
      mediaType: b.mediaType || "IMAGE",
      mediaItems: blockMedia(b),
      voiceLine: b.voiceLine || "",
      tags: b.tags || [],
      note: b.note || "",
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${kit.name.replace(/[^\w\-]+/g, "_") || "baukasten"}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const readKitFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.blocks)) throw new Error("keine Bausteine");
        resolve(data);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });

// Jemanden nachbauen lassen: fremde Bausteine werden zu eigenen Kopien.
export const cloneKit = async (kit, blocks) => {
  const copies = await base44.entities.BuildBlock.bulkCreate(
    blocks.map((b) => ({
      title: b.title,
      blockKind: b.blockKind,
      personaName: b.personaName || "",
      situation: b.situation || "",
      variants: b.variants || [],
      activeVariants: b.activeVariants || [],
      mediaType: b.mediaType || "IMAGE",
      mediaUrl: b.mediaUrl || "",
      mediaItems: b.mediaItems || [],
      voiceLine: b.voiceLine || "",
      tags: b.tags || [],
      note: b.note || "",
      shared: false,
    }))
  );
  return base44.entities.BuildKit.create({
    name: `${kit.name} (nachgebaut)`,
    description: kit.description || "",
    personaName: kit.personaName || "",
    cover: kit.cover || "",
    tags: kit.tags || [],
    blockIds: (copies || []).map((c) => c.id),
    shared: false,
    sourceKitId: kit.id,
  });
};

// Teilen heißt: die Bausteine des Pakets werden für andere lesbar.
export const syncSharedBlocks = async (blockIds, shared) => {
  const ids = blockIds || [];
  await Promise.all(
    ids.map((id) => base44.entities.BuildBlock.update(id, { shared }).catch(() => {}))
  );
};