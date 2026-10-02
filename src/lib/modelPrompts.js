// Jedes Modell spricht seine eigene Sprache. Hier steht sie — als Grundsetting,
// damit der Generator immer die richtige Syntax trifft, ohne Nachdenken.

export const PRESETS = [
  {
    id: "PONY",
    label: "Pony Diffusion V6 XL",
    family: "Anime & Zeichnung",
    mode: "Tags, mit Komma getrennt",
    match: ["pony"],
    start: "score_9, score_8_up, score_7_up, rating_explicit, source_anime,",
    howto:
      "Einzelne Begriffe, mit Komma getrennt. Die Score-Tags müssen ganz vorne stehen — ohne sie funktioniert das Modell nicht. rating_explicit ist der Schlüssel für unzensierten Inhalt, source_anime zieht den Stil ins Gezeichnete. Keine ganzen Sätze, keine Bindewörter.",
    vocabulary:
      "naked, nude, uncensored, completely unclothed, spread legs, pussy, nipples, erect nipples, sex, penetration, vaginally, anal, handjob, blowjob, fellatio, cum, cum in pussy, facial cumshot, double penetration",
    negative: "score_1, score_2, score_3, rating_safe, rating_questionable, low-res, bad anatomy, bad hands, blurry, ugly, worst quality",
    lora: "<lora:SDXL-LoRA-slider.sexy:2.0>",
  },
  {
    id: "ILLUSTRIOUS",
    label: "Illustrious XL",
    family: "Anime, saubere Anatomie",
    mode: "Tags im Danbooru-Stil, mit Komma getrennt",
    match: ["illustrious", "noobai", "noob-ai"],
    start: "masterpiece, best quality, amazing quality, very aesthetic, absurdres, newest,",
    howto:
      "Ebenfalls einzelne Tags mit Komma — aber nicht die Pony-Scores, sondern die Illustrious-Qualitäts-Tags, und die gehören ganz nach vorne. Der Wortschatz kommt aus Danbooru: erst die Figur (1girl, solo), dann Blick und Pose (looking at viewer, from above), dann der Rest. Der Negativ-Prompt ist hier wichtiger als bei Pony, weil das Modell sonst in Skizzen und unbemalte Linien kippt.",
    vocabulary:
      "1girl, solo, naked, nude, uncensored, completely nude, large breasts, nipples, pussy, spread legs, sex, vaginal, penetration, cum, cum in pussy, ahegao, sweat, blush, looking at viewer",
    negative:
      "bad quality, worst quality, worst detail, sketch, censor, lowres, bad anatomy, bad hands, extra digits, watermark, signature",
    lora: "<lora:SDXL-LoRA-slider.sexy:2.0>",
  },
  {
    id: "BIGASP",
    label: "BigAsp v2",
    family: "Fotoreal, ganze Sätze",
    mode: "Sachliche, natürliche Sätze",
    match: ["bigasp", "big asp"],
    start: "score_7_up, A high quality photograph of",
    howto:
      "Ganze, sachliche Sätze statt Tag-Listen. Neutrales, fast klinisches Vokabular liefert die anatomisch saubersten Ergebnisse. Wörter wie „masterpiece“ vermeiden — sonst kippt das Bild in einen gezeichneten Comic-Stil.",
    vocabulary:
      "a man and a woman engaged in passionate explicit sexual intercourse, vaginally penetration, full nudity, clear view of genitals, detailed skin texture, explicit",
    negative: "low quality, deformed, illustration, drawing",
    lora: "<lora:SDXL-LoRA-slider.sexy:2.0>",
  },
  {
    id: "EPIC",
    label: "epiCRealism XL",
    family: "Fotoreal & Erotik",
    mode: "Sätze und beschreibende Begriffe gemischt",
    match: ["epicrealism", "epic realism", "epic"],
    start: "A photorealistic explicit 8k raw photo of",
    howto:
      "Mischung aus Sätzen und beschreibenden Begriffen. Das Modell ist kein reines Pornomodell und versteckt Genitalien oder komplexe Stellungen gern — hier hilft der LoRA-Zusatz.",
    vocabulary:
      "full frontal nudity, uncensored, detailed pussy, erect nipples, intimate explicit pose, sweaty skin, intricate details, hardcore sex",
    negative: "low quality, deformed, blurry, bad anatomy, watermark, text",
    lora: "<lora:SDXL-LoRA-slider.sexy:2.0>",
  },
  {
    id: "ALLGEMEIN",
    label: "Allgemein",
    family: "Ohne feste Syntax",
    mode: "Neutral",
    match: [],
    start: "",
    howto:
      "Kein Modell gewählt — der Prompt wird neutral geschrieben. Wähle oben dein Modell, dann benutzt der Generator dessen eigene Syntax.",
    vocabulary: "",
    negative: "low quality, deformed, blurry, bad anatomy, watermark, text",
    lora: "",
  },
];

export const presetById = (id) => PRESETS.find((p) => p.id === id) || PRESETS[PRESETS.length - 1];

// Aus Name oder Kennung erkennen, welche Sprache ein Modell spricht.
export function detectPreset(name = "", modelId = "") {
  const hay = `${name} ${modelId}`.toLowerCase();
  return PRESETS.find((p) => p.match.length && p.match.some((m) => hay.includes(m))) || null;
}

// Das Grundsetting eines Modells: gespeichert, sonst erkannt, sonst neutral.
export function presetFor(model) {
  if (model?.preset && PRESETS.some((p) => p.id === model.preset)) return presetById(model.preset);
  return detectPreset(model?.name, model?.modelId) || presetById("ALLGEMEIN");
}