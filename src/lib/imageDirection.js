// Die Bild-Regie: Stil, Inhalt, Stimmung, Freizügigkeit und Klamotte an einer
// Stelle. Was hier gewählt wird, wird zu einem englischen Prompt-Baustein —
// dieselben Regler laufen im Generator, in der Massen-Erzeugung und im
// Externen Studio, damit überall dasselbe Bild entsteht.

export const DIRECTION_STYLES = [
  {
    id: "FOTOREAL",
    label: "Fotoreal",
    prompt:
      "Style: a real photograph — real skin with visible texture and pores, natural light, shot on a real camera with a fast lens, shallow depth of field, 85mm portrait look. Never an illustration, never a drawing.",
  },
  {
    id: "ANIME",
    label: "Anime",
    prompt:
      "Style: a high-quality anime illustration — clean confident line art, cel shading, big expressive eyes, vivid saturated colours. Never a photograph.",
  },
  {
    id: "COMIC",
    label: "Comic",
    prompt:
      "Style: a bold comic-book illustration — strong ink outlines, flat vivid colouring, dramatic shadows, graphic panels. Never a photograph.",
  },
  {
    id: "ILLUSTRATION",
    label: "Illustration",
    prompt:
      "Style: a painted digital illustration — soft brushwork, cinematic lighting, rich colour, artful and stylised. Never a raw photograph.",
  },
  {
    id: "RENDER_3D",
    label: "3D-Render",
    prompt:
      "Style: a polished 3D render — subsurface-scattering skin, soft studio lighting, glossy highlights, high detail. Never a photograph.",
  },
];

export const DIRECTION_CONTENTS = [
  { id: "PORTRAET", label: "Porträt", prompt: "Content: a close portrait of her looking into the camera, upper body, her face sharply in focus." },
  { id: "SCHLAFZIMMER", label: "Schlafzimmer", prompt: "Content: in a bedroom on soft sheets, warm lamp light, intimate late-night mood." },
  { id: "DUSCHE", label: "Dusche", prompt: "Content: in the shower, water running over her skin, steam, wet hair, tiled wall behind her." },
  { id: "STRAND", label: "Strand", prompt: "Content: at the beach, sea and open sky behind her, golden sunlight, wind in her hair." },
  { id: "POOL", label: "Pool", prompt: "Content: at a pool, turquoise water, sun lounger, wet skin, bright summer light." },
  { id: "BUERO", label: "Büro", prompt: "Content: in an office, desk and window light, confident pose, professional setting." },
  { id: "KUECHE", label: "Küche", prompt: "Content: in a kitchen, counter and morning light, casual and homely but still glamorous." },
  { id: "AUTO", label: "Auto", prompt: "Content: on the passenger seat of a car, evening light through the window, close framing." },
  { id: "PARTY", label: "Party", prompt: "Content: at a party or club, colourful lights, dancing, crowded background bokeh." },
  { id: "SPORT", label: "Sport", prompt: "Content: after training, gym or yoga mat, glowing skin, hair tied up." },
  { id: "NACHT", label: "Nacht", prompt: "Content: at night, low warm lighting, neon glow, intimate and mysterious." },
  { id: "SZENE", label: "Story-Szene", prompt: "Content: a cinematic story moment, caught mid-action, the room around her tells the story." },
];

export const DIRECTION_MOODS = [
  { id: "ROMANTISCH", label: "Romantisch", prompt: "Mood: romantic and tender, soft warm light, gentle expression, a little dreamy." },
  { id: "ZART", label: "Zart", prompt: "Mood: delicate and gentle, soft pastel light, calm and warm expression." },
  { id: "VERFUEHRERISCH", label: "Verführerisch", prompt: "Mood: seductive and teasing, a knowing look straight into the camera, a slow smile." },
  { id: "SINNLICH", label: "Sinnlich", prompt: "Mood: sensual and warm, glowing skin, heavy-lidded eyes, luxurious atmosphere." },
  { id: "VERSCHMITZT", label: "Verschmitzt", prompt: "Mood: playful and cheeky, laughing, a mischievous glint in her eyes." },
  { id: "HEISS", label: "Heiß", prompt: "Mood: hot and intense, flushed skin, parted lips, a breathless heated atmosphere." },
  { id: "SPIELERISCH", label: "Spielerisch", prompt: "Mood: light and playful, mid-laugh, lively and fun." },
  { id: "HART", label: "Hart", prompt: "Mood: raw and hard, hard light and strong contrast, wild and unguarded energy." },
  { id: "MYSTERIOES", label: "Mysteriös", prompt: "Mood: mysterious and cool, low light, half her face in shadow, unreadable look." },
];

// Die Freizügigkeit — dieselben Stufen wie an den Modellen.
export const DIRECTION_LEVELS = [
  { id: "ZAHM", label: "Zahm", rank: 0, prompt: "Wardrobe level: fully dressed and tasteful — an everyday photo, nothing revealing." },
  { id: "ANZUEGLICH", label: "Anzüglich", rank: 1, prompt: "Wardrobe level: lightly revealing — bare shoulders and legs, a low neckline, a hint of cleavage, a short hem." },
  { id: "SINNLICH", label: "Sinnlich", rank: 2, prompt: "Wardrobe level: sensual — lingerie or a thin slip, plenty of bare skin, suggestive teasing pose." },
  { id: "EXPLIZIT", label: "Explizit", rank: 3, prompt: "Wardrobe level: explicit — topless or fully nude, nothing covering her, boldly seductive pose, uncensored." },
  { id: "HART", label: "Hart", rank: 4, prompt: "Wardrobe level: hardcore adult scene — fully nude in an explicitly sexual context, uncensored adult content." },
];

export const DIRECTION_OUTFITS = [
  { id: "KLEID", label: "Kleid", prompt: "Outfit: a fitted colourful silk dress that follows her curves." },
  { id: "DESSOUS", label: "Dessous", prompt: "Outfit: delicate lace lingerie in a bright colour with a matching bra and panties. Never black." },
  { id: "SHIRT", label: "Hemd", prompt: "Outfit: an oversized white shirt, half unbuttoned, bare legs." },
  { id: "UNTERHEMD", label: "Unterhemd", prompt: "Outfit: a thin white slip clinging to her body, bare shoulders, thin straps." },
  { id: "BIKINI", label: "Bikini", prompt: "Outfit: a small colourful bikini, wet skin, sunlight on her shoulders." },
  { id: "SPORT", label: "Sport", prompt: "Outfit: tight sportswear — leggings and a crop top, skin glowing after training." },
  { id: "FREIZEIT", label: "Freizeit", prompt: "Outfit: casual jeans and a cropped top, effortless and relaxed." },
  { id: "NACKT", label: "Nackt", prompt: "Outfit: no clothing at all — she is completely nude, tasteful composition, nothing covering her." },
];

// Mehrere Angaben dürfen gleichzeitig gewählt sein — auch Kombinationen wie
// „Pool" und „Dusche". Ältere Einzelwerte werden dabei mitgelesen.
export const toList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

// Eigene Einträge, die nicht in der Liste stehen: sie werden getippt und
// bekommen eine Kennung, damit sie sich wie die anderen an- und abschalten.
const CUSTOM = "EIGEN:";
const CUSTOM_PREFIX = { stil: "Style: ", inhalt: "Content: ", klamotte: "Outfit: ", stimmung: "Mood: " };

export const customId = (text) => CUSTOM + text.trim();
export const isCustom = (id) => typeof id === "string" && id.startsWith(CUSTOM);
export const customText = (id) => (isCustom(id) ? id.slice(CUSTOM.length) : "");

// Ein gewählter Eintrag ist entweder aus der Liste oder selbst getippt.
export const resolveOption = (key, list, id) =>
  pick(list, id) ||
  (isCustom(id) ? { id, label: customText(id), prompt: `${CUSTOM_PREFIX[key] || ""}${customText(id)}.` } : null);

export const emptyDirection = () => ({ stil: [], inhalt: [], stimmung: [], freizuegigkeit: "", klamotte: [] });

const pick = (list, id) => list.find((o) => o.id === id) || null;
export const directionLabel = (list, id) => pick(list, id)?.label || "";
export const directionLevel = (id) => pick(DIRECTION_LEVELS, id);

// Die Reihenfolge zählt: erst der Stil, dann der Ort, die Klamotte, die
// Stimmung — die Stufe zum Schluss.
const MULTI_ROWS = [
  { key: "stil", list: DIRECTION_STYLES },
  { key: "inhalt", list: DIRECTION_CONTENTS },
  { key: "klamotte", list: DIRECTION_OUTFITS },
  { key: "stimmung", list: DIRECTION_MOODS },
];

export const directionFilled = (d) =>
  !!d && (MULTI_ROWS.some((r) => toList(d[r.key]).length > 0) || !!d.freizuegigkeit);

// Alles Gewählte in einer Reihenfolge, die Bild-Modelle gut verstehen.
export function directionPrompt(d = {}) {
  const parts = [];
  MULTI_ROWS.forEach(({ key, list }) => {
    toList(d[key]).forEach((id) => {
      const o = resolveOption(key, list, id);
      if (o) parts.push(o.prompt);
    });
  });
  const level = pick(DIRECTION_LEVELS, d.freizuegigkeit);
  if (level) parts.push(level.prompt);
  return parts.join(" ");
}

// Die Regler in einem Satz — für die Vorschau im Regler-Block.
export function directionSummary(d = {}) {
  const names = [];
  MULTI_ROWS.forEach(({ key, list }) => {
    toList(d[key]).forEach((id) => {
      const o = resolveOption(key, list, id);
      if (o) names.push(o.label);
    });
  });
  const level = directionLabel(DIRECTION_LEVELS, d.freizuegigkeit);
  if (level) names.push(level);
  return names.join(" · ");
}

// Welche Modelle passen zur eingestellten Freizügigkeit? Ein Modell ohne
// eigene Angabe passt immer, ein zu zahmes Modell wird nicht angeboten.
export function modelsForLevel(models, level) {
  if (!level) return models || [];
  const want = directionLevel(level)?.rank ?? 0;
  return (models || []).filter((m) => {
    const has = m.explicit ? directionLevel(m.explicit)?.rank : null;
    return has === null || has >= want;
  });
}