import { base44 } from "@/api/base44Client";
import { resolveVoice, cloudTuning, fineTuning } from "@/lib/voiceDj";

// „Antworten als Sprachnachricht" — pro Charakter gemerkt. Liegt auch ohne
// Browserspeicher fest, damit der Schalter innerhalb der Sitzung hält.
const KEY = "artanis_voice_chat";
let cache = null;

function readAll() {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { cache = {}; }
  return cache;
}

// Hat der Nutzer den Schalter selbst angefasst?
export function voiceDecided(creatorId) {
  const v = creatorId ? readAll()[creatorId] : undefined;
  return v === true || v === false;
}

// Automatisch an, sobald der Charakter eine Stimme hat — nur ein bewusstes
// Ausschalten hält es aus.
export function voiceNotesOn(creatorId, hasVoice = false) {
  if (!creatorId) return false;
  const v = readAll()[creatorId];
  if (v === true) return true;
  if (v === false) return false;
  return !!hasVoice;
}

export function setVoiceNotesOn(creatorId, on) {
  if (!creatorId) return;
  const all = { ...readAll(), [creatorId]: !!on };
  cache = all;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
}

// „Meine Stimme umwandeln" — deine Sprachnachricht geht direkt mit der Stimme
// des Charakters raus, ohne Zwischenschritt. Ebenfalls pro Charakter gemerkt.
const MINE_KEY = "artanis_voice_convert";
let mineCache = null;

function readMine() {
  if (mineCache) return mineCache;
  try { mineCache = JSON.parse(localStorage.getItem(MINE_KEY) || "{}"); } catch (e) { mineCache = {}; }
  return mineCache;
}

// Hat der Nutzer den Schalter selbst angefasst?
export function myVoiceConvertDecided(creatorId) {
  const v = creatorId ? readMine()[creatorId] : undefined;
  return v === true || v === false;
}

// Automatisch an, sobald der Charakter eine Stimme hat.
export function myVoiceConvertOn(creatorId, hasVoice = false) {
  if (!creatorId) return false;
  const v = readMine()[creatorId];
  if (v === true) return true;
  if (v === false) return false;
  return !!hasVoice;
}

export function setMyVoiceConvertOn(creatorId, on) {
  if (!creatorId) return;
  const all = { ...readMine(), [creatorId]: !!on };
  mineCache = all;
  try { localStorage.setItem(MINE_KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
}

// Derselbe Satz mit derselben Stimme wird nur einmal erzeugt. Wiederholen ist
// damit sofort da — und wer zweimal dasselbe hört, wartet kein zweites Mal.
const speechCache = new Map();

function toObjectUrl(data, type) {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: type || "audio/mpeg" }));
}

// Text mit der Stimme des Charakters sprechen. Fürs Chat-Erlebnis zählt die
// Zeit: die kurze Fassung nimmt das schnellste Modell und kommt direkt zurück.
// Eine ElevenLabs-Stimme klingt genau wie in der Stimmbank eingestellt, eine
// Grundstimme läuft über die eingebaute Sprachausgabe.
export async function speakAsVoice(profile, text, options = {}) {
  const t = String(text || "").trim().slice(0, 2500);
  if (!t) return null;

  const key = `${profile?.externalVoiceId || profile?.baseVoice || "x"}|${profile?.mood || ""}|${t}`;
  const known = speechCache.get(key);
  if (known) return known;

  if (profile?.provider === "ELEVENLABS" && profile?.externalVoiceId) {
    const tune = cloudTuning(profile);
    const res = await base44.functions.invoke("elevenLabs", {
      voiceId: profile.externalVoiceId,
      text: t,
      speed: tune.apiSpeed,
      mood: profile?.mood,
      intensity: tune.intensity,
      ending: profile?.ending,
      modelId: profile?.modelId,
      tuning: fineTuning(profile),
      inline: true,
      fast: options.fast !== false,
    });
    if (res.data?.error) throw new Error(res.data.error);
    const url = res.data?.data ? toObjectUrl(res.data.data, res.data.type) : res.data?.url || null;
    if (url) speechCache.set(key, url);
    return url;
  }

  const res = await base44.integrations.Core.GenerateSpeech({ text: t, voice: resolveVoice(profile).baseVoice });
  const url = res?.url || null;
  if (url) speechCache.set(key, url);
  return url;
}

// Die nächsten Sätze schon vorbereiten, während die ersten noch laufen —
// dann steht der nächste Baustein ohne Wartezeit da.
export function prefetchSpeech(profile, lines = []) {
  lines.forEach((line) => {
    speakAsVoice(profile, line, { fast: true }).catch(() => {});
  });
}