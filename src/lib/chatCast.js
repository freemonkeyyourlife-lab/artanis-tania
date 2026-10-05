// Die Besetzung des Chat-Moduls: mehrere Figuren gleichzeitig in einer Szene,
// jede mit eigener Stimme. Gemerkt wird sie am Gerät — pro Gespräch.

const KEY = "artanis:chatcast";

export function castFor(convId) {
  if (!convId) return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}")[convId] || [];
  } catch (e) {
    return [];
  }
}

export function setCastFor(convId, cast) {
  if (!convId) return;
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}");
    all[convId] = cast;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch (e) {
    /* Speicher verweigert — die Besetzung gilt trotzdem für diese Sitzung */
  }
}

// Wie die Figuren spielen — als Block für die KI.
export function castPrompt(cast) {
  const names = (cast || []).map((c) => c.name).filter(Boolean);
  if (!names.length) return "";
  return (
    "\n\n═══ BESETZUNG — MEHRERE FIGUREN ═══\n" +
    `In dieser Szene sind mehrere Figuren. Du spielst sie alle: ${names.join(", ")}.\n` +
    "Beginne JEDE gesprochene Zeile mit dem Namen in eckigen Klammern, genau so: [Name]: Text\n" +
    "Eine Figur pro Zeile. Die Figuren reden miteinander, abwechselnd, jede mit ihrer eigenen Art.\n" +
    "Was passiert (Handlung, Umgebung), schreibst du in *Sternchen* — ohne Namen davor.\n" +
    "═══ ENDE BESETZUNG ═══\n"
  );
}

// Die Antwort in Zeilen zerlegen: wer sagt was. Nur bekannte Namen zählen —
// sonst bleibt ein Doppelpunkt einfach Text.
export function splitCast(text, cast = []) {
  const names = cast.map((c) => String(c.name || "").toLowerCase()).filter(Boolean);
  const blocks = [];

  String(text || "")
    .split("\n")
    .forEach((raw) => {
      const line = raw.trim();
      if (!line) return;

      let name = null;
      let rest = line;
      const bracketed = line.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (bracketed && names.includes(bracketed[1].trim().toLowerCase())) {
        name = bracketed[1].trim();
        rest = bracketed[2];
      } else {
        const plain = line.match(/^([^:\n]{1,32}):\s*(.+)$/);
        if (plain && names.includes(plain[1].trim().toLowerCase())) {
          name = plain[1].trim();
          rest = plain[2];
        }
      }

      if (name) blocks.push({ name, text: rest });
      else if (blocks.length) blocks[blocks.length - 1].text += "\n" + line;
      else blocks.push({ name: null, text: line });
    });

  return blocks;
}

// Die Stimme einer Figur — oder nichts, dann spricht die Standard-Stimme.
export const voiceForName = (cast, name) =>
  (cast || []).find((c) => String(c.name || "").toLowerCase() === String(name || "").toLowerCase()) || {};