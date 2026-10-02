import { BASE_VOICES } from "@/lib/voiceDj";

// In welcher Rolle sie auftritt — danach richtet sich ihr Ton.
export const NARRATOR_KINDS = [
  { id: "ERZAEHLERIN", label: "Erzählerin", prompt: "Du führst durch die Szene und bleibst die ganze Zeit dabei." },
  { id: "BEGLEITERIN", label: "Begleiterin", prompt: "Du gehst mit, wie eine Freundin, die daneben sitzt und mitfiebert." },
  { id: "BERATERIN", label: "Beraterin", prompt: "Du berätst wie eine Concierge, die den Laden in- und auswendig kennt." },
  { id: "VERFUHRERIN", label: "Verführerin", prompt: "Du redest ihr zu und stachelst sie an — nie plump, immer mit Andeutung." },
  { id: "BEOBACHTERIN", label: "Beobachterin", prompt: "Du schaust über die Schulter und sagst, was du siehst." },
];

export const NARRATOR_VOICES = BASE_VOICES;

// Erzählerin oder Erzähler — jeder darf sich selbst eine Stimme geben.
export const NARRATOR_GENDERS = [
  { id: "WEIBLICH", label: "Erzählerin" },
  { id: "MAENNLICH", label: "Erzähler" },
];

export const genderNoun = (gender) => (gender === "MAENNLICH" ? "Erzähler" : "Erzählerin");

export const kindOf = (id) => NARRATOR_KINDS.find((k) => k.id === id) || NARRATOR_KINDS[0];

export const voiceLabel = (id) => {
  const v = BASE_VOICES.find((x) => x.id === id);
  return v ? `${v.label} — ${v.hint}` : BASE_VOICES[0].label;
};

// Wer spricht — als Text für die KI. Zwei Erzählerinnen wechseln sich ab.
export function narratorBriefing(narrators = []) {
  if (!narrators.length) return "— noch keine gewählt —";
  return narrators
    .map((n, i) => {
      const kind = kindOf(n.kind);
      const parts = [kind.prompt, n.personality?.trim()].filter(Boolean);
      return `${i} — ${n.name} (${kind.label}): ${parts.join(" ")}`;
    })
    .join("\n");
}