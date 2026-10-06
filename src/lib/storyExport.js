// Die ganze Story als Datei: der komplette Verlauf mit allen Sprechern und
// Transkripten, dazu Besetzung, Stimmung und Tempo — und eine Vorlage zum
// Wiederladen plus alle Sprachnachrichten als Audiodatei.
import { downloadMedia } from "@/lib/download";
import { MOODS } from "@/lib/moodStyle";
import { PLAY_LEVELS } from "@/lib/playStyle";

const clean = (s) => String(s || "story").replace(/[^\wäöüÄÖÜß-]+/g, "_").slice(0, 60);

const when = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const clock = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "";
};

export const storyFileName = (title) => `${clean(title)}.txt`;
export const templateFileName = (title) => `${clean(title)}-vorlage.json`;

const hasAudio = (m) => (m.attachments || []).some((a) => a?.type === "audio" && a.url);

// Jede Sprachnachricht im Verlauf — mit Sprecher, Zeit und Dateiname.
export function collectVoiceNotes(messages = [], meName = "Ich") {
  const out = [];
  messages.forEach((m) => {
    (m.attachments || []).filter((a) => a?.type === "audio" && a.url).forEach((a) => {
      out.push({
        url: a.url,
        speaker: m.senderType === "HUMAN" ? meName : m.sender || "Figur",
        at: when(m.createdAt || m.created_date),
        filename: `sprachnachricht-${out.length + 1}.webm`,
      });
    });
  });
  return out;
}

const moodLabels = (ids) => (ids || []).map((id) => MOODS.find((m) => m.id === id)?.label).filter(Boolean);
const playLabel = (id) => PLAY_LEVELS.find((p) => p.id === id)?.label || "";

// Der lesbare Story-Text — genau so, wie er in die Bibliothek soll.
export function buildStoryText({ title, meName, messages = [], cast = [], moods = [], playLevel, scenarioTitle, setupAnswers = {} }) {
  const spoken = moodLabels(moods);
  const head = [
    `ARTANIS × TANIA — STORY`,
    ``,
    `Titel: ${title}`,
    `Exportiert: ${when()}`,
    scenarioTitle ? `Szenario: ${scenarioTitle}` : null,
    spoken.length ? `Stimmung: ${spoken.join(", ")}` : null,
    playLabel(playLevel) ? `Tempo: ${playLabel(playLevel)}` : null,
    ``,
    `BESETZUNG`,
    ...(cast.length
      ? cast.map((c) => `- ${c.name} — ${c.role}${c.voice ? ` · Stimme: ${c.voice}` : ""}${c.style ? ` · Wortwahl: ${c.style}` : ""}`)
      : ["- (keine Figuren erfasst)"]),
  ].filter((l) => l !== null);

  const facts = Object.entries(setupAnswers || {}).filter(([, v]) => v && (!Array.isArray(v) || v.length));
  const factBlock = facts.length
    ? ["", "GRUNDLAGEN", ...facts.map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)]
    : [];

  const transcript = messages
    .filter((m) => m.senderType !== "SYSTEM" && ((m.text || "").trim() || hasAudio(m)))
    .map((m) => {
      const t = clock(m.createdAt || m.created_date);
      const who = m.senderType === "HUMAN" ? meName : m.sender || title;
      const voice = hasAudio(m) ? " (Sprachnachricht — Transkript)" : "";
      const body = (m.text || "").trim() || "[ohne Text]";
      return `[${t}] ${who}${voice}: ${body}`;
    });

  const audio = collectVoiceNotes(messages, meName);
  const audioBlock = audio.length
    ? [
        ``,
        `SPRACHNACHRICHTEN (Audio)`,
        ...audio.map((v, i) => `${i + 1}. ${v.at} — ${v.speaker} → ${v.filename}`),
      ]
    : [];

  return [
    ...head,
    ...factBlock,
    ``,
    `VERLAUF`,
    ``,
    ...(transcript.length ? transcript : ["(noch nichts geschrieben)"]),
    ...audioBlock,
    ``,
  ].join("\n");
}

// Die Vorlage: alles, was die Szene ausmacht, als Datei zum Wiederladen.
export function buildTemplate({ title, messages = [], cast = [], moods = [], playLevel, scenario, setupAnswers = {} }) {
  return JSON.stringify(
    {
      kind: "artanis-story-vorlage",
      version: 1,
      title,
      exportedAt: new Date().toISOString(),
      scenario: scenario || null,
      setupAnswers,
      cast,
      moods,
      playLevel,
      verlauefe: messages
        .filter((m) => m.senderType !== "SYSTEM" && (m.text || "").trim())
        .map((m) => ({ wer: m.senderType === "HUMAN" ? "ICH" : m.sender || "FIGUR", text: m.text })),
    },
    null,
    2
  );
}

export function downloadText(filename, content) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Alles auf einmal: Story, Vorlage und jede Sprachnachricht als Audiodatei.
export async function downloadEverything(payload, onStep) {
  downloadText(storyFileName(payload.title), buildStoryText(payload));
  onStep?.("Story-Datei gespeichert");
  downloadText(templateFileName(payload.title), buildTemplate(payload));
  onStep?.("Vorlage gespeichert");
  const audio = collectVoiceNotes(payload.messages, payload.meName);
  for (const v of audio) {
    await downloadMedia(v.url, v.filename);
    onStep?.(`Audio ${v.filename} gespeichert`);
    await new Promise((r) => setTimeout(r, 400));
  }
  return audio.length;
}