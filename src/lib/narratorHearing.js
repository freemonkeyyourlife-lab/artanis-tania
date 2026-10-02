// Sie hört mit. Jede Zeile, die durch den Chat geht, wird hier gemeldet —
// und sie meldet sich nur, wenn eines ihrer Wörter darin vorkommt.

const listeners = new Set();

// Ein Satz geht raus: wer mithört, bekommt ihn.
export function announceToNarrator(text) {
  const line = String(text || "").trim();
  if (!line) return;
  listeners.forEach((fn) => {
    try {
      fn(line);
    } catch (e) {
      /* eine Zuhörerin darf nie den Chat stören */
    }
  });
}

export function subscribeNarratorHearing(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Welche ihrer Wörter stecken in diesem Satz? Wortgrenzen zählen, damit
// "weiter" nicht bei "weiterleiten" anschlägt.
export function hearsWord(text, words = []) {
  const low = String(text || "").toLowerCase();
  return words.filter((w) => {
    const word = String(w || "").toLowerCase().trim();
    if (!word) return false;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-zäöüß0-9])${escaped}([^a-zäöüß0-9]|$)`, "i").test(low);
  });
}