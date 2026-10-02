// Wofür ein Modell bekannt ist: Gesichter, Körper, Bewegung, Tempo — und ob es
// die Vorlage hält. Die Kennung verrät die Familie; ohne Treffer zählt die
// eigene Notiz aus dem Studio. Alles hier ist reine Zuordnung, kein KI-Aufruf.

export const STRENGTH_TONES = {
  Gesichter: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  "Körper & Haut": "bg-rose-500/15 text-rose-300 border-rose-500/30",
  Fotoreal: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Anime: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  Bewegung: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Schnell: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Prompt-treu": "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  Freizügig: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  Allround: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  "Hält ihr Gesicht": "bg-primary/20 text-primary border-primary/40",
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
    match: ["kolors"],
    chips: ["Gesichter", "Fotoreal"],
    hint: "Besonders schöne Gesichter und weiche Ausleuchtung.",
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

// Ein Satz je Modell: die Etiketten für den schnellen Blick, der Satz für die
// Entscheidung. Ohne Treffer zählt, was im Studio als Notiz hinterlegt ist.
export function modelStrength(model) {
  const hay = `${model?.modelId || ""} ${model?.name || ""}`.toLowerCase();
  const rule = RULES.find((r) => r.match.every((part) => hay.includes(part)));
  const own = (model?.note || model?.description || "").trim();
  return {
    chips: rule?.chips || [],
    hint: rule?.hint || own || "Keine Einordnung bekannt — einfach ausprobieren.",
    own: !rule && !!own,
  };
}