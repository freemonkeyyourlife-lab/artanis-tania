import { speakAsVoice } from "@/lib/voiceChat";
import { resolveVoice, cloudTuning, playVolume } from "@/lib/voiceDj";

// Eine Nachricht in Sprecher-Abschnitte zerlegen: [Name]: … spricht diese
// Figur, *kursiv* ist die Erzählung, alles andere spricht der Absender.
export function splitScene(text, defaultName) {
  const segs = [];
  let speaker = defaultName || null;
  String(text || "").split("\n").forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const narration = line.match(/^\*{1,2}(.+?)\*{1,2}$/) || line.match(/^_(.+?)_$/);
    let name = speaker;
    let say = line;
    if (narration) {
      name = "__NARRATOR__";
      say = narration[1];
    } else {
      const tag = line.match(/^\[([^\]]{1,40})\]\s*:?\s*(.*)$/) || line.match(/^\*{0,2}([A-ZÄÖÜ][\wäöüß×\- ]{0,30}):\*{0,2}\s+(.+)$/);
      if (tag) { name = tag[1].trim(); speaker = name; say = tag[2]; }
    }
    say = say.replace(/\*+/g, "").trim();
    if (!say) return;
    const last = segs[segs.length - 1];
    if (last && last.name === name) last.text += " " + say;
    else segs.push({ name, text: say });
  });
  return segs;
}

let token = 0;
let audio = null;
let finish = null;
let playingKey = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(playingKey));

export const onSceneChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const currentSceneKey = () => playingKey;

export function stopScene() {
  token += 1;
  if (audio) { audio.pause(); audio = null; }
  finish?.();
  finish = null;
  playingKey = null;
  emit();
}

function playOne(url, profile) {
  return new Promise((resolve) => {
    const a = new Audio(url);
    const rate = profile?.provider === "ELEVENLABS" ? cloudTuning(profile).pitch : resolveVoice(profile).audioRate;
    a.preservesPitch = false;
    a.webkitPreservesPitch = false;
    a.playbackRate = Math.max(0.5, Math.min(2, rate));
    a.volume = playVolume(profile);
    a.onended = () => resolve();
    a.onerror = () => resolve();
    audio = a;
    finish = resolve;
    a.play().catch(() => resolve());
  });
}

// Alle Abschnitte nacheinander — jede Figur mit ihrer eigenen Stimme. Die
// Stimmen werden schon im Voraus erzeugt, damit kaum Pausen entstehen.
export async function playScene(segments, voiceFor, key = "scene") {
  stopScene();
  if (!segments.length) return;
  const mine = token;
  playingKey = key;
  emit();
  const jobs = segments.map((s) => {
    const profile = voiceFor(s.name);
    return speakAsVoice(profile, s.text).catch(() => null).then((url) => ({ url, profile }));
  });
  for (const job of jobs) {
    const { url, profile } = await job;
    if (mine !== token) return;
    if (url) await playOne(url, profile);
    if (mine !== token) return;
  }
  playingKey = null;
  audio = null;
  emit();
}