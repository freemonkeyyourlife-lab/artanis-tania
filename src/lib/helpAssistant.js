import { base44 } from "@/api/base44Client";
import { SECTIONS, FIND_SPOTS, PAGES } from "@/lib/guideContent";
import { HELP } from "@/lib/helpTexts";

// Alles Wissen über die App als ein Text — daraus antwortet der Assistent.
function knowledge() {
  const sections = SECTIONS.map((s) =>
    `## ${s.title}\n${s.intro}\n${(s.steps || s.items || []).map((x) => `- ${x}`).join("\n")}`
  ).join("\n\n");
  const help = Object.values(HELP).map((h) => `## ${h.title}\n${h.steps.map((x) => `- ${x}`).join("\n")}`).join("\n\n");
  const pages = PAGES.map((p) => `- ${p.path}: ${p.label}`).join("\n");
  return `${sections}\n\n${help}\n\n## Wo du was findest\n${FIND_SPOTS.map((x) => `- ${x}`).join("\n")}\n\n## Seiten\n${pages}`;
}

export async function askHelp(question, history = []) {
  const past = history.slice(-4).map((h) => `Frage: ${h.q}\nAntwort: ${h.answer}`).join("\n\n");
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Du bist der Hilfe-Assistent in der App "ARTANIS × TANIA". Die Besitzerin ist keine Technikerin.
Erkläre ganz einfach, freundlich und auf Deutsch, in kurzen nummerierten Schritten (Markdown), mit den genauen Knopf-Namen aus dem Wissen.
Nutze NUR das Wissen unten. Wenn etwas dort nicht steht, sag ehrlich, dass es das noch nicht gibt, und dass sie es im Chat mit dem Bau-Assistenten anfragen kann.
Gib bei "links" 1–3 passende Seiten aus der Seitenliste zurück (nur Pfade aus der Liste), damit sie direkt hinspringen kann.

# Wissen
${knowledge()}

# Bisheriges Gespräch
${past || "—"}

# Neue Frage
${question}`,
    response_json_schema: {
      type: "object",
      properties: {
        answer: { type: "string" },
        links: { type: "array", items: { type: "object", properties: { label: { type: "string" }, path: { type: "string" } } } },
      },
    },
  });
  const valid = new Set(PAGES.map((p) => p.path));
  return { answer: res.answer || "", links: (res.links || []).filter((l) => valid.has(l.path)) };
}