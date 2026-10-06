// Die ganze Sitzung als Datei: Plan, Besetzung und der komplette Verlauf —
// zum Aufheben und zum Weitergeben.
import { downloadText } from "@/lib/storyExport";
import { INTENSITIES, THERAPY_MODES, formatLabel, therapistName, roleLabel } from "@/lib/therapyPrompts";

const clean = (s) => String(s || "sitzung").replace(/[^\wäöüÄÖÜß-]+/g, "_").slice(0, 60);

const clock = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "";
};

const modeLabel = (id) => THERAPY_MODES.find((m) => m.value === id)?.label || "";
const intensityLabel = (id) => INTENSITIES.find((i) => i.value === id)?.label || "";

export function buildSessionText(session, messages = []) {
  const name = therapistName(session);
  const cast = session.cast || [];
  const head = [
    "ARTANIS × TANIA — SPRECHSTUNDE",
    "",
    session.seriesTitle ? `Serie: ${session.seriesTitle}` : null,
    `Format: ${formatLabel(session)}`,
    `Thema: ${session.topic}`,
    session.goal ? `Erhofft sich: ${session.goal}` : null,
    `Rollen: ${roleLabel(session)}`,
    modeLabel(session.mode) ? `Modus: ${modeLabel(session.mode)}` : null,
    intensityLabel(session.intensity) ? `Intensität: ${intensityLabel(session.intensity)}` : null,
    `Therapeutin: ${name}${session.therapistAge ? `, ${session.therapistAge}` : ""}${session.therapistType ? `, ${session.therapistType}` : ""}`,
    session.therapistRole ? `Ihre Rolle: ${session.therapistRole}` : null,
    session.therapistStyle ? `Ihr Ton: ${session.therapistStyle}` : null,
    session.location ? `Ort: ${session.location}` : null,
    session.clientAge ? `Alter des Klienten: ${session.clientAge}` : null,
    session.agreement ? `Vereinbarung: ${session.agreement}` : null,
    session.agenda ? `Ablauf: ${session.agenda}` : null,
    (session.liveMode || "OFF") !== "OFF" ? `Live: ${session.liveMode === "CAM" ? "Cam zu Cam" : "nur Stream"}` : null,
    "",
    "BESETZUNG",
    ...(cast.length
      ? cast.map((c) => `- ${c.name} — ${c.mode === "PRESENT" ? "anwesend" : "informiert"}`)
      : ["- (nur du und die Therapeutin)"]),
  ].filter((l) => l !== null);

  const transcript = messages
    .filter((m) => m.senderType !== "SYSTEM" && (m.text || "").trim())
    .map((m) => {
      const who = m.senderType === "AI" ? name : m.senderType === "GUEST" ? `${m.senderName || "Gast"} (Zuschauer)` : (m.senderName || session.userName || "Klient");
      return `[${clock(m.created_date)}] ${who}: ${m.text.trim()}`;
    });

  return [
    ...head,
    "",
    "VERLAUF",
    "",
    ...(transcript.length ? transcript : ["(noch nichts gesprochen)"]),
    "",
  ].join("\n");
}

export function downloadSession(session, messages) {
  downloadText(`${clean(session?.seriesTitle || session?.topic)}.txt`, buildSessionText(session, messages));
}