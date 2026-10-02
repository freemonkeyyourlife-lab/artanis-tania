// Wofür ein Modell bekannt ist: Gesichter, Körper, Bewegung, Tempo — und ob es
// die Vorlage hält. Erst greift das Wissen über die Familie (die Kennung verrät
// sie), sonst werden die Kategorien des Modells gelesen. Etiketten hat danach
// jedes Modell — keins bleibt leer.

export const STRENGTH_TONES = {
  Gesichter: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  "Körper & Haut": "bg-rose-500/15 text-rose-300 border-rose-500/30",
  Fotoreal: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Anime: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  Illustration: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Comic: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  "3D": "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  Bewegung: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Schnell: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Prompt-treu": "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  Freizügig: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  Allround: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  "Hält ihr Gesicht": "bg-primary/20 text-primary border-primary/40",
};

// Der eingebaute Generator ist kein Modell — er nimmt jede Vorlage und hält
// ihr Gesicht am zuverlässigsten.
export const STANDARD_STRENGTH = {
  chips: ["Hält ihr Gesicht", "Fotoreal", "Gesichter"],
  hint: "Baut aus jedem Vorlagebild um und hält ihr Gesicht am zuverlässigsten.",
};

// Die Reihenfolge zählt: das Speziellere steht oben, das Allgemeine darunter.
// Ein Eintrag passt, wenn ALLE seine Teile in Kennung oder Name vorkommen.
const RULES = [
  {
    match: ["image-to-image"],
    chips: ["Hält ihr Gesicht"],
    hint: "Baut ein vorhandenes Bild um: andere Pose, andere Perspektive, anderes Licht — und sie bleibt sie selbst.",
  },
  {
    match: ["kontext"],
    chips: ["Hält ihr Gesicht", "Prompt-treu"],
    hint: "Nimmt dein Bild und baut es um — neue Pose, neue Kleidung, anderes Licht, und ihr Gesicht bleibt.",
  },
  {
    match: ["klein"],
    chips: ["Hält ihr Gesicht", "Prompt-treu"],
    hint: "Baut aus deiner Vorlage um und hält die Person dabei fest — schnell und günstig.",
  },
  {
    match: ["nanobanana"],
    chips: ["Prompt-treu", "Gesichter", "Hält ihr Gesicht"],
    hint: "Versteht genaue Ansagen und baut Bilder um, ohne die Person zu verlieren.",
  },
  {
    match: ["nano-banana"],
    chips: ["Prompt-treu", "Gesichter", "Hält ihr Gesicht"],
    hint: "Versteht genaue Ansagen und baut Bilder um, ohne die Person zu verlieren.",
  },
  {
    match: ["gemini"],
    chips: ["Prompt-treu", "Gesichter"],
    hint: "Folgt dem Prompt sehr genau und hält Gesichter sauber — auch beim Umbauen.",
  },
  {
    match: ["flux", "schnell"],
    chips: ["Fotoreal", "Gesichter", "Schnell"],
    hint: "Schneller Entwurf mit guten Gesichtern — zum Ausprobieren und für viele Varianten.",
  },
  {
    match: ["flux"],
    chips: ["Fotoreal", "Gesichter", "Prompt-treu"],
    hint: "Sehr stark bei echten Gesichtern und Haut und hält sich eng an deinen Prompt. Der beste Griff für Fotos von ihr.",
  },
  {
    match: ["pony"],
    chips: ["Anime", "Körper & Haut", "Freizügig"],
    hint: "Gezeichnete Figuren mit viel Ausdruck und Posen, geht weit — für alles Anime-Artige.",
  },
  {
    match: ["wai"],
    chips: ["Anime", "Körper & Haut", "Freizügig"],
    hint: "Anime mit sauberen Linien, geht sehr weit — für alles Freizügige im Zeichenstil.",
  },
  {
    match: ["hassaku"],
    chips: ["Anime", "Freizügig"],
    hint: "Anime mit weicher Zeichnung und wenig Scheu.",
  },
  {
    match: ["noob"],
    chips: ["Anime", "Körper & Haut"],
    hint: "Moderne Anime-Modelle mit großer Figurenvielfalt und sicheren Händen.",
  },
  {
    match: ["illustrious"],
    chips: ["Anime", "Körper & Haut"],
    hint: "Anime mit sauberen Linien und großer Figurenvielfalt.",
  },
  {
    match: ["animagine"],
    chips: ["Anime", "Gesichter"],
    hint: "Anime mit besonders ausdrucksstarken Gesichtern und Augen.",
  },
  {
    match: ["anything"],
    chips: ["Anime", "Allround"],
    hint: "Anime-Allrounder — Figuren, Szenen und Stimmungen im Zeichenstil.",
  },
  {
    match: ["counterfeit"],
    chips: ["Anime", "Gesichter"],
    hint: "Anime im weichen, gemalten Look — sehr schöne Gesichter.",
  },
  {
    match: ["pixart"],
    chips: ["Anime", "Schnell"],
    hint: "Schnelle, klare Anime-Bilder.",
  },
  {
    match: ["comic"],
    chips: ["Comic"],
    hint: "Für gezeichnete Panels und Sprechblasen-Look.",
  },
  {
    match: ["juggernaut"],
    chips: ["Fotoreal", "Körper & Haut", "Gesichter"],
    hint: "Fotoreal mit starken Körpern und Haut — für Ganzkörper und Dessous.",
  },
  {
    match: ["epicrealism"],
    chips: ["Fotoreal", "Körper & Haut", "Freizügig"],
    hint: "Fotoreal mit weicher Haut und wenig Scheu — gut für sinnliche Aufnahmen.",
  },
  {
    match: ["lustify"],
    chips: ["Fotoreal", "Körper & Haut", "Freizügig"],
    hint: "Fotoreal und ohne Filter — für alles, was andere Modelle ablehnen.",
  },
  {
    match: ["cyberrealistic"],
    chips: ["Fotoreal", "Körper & Haut", "Gesichter"],
    hint: "Fotoreal mit glänzender Haut und kräftigem Licht.",
  },
  {
    match: ["uberrealistic"],
    chips: ["Fotoreal", "Körper & Haut"],
    hint: "Fotoreal mit sehr weicher Haut und natürlichem Licht.",
  },
  {
    match: ["realistic", "vision"],
    chips: ["Fotoreal", "Gesichter"],
    hint: "Klassiker für realistische Porträts und Gesichter.",
  },
  {
    match: ["realvis"],
    chips: ["Fotoreal", "Gesichter", "Körper & Haut"],
    hint: "Sehr fotoreal, stark bei Gesichtern und Hauttextur.",
  },
  {
    match: ["chilloutmix"],
    chips: ["Fotoreal", "Gesichter"],
    hint: "Fotoreal mit weichem, asiatischem Beauty-Look.",
  },
  {
    match: ["majicmix"],
    chips: ["Fotoreal", "Gesichter"],
    hint: "Fotoreal mit sehr sauberen, hübschen Gesichtern.",
  },
  {
    match: ["kolors"],
    chips: ["Gesichter", "Fotoreal"],
    hint: "Besonders schöne Gesichter und weiche Ausleuchtung.",
  },
  {
    match: ["seedream"],
    chips: ["Fotoreal", "Gesichter", "Prompt-treu"],
    hint: "Fotoreal und sehr prompt-treu — hält Gesichter und Details sauber.",
  },
  {
    match: ["imagen"],
    chips: ["Fotoreal", "Gesichter"],
    hint: "Fotoreal mit sehr sauberen Gesichtern und Licht.",
  },
  {
    match: ["grok"],
    chips: ["Fotoreal", "Freizügig"],
    hint: "Fotoreal und ohne große Scheu — für direkte Aufnahmen.",
  },
  {
    match: ["nova"],
    chips: ["Allround", "Schnell"],
    hint: "Schneller Allrounder für Fotos und Stimmungen.",
  },
  {
    match: ["gptimage"],
    chips: ["Prompt-treu", "Allround"],
    hint: "Versteht Ansagen sehr genau — gut für genaue Bildideen.",
  },
  {
    match: ["gpt-image"],
    chips: ["Prompt-treu", "Allround"],
    hint: "Versteht Ansagen sehr genau — gut für genaue Bildideen.",
  },
  {
    match: ["zimage"],
    chips: ["Fotoreal", "Prompt-treu"],
    hint: "Fotoreal und prompt-treu — ein guter Alltagsgriff.",
  },
  {
    match: ["z-image"],
    chips: ["Fotoreal", "Prompt-treu"],
    hint: "Fotoreal und prompt-treu — ein guter Alltagsgriff.",
  },
  {
    match: ["dreamshaper"],
    chips: ["Allround", "Fotoreal"],
    hint: "Vielseitiger Allrounder — Fotos, Stimmung und Kunst in einem.",
  },
  {
    match: ["dreamlike"],
    chips: ["Fotoreal", "Körper & Haut"],
    hint: "Fotoreal mit weicher, verträumter Stimmung.",
  },
  {
    match: ["revanimated"],
    chips: ["Anime", "Fotoreal"],
    hint: "Zwischen Anime und Foto — gezeichnet, aber mit echter Haut.",
  },
  {
    match: ["lumina"],
    chips: ["Fotoreal", "Prompt-treu"],
    hint: "Fotoreal mit kräftigem Licht und guter Prompt-Treue.",
  },
  {
    match: ["chroma"],
    chips: ["Allround", "Freizügig"],
    hint: "Freier Allrounder, der auch Sinnliches mitnimmt.",
  },
  {
    match: ["hidream"],
    chips: ["Prompt-treu", "Gesichter"],
    hint: "Folgt dem Prompt sehr genau, auch bei mehreren Figuren im Bild.",
  },
  {
    match: ["qwen"],
    chips: ["Prompt-treu", "Allround"],
    hint: "Sehr prompt-treu und detailreich — gut für genaue Bildideen.",
  },
  {
    match: ["sana"],
    chips: ["Schnell", "Fotoreal"],
    hint: "Schnell und trotzdem sauber — für lange Reihen von Bildern.",
  },
  {
    match: ["wan"],
    chips: ["Bewegung"],
    hint: "Gemacht für Bewegung und Video — für alles, was sich regt.",
  },
  {
    match: ["ltx"],
    chips: ["Bewegung", "Schnell"],
    hint: "Kurze Videoclips mit flüssiger Bewegung.",
  },
  {
    match: ["turbo"],
    chips: ["Schnell"],
    hint: "Extrem schnell, dafür weniger Detail — für Entwürfe und Tests.",
  },
  {
    match: ["lightning"],
    chips: ["Schnell"],
    hint: "Extrem schnell, dafür weniger Detail — für Entwürfe und Tests.",
  },
  {
    match: ["lcm"],
    chips: ["Schnell"],
    hint: "Rechnet in wenigen Schritten — gut für schnelles Ausprobieren.",
  },
  {
    match: ["playground"],
    chips: ["Allround", "Fotoreal"],
    hint: "Farbig und kreativ, gut für ungewöhnliche Bildideen.",
  },
  {
    match: ["openjourney"],
    chips: ["Allround", "Fotoreal"],
    hint: "Kunstvoller Look, näher an gemalt als an fotografiert.",
  },
  {
    match: ["sdxl"],
    chips: ["Allround", "Gesichter"],
    hint: "Solider Allrounder für fast alles — ein sicherer Griff.",
  },
  {
    match: ["stable-diffusion-3"],
    chips: ["Prompt-treu", "Allround"],
    hint: "Folgt dem Prompt gut und mischt Stile sauber.",
  },
  {
    match: ["uncensored"],
    chips: ["Freizügig"],
    hint: "Ohne Filter — für alles, was andere Modelle ablehnen.",
  },
];

// Was in den Kategorien steht, wird zu Etiketten — damit kein Modell leer bleibt.
const STYLE_CHIPS = {
  FOTOREAL: "Fotoreal",
  ANIME: "Anime",
  ILLUSTRATION: "Illustration",
  COMIC: "Comic",
  RENDER_3D: "3D",
  GEMISCHT: "Allround",
};
const WIDE_LEVELS = ["ANZUEGLICH", "SINNLICH", "EXPLIZIT", "HART"];

// Ein Satz je Modell: die Etiketten für den schnellen Blick, der Satz für die
// Entscheidung. Ist die Familie unbekannt, zählen die eigenen Kategorien.
export function modelStrength(model) {
  const hay = `${model?.modelId || ""} ${model?.name || ""}`.toLowerCase();
  const rule = RULES.find((r) => r.match.every((part) => hay.includes(part)));
  if (rule) return { chips: rule.chips, hint: rule.hint, known: true };

  const chips = [];
  const style = STYLE_CHIPS[model?.style];
  if (style) chips.push(style);
  if (WIDE_LEVELS.includes(model?.explicit)) chips.push("Freizügig");
  (model?.moods || []).slice(0, 2).forEach((mo) => chips.push(mo));

  const own = (model?.note || model?.description || "").trim();
  const hint =
    own ||
    (chips.length
      ? `So eingetragen: ${chips.join(" · ")}. Genaueres kannst du in den Kategorien nachtragen.`
      : "Noch nichts bekannt — trag unter Kategorien nach, wofür du es nimmst, dann steht es hier.");
  return { chips, hint, known: false };
}