import { base44 } from "@/api/base44Client";
import { narratorBriefing } from "@/lib/narratorStyle";
import { therapistName, formatLabel, roleLabel } from "@/lib/therapyPrompts";

// Die Erzählerin schreibt die Zusammenfassung der Sitzung — nicht die
// Therapeutin. Sie war die ganze Zeit dabei und erzählt, was geblieben ist.
export async function writeSummary({ narrators = [], session, messages = [] }) {
  const history = messages
    .filter((m) => m.senderType !== "GUEST")
    .map((m) => {
      if (m.senderType === "AI") return `${session?.actor?.active ? "Szene" : therapistName(session)}: ${m.text}`;
      if (m.senderType === "SYSTEM") return `Hinweis: ${m.text}`;
      return `Klient: ${m.text}`;
    })
    .join("\n");

  const prompt = [
    "Du fasst eine Therapie-Sitzung zusammen, die gerade stattgefunden hat. Du warst die ganze Zeit dabei und hast zugehört.",
    `# Deine Erzählerinnen\n${narratorBriefing(narrators)}`,
    `# Die Sitzung\nThema: "${session?.topic || "ohne Thema"}"${session?.goal ? `\nErhofft: "${session.goal}"` : ""}\nFormat: ${formatLabel(session)}\nRollen: ${roleLabel(session)}`,
    `# Der Verlauf\n${history || "(noch nichts gesagt)"}`,
    "# Auftrag",
    "Schreib die Zusammenfassung: was war heute dran, was ist durchgekommen, was liegt noch offen. Vier bis sechs Sätze.",
    "Bleib in deiner Rolle und in deiner Persönlichkeit — aber erfinde nichts dazu, was nicht gesagt wurde.",
    "Sprich den Klienten direkt an und duze ihn. Keine Überschrift, keine Aufzählung, keine Anführungszeichen, keine Regieanweisungen.",
    "Nur der Fließtext der Zusammenfassung, auf Deutsch.",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await base44.integrations.Core.InvokeLLM({ prompt });
  return String(typeof res === "string" ? res : res?.response || res?.text || res?.output || "").trim();
}