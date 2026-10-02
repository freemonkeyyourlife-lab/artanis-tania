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

// Text mit der Stimme des Charakters sprechen. Eine ElevenLabs-Stimme klingt
// genau wie in der Stimmbank eingestellt, eine Grundstimme läuft über die
// eingebaute Sprachausgabe.
export async function speakAsVoice(profile, text) {
  const t = String(text || "").trim().slice(0, 2500);
  if (!t) return null;

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
    });
    if (res.data?.error) throw new Error(res.data.error);
    return res.data?.url || null;
  }

  const res = await base44.integrations.Core.GenerateSpeech({ text: t, voice: resolveVoice(profile).baseVoice });
  return res?.url || null;
}