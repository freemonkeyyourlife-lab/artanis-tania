// Einheitliche Sortierung der Modell-Liste: erst nach Name, dann nach Art
// (Bild / Text / Chat / Video …). Wird von jedem Modell-Picker benutzt, damit
// die Auswahl überall gleich geräumt ist — egal, wo sie eingebaut wird.

const KIND_ORDER = {
  BILD: 1,
  IMAGE: 1,
  TEXT: 2,
  CHAT: 3,
  VIDEO: 4,
  STIMME: 5,
  VOICE: 5,
  MODELL: 6,
};

const kindRank = (kind) => {
  const k = String(kind || "").toUpperCase();
  return KIND_ORDER[k] ?? 99;
};

// Sortiert eine Kopie der Liste — das Original bleibt unangetastet.
// name zuerst (alphabetisch), dann Art (Bild vor Text vor Chat …).
export function sortModels(models) {
  return [...(models || [])].sort((a, b) => {
    const byName = String(a?.name || "").localeCompare(String(b?.name || ""), "de", { sensitivity: "base" });
    if (byName !== 0) return byName;
    return kindRank(a?.kind) - kindRank(b?.kind);
  });
}

// Ein kurzes Etikett für die Art — Bildmodell, Textmodell, Chatmodell …
export function kindLabel(kind) {
  const k = String(kind || "").toUpperCase();
  const map = {
    BILD: "Bildmodell", IMAGE: "Bildmodell",
    TEXT: "Textmodell",
    CHAT: "Chatmodell",
    VIDEO: "Videomodell",
    STIMME: "Stimmenmodell", VOICE: "Stimmenmodell",
    MODELL: "Modell",
  };
  return map[k] || (k ? `${k[0]}${k.slice(1).toLowerCase()}modell` : "Modell");
}