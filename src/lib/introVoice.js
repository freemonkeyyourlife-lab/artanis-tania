// Sprachbefehle fürs Intro. Er muss nichts tippen und nichts anklicken: was er
// sagt, wird auf das abgebildet, was sie ihm gerade anbietet.

const norm = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const words = (value) => norm(value).split(" ").filter((w) => w.length > 2);

const ORDINALS = { erst: 1, zweit: 2, dritt: 3, viert: 4, fuenft: 5 };

// Was er gesagt hat → was passieren soll. Nichts erkannt: null, dann fragt sie
// einfach nochmal.
export function matchIntroVoice(text, options = []) {
  const said = norm(text);
  if (!said) return null;

  if (/\b(weiter|weitergehen|naechste|naechsten|naechstes|los)\b/.test(said)) return { type: "next" };
  if (/\b(zurueck|nochmal|wiederhole)\b/.test(said)) return { type: "back" };
  if (/\b(stopp|halt|still|ruhe)\b/.test(said)) return { type: "stop" };

  // „das zweite" — er muss die Angebote nicht aussprechen.
  const ordinal = said.match(/\b(erst|zweit|dritt|viert|fuenft)\w*\b/);
  if (ordinal && options.length) {
    const index = ORDINALS[ordinal[1].slice(0, 5)];
    const hit = index ? options[index - 1] : null;
    if (hit) return { type: "option", id: hit.id };
  }

  // Sonst: das Angebot, dessen Worte am besten passen.
  const saidWords = words(said);
  let best = null;
  options.forEach((option) => {
    const hits = words(option.label).filter((w) =>
      saidWords.some((s) => s.startsWith(w.slice(0, 4)) || w.startsWith(s.slice(0, 4)))
    ).length;
    if (hits && (!best || hits > best.hits)) best = { hits, id: option.id };
  });
  return best ? { type: "option", id: best.id } : null;
}