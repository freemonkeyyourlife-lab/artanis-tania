import { CARTOON_STYLE, IMAGE_SAFE_RULES, PHOTOREAL } from "@/lib/appearance";
import { directionPrompt, toList } from "@/lib/imageDirection";

// Ein Bild-Prompt für alle Generatoren im Studio. Die Regler stehen direkt
// hinter dem Grundstil — viele Bild-Modelle lesen nur den Anfang eines Prompts,
// deshalb dürfen Stimmung, Stil und Freizügigkeit nicht hinten angehängt werden.
export function composeImagePrompt({ animated = false, name = "", subject = "woman", withRefs = false, prompt = "", direction }) {
  // Ein gewählter Stil-Regler ersetzt den einfachen Fotoreal/Animiert-Schalter.
  const base = toList(direction?.stil).length ? "" : animated ? CARTOON_STYLE : PHOTOREAL;
  const parts = [base + IMAGE_SAFE_RULES];
  const dir = directionPrompt(direction);
  if (dir) parts.push(dir);
  if (name && withRefs) {
    const keep = subject === "man" ? "his" : "her";
    parts.push(
      `The ${subject} in the reference images is ${name}. Keep ${keep} face, hair colour, hair length, body and skin tone EXACTLY as in ${keep} reference images — ${subject === "man" ? "he" : "she"} must be recognisable.`
    );
  }
  if (prompt.trim()) parts.push(prompt.trim());
  return parts.join(" ").replace(/\s+/g, " ").trim();
}