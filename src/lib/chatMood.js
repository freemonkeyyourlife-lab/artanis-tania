import { base44 } from "@/api/base44Client";
import { MOODS, moodVoice } from "@/lib/moodStyle";

// Der Stimmungs-Regler des Chat-Moduls: liest aus dem Gespräch, wo es gerade
// steht — und übersetzt das in Ton und Bildsprache. Gemerkt wird es am Gerät,
// damit ein Gespräch mit seiner Stimmung zurückkommt.

const KEY = "artanis:chatmood";

export function moodFor(convId) {
  if (!convId) return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}")[convId] || null;
  } catch (e) {
    return null;
  }
}

export function setMoodFor(convId, mood) {
  if (!convId) return;
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "{}");
    all[convId] = mood;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch (e) {
    /* Speicher verweigert — die Stimmung gilt trotzdem für diese Sitzung */
  }
}

const SCHEMA = {
  type: "object",
  properties: {
    moodIds: { type: "array", items: { type: "string" } },
    tone: { type: "string" },
    imageStyle: { type: "string" },
    summary: { type: "string" },
  },
  required: ["moodIds", "tone", "imageStyle", "summary"],
};

// Das Gespräch lesen und in Stimmung übersetzen.
export async function readMood(messages) {
  const history = (messages || [])
    .slice(-12)
    .map((m) => `${m.senderType === "HUMAN" ? "Nutzer" : "Assistent"}: ${m.text || ""}`)
    .join("\n")
    .trim();
  if (!history) return null;

  const prompt = `Du bist der Stimmungs-Regler eines Chat-Moduls.

Lies das Gespräch und bestimme, wo es gerade steht.

STIMMUNG — wähle 1 bis 3, die am besten passen: ${MOODS.map((m) => `${m.id} (${m.label})`).join(" | ")}
TON — zwei bis drei deutsche Sätze als Anweisung, wie der Assistent ab jetzt spricht: Wortwahl, Tempo, Nähe. Kein Vorwort, keine Anrede.
BILDSPRACHE — eine englische Zeile (höchstens 20 Wörter) für den Stil des nächsten Bildes: Licht, Farben, Nähe, Atmosphäre. Nur Stil, keine Person, keine Handlung.
KURZ — ein deutscher Satz, der die Stimmung zusammenfasst.

GESPRÄCH:
"""${history}"""`;

  const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: SCHEMA });
  const data = typeof res === "string" ? JSON.parse(res) : res;

  const moodIds = (data?.moodIds || []).filter((id) => MOODS.some((m) => m.id === id));
  return {
    moodIds,
    tone: data?.tone || "",
    imageStyle: data?.imageStyle || "",
    summary: data?.summary || "",
    // Die Stimmung als konkrete Stimmwerte — Tempo, Tonhöhe, Intensität — damit
    // der Vorleser sie hören lässt, nicht nur beschreibt.
    voice: moodVoice(moodIds),
    at: new Date().toISOString(),
  };
}

export const moodLabels = (mood) =>
  (mood?.moodIds || []).map((id) => MOODS.find((m) => m.id === id)?.label || id);