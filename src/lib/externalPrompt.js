// Ein fertiger Prompt für jedes externe Bild-Studio: kopieren, dort einfügen,
// erzeugen — und das Ergebnis hier wieder hochladen.

const STYLE = {
  PHOTOREAL:
    "Photorealistic photograph, real human skin with visible texture, natural light, shot on a real camera with a real lens",
  CARTOON:
    "Stylised 2D illustration, clean line art, cel-shaded colouring, big expressive eyes, painted cinematic light",
};

const PERSON = {
  SOLO_MALE: "man",
  SOLO_FEMALE: "woman",
  SHEMALE: "trans woman",
  COUPLE: "couple",
  GROUP: "group",
};

const LOOK =
  "Extremely attractive and glamorous, full professional makeup with lined eyes and glossy lips in red, nude or pink. Light, colourful clothing in white, cream, red, pink, rose, gold, emerald or turquoise — silk, satin or lace, soft neckline, bare shoulders, never black. Warm, dim, intimate light, soft shadows. Tasteful and teasing with one clear focus; the background stays soft.";

export const characterPrompt = (c = {}) => {
  const parts = [
    `${STYLE[c.artStyle] || STYLE.PHOTOREAL} — portrait of a ${PERSON[c.personaType] || "woman"} called "${(c.stageName || "").trim()}"`,
    c.age ? `${c.age} years old` : "",
    (c.tagline || "").trim(),
    (c.shortStory || c.bio || "").trim().slice(0, 300),
    LOOK,
  ];
  return parts
    .filter(Boolean)
    .join(". ")
    .replace(/\.\s*\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
};

export const promptList = (creators = []) =>
  creators.map((c) => `${c.stageName}\n${characterPrompt(c)}`).join("\n\n");