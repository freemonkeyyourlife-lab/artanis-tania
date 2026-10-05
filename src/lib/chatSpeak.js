// Vorlesen im Chat-Modul: die Stimmen des Geräts, ohne Umweg über einen Dienst.

export function listVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

export function speak(text, voiceName) {
  const clean = String(text || "").trim();
  if (!clean || typeof window === "undefined" || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = "de-DE";
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