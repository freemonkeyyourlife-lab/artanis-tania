import { base44 } from "@/api/base44Client";
import { MOODS } from "@/lib/moodStyle";
import { PLAY_LEVELS } from "@/lib/playStyle";
import { SPEECH_STYLES } from "@/lib/speechStyle";

const VOICE_MOODS = ["NEUTRAL", "SANFT", "VERFUEHRERISCH", "HEISS", "SPIELERISCH", "ERNST", "HART"];

const clamp = (v, min, max, fallback) =>
  typeof v === "number" && isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

const text = (v) => String(v || "").trim();

// Aus einem Satz in eigenen Worten werden die passenden Werte für Stimmung,
// Tempo, Wortwahl, Stimme und die Szene.
export async function readMood({ words, creator }) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Du bist der Stimmungs-Regler einer Story-Plattform für Erwachsene.

Der Nutzer beschreibt in eigenen Worten, wie sich das nächste Erlebnis anfühlen soll. Übersetze das in feste Werte.

STIMMUNG — wähle 1 bis 3, die am besten passen: ${MOODS.map((m) => `${m.id} (${m.label}: ${m.prompt})`).join(" | ")}
TEMPO — genau eine: ${PLAY_LEVELS.map((p) => `${p.id} (${p.label}: ${p.hint})`).join(" | ")}
WORTWAHL — genau eine: ${SPEECH_STYLES.map((s) => `${s.id} (${s.label}: ${s.prompt})`).join(" | ")}
STIMMKLANG — genau eine: ${VOICE_MOODS.join(" | ")}
REGLER — speed zwischen 0.7 und 1.3, depth zwischen -40 und 20 (0 ist neutral, negativ klingt tiefer), intensity zwischen 0 und 100. Übertreibe nicht.
WORTWAHL-ZUSATZ — ein kurzer deutscher Halbsatz, der die Wortwahl der Figur noch genauer festlegt.
SZENEN-VORGABE — zwei bis vier deutsche Sätze als Regieanweisung für das nächste Erlebnis: Ort, Licht, Nähe, Tempo, Ton. Kein Vorwort, keine Anrede, keine Überschrift.
KURZ — ein deutscher Satz, der zusammenfasst, was eingestellt wurde.

Figur: ${creator?.stageName || "unbekannt"}${creator?.age ? `, ${creator.age} Jahre` : ""}${creator?.tagline ? `, ${creator.tagline}` : ""}.

WUNSCH DES NUTZERS:
"""${text(words)}"""`,
    response_json_schema: {
      type: "object",
      properties: {
        moodIds: { type: "array", items: { type: "string" } },
        playLevel: { type: "string" },
        styleId: { type: "string" },
        styleNote: { type: "string" },
        voiceMood: { type: "string" },
        speed: { type: "number" },
        depth: { type: "number" },
        intensity: { type: "number" },
        sceneNote: { type: "string" },
        summary: { type: "string" },
      },
      required: ["moodIds", "playLevel", "styleId", "voiceMood", "sceneNote", "summary"],
    },
  });
  return clean(res);
}

// Nichts durchlassen, was die App nicht kennt.
function clean(res) {
  return {
    moodIds: (res?.moodIds || []).filter((id) => MOODS.some((m) => m.id === id)).slice(0, 3),
    playLevel: PLAY_LEVELS.some((p) => p.id === res?.playLevel) ? res.playLevel : "NORMAL",
    styleId: SPEECH_STYLES.some((s) => s.id === res?.styleId) ? res.styleId : null,
    styleNote: text(res?.styleNote),
    voice: {
      mood: VOICE_MOODS.includes(res?.voiceMood) ? res.voiceMood : "NEUTRAL",
      speed: clamp(res?.speed, 0.7, 1.3, 1),
      depth: clamp(res?.depth, -40, 20, 0),
      intensity: clamp(res?.intensity, 0, 100, 50),
    },
    sceneNote: text(res?.sceneNote),
    summary: text(res?.summary),
  };
}