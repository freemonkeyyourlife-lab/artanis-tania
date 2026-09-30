// Charaktere raus und wieder rein — als Datei, damit nichts verloren geht.
// Bilder und Referenzen sind normale Adressen und reisen einfach mit.

const FIELDS = [
  "stageName", "personaType", "creatorCategory", "artStyle", "active", "age",
  "bio", "tagline", "personaPrompt", "avatar", "banner", "referenceImages",
  "onlineStatus", "voice", "voiceProfileId", "profileVisibility", "topics",
  "tags", "featured",
];

export function charactersForExport(creators) {
  return creators.map((c) => {
    const out = {};
    FIELDS.forEach((f) => { if (c[f] !== undefined && c[f] !== null) out[f] = c[f]; });
    return out;
  });
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try { resolve(JSON.parse(String(reader.result))); }
      catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Akzeptiert eine reine Liste oder eine Datei mit "characters" darin.
export function usableCharacters(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.characters) ? data.characters : [];
  return list
    .filter((c) => c && typeof c.stageName === "string" && c.stageName.trim() && c.personaType)
    .map((c) => {
      const out = {};
      FIELDS.forEach((f) => { if (c[f] !== undefined && c[f] !== null) out[f] = c[f]; });
      return out;
    });
}