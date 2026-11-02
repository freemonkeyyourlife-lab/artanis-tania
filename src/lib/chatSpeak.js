// Vorlesen im Chat-Modul: die Stimmen des Geräts, ohne Umweg über einen Dienst.

export function listVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

export function speak(text, voiceName, onEnd, rate, pitch) {
  const clean = String(text || "").trim();
  if (!clean || typeof window === "undefined" || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = "de-DE";
  // Damit eine Reihe von Stimmen nacheinander sprechen kann, meldet jede, wenn
  // sie fertig ist.
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  // Die Stimmung der Figur färbt Tempo und Tonhöhe — schneller und heller bei
  // Hitze, ruhig und tiefer bei Sanftheit.
  if (typeof rate === "number" && rate) utter.rate = Math.max(0.5, Math.min(2, rate));
  if (typeof pitch === "number" && pitch) utter.pitch = Math.max(0, Math.min(2, pitch));
  if (voiceName) {
    const voice = listVoices().find((v) => v.name === voiceName);
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }
  }
  window.speechSynthesis.speak(utter);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}