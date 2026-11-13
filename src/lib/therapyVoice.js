import { therapistName } from "@/lib/therapyPrompts";

// Die Stimme einer Rolle in der Sitzung auflösen — Therapeutin, Akteur, Gast
// oder Erzählerin. Eine eigene (geklonte) Stimme geht vor der Grundstimme.
// Für den Nutzer gibt es keinen festen Eintrag — er bekommt eine eigene,
// tiefere Grundstimme, damit er im Hörspiel nicht wie die Therapeutin klingt;
// seine echte Aufnahme (msg.audio) geht immer vor.
export function therapyVoiceFor(session, name) {
  const key = String(name || "").toLowerCase();
  if (key === "__narrator__") return { baseVoice: session?.narratorVoice || "river" };
  const actor = session?.actor;
  if (actor?.active && actor.name && key === actor.name.toLowerCase()) {
    if (actor.voiceId) return { provider: "ELEVENLABS", externalVoiceId: actor.voiceId };
    return { baseVoice: actor.voice || "storm" };
  }
  const member = (session?.cast || []).find((c) => c.name && c.name.toLowerCase() === key);
  if (member) {
    if (member.voiceId) return { provider: "ELEVENLABS", externalVoiceId: member.voiceId };
    if (member.voice) return { baseVoice: member.voice };
  }
  const tName = (therapistName(session) || "").toLowerCase();
  if (tName && key === tName) {
    if (session?.therapistVoiceId) return { provider: "ELEVENLABS", externalVoiceId: session.therapistVoiceId };
    return { baseVoice: session?.therapistVoice || "honey" };
  }
  const userKey = (session?.userName || "du").toLowerCase();
  const isUser =
    key === "du" || key === "user" || key === "ich" || key === "anonym" || key === userKey;
  if (isUser) return { baseVoice: session?.userVoice || "storm" };
  if (session?.therapistVoiceId) return { provider: "ELEVENLABS", externalVoiceId: session.therapistVoiceId };
  return { baseVoice: session?.therapistVoice || "honey" };
}