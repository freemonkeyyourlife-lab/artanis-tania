import {
  Camera,
  Film,
  Box,
  Ban,
  Sparkles,
  ShoppingCart,
  Coins,
  Wrench,
  ListChecks,
} from "lucide-react";

// Der Modell-Plan zum Nachschlagen: was wir haben, was fehlt, was es kostet.
// Alles in einem Datenblatt, damit die Seite selbst schlank bleibt.

// ── Die Familien ──────────────────────────────────────────────
export const FAMILIES = [
  {
    name: "Fotoreal (Kamera)",
    looks: "Echte Haut mit Poren, echtes Licht, wie ein Handyfoto",
    use: "Verkaufen, spätere Filme — alles, was echt wirken muss",
    status: "Haben wir: viele",
    good: true,
  },
  {
    name: "Film-Look (Cinematic)",
    looks: "Dasselbe Medium — nur mit Kino-Sprache: 35 mm, Filmkorn, Gegenlicht, flache Schärfe",
    use: "Teaser, Trailer, atmosphärische Szenen",
    status: "Kein eigenes Modell — nur Wörter im Prompt",
    good: true,
  },
  {
    name: "3D-Render (CGI)",
    looks: "Unreal / Octane / Blender: plastische Haut, saubere Kanten, künstliches Studiolicht",
    use: "Wenn es bewusst künstlich aussehen soll — hochwertig, aber nicht echt",
    status: "Fehlt",
    good: true,
  },
  {
    name: "2.5D",
    looks: "Gezeichnet, aber mit 3D-Licht",
    use: "Die Brücke zwischen den Welten",
    status: "Brauchen wir nicht",
    good: false,
  },
  {
    name: "2D / Anime / Comic",
    looks: "Strich, Fläche, Zellschatten",
    use: "—",
    status: "Ausgeschlossen",
    good: false,
  },
];

export const FAMILY_NOTE =
  "„Film“ ist kein anderes Medium. Es ist Fotoreal mit anderen Wörtern — 35 mm, Filmkorn, Gegenlicht. " +
  "Du brauchst dafür kein zusätzliches Modell, nur die richtige Beschreibung. " +
  "Die echte Trennlinie verläuft zwischen echt (Foto), unecht-aber-hochwertig (3D-Render) und gezeichnet (2D). " +
  "Zeichnen ist nicht billiger als 3D — es ist dieselbe Rechnung. Günstig wird es über kleine, destillierte Modelle, " +
  "die in wenigen Schritten fertig sind.";

// ── Was da ist und taugt ──────────────────────────────────────
export const HAVE = [
  { model: "Z-Image-Turbo", family: "Fotoreal", known: "Schnell und fotoreal in wenigen Schritten — der günstigste gute Entwurf", via: "Hugging Face", cost: "Sehr günstig" },
  { model: "Qwen-Image-Lightning", family: "Fotoreal", known: "Fotoreal in wenigen Schritten, ideal zum Aussuchen", via: "Hugging Face", cost: "Sehr günstig" },
  { model: "Seedream 4.5 / 5.0 Pro", family: "Fotoreal", known: "Sehr gute Haut, sehr gutes Licht — Verkaufsqualität", via: "Pollinations", cost: "Mittel" },
  { model: "Nano Banana Pro", family: "Fotoreal", known: "Nimmt eine Vorlage und hält dieselbe Person — Pose, Ort und Kleidung änderbar", via: "Pollinations", cost: "Mittel" },
  { model: "FLUX.1 Kontext Pro", family: "Fotoreal", known: "Dasselbe: Person bleibt, Szene wechselt", via: "Pollinations", cost: "Mittel" },
  { model: "FLUX.2 Pro / Max", family: "Fotoreal", known: "Spitzenqualität bei Licht und Textur", via: "Pollinations", cost: "Hoch" },
  { model: "FLUX.2 Flex", family: "Fotoreal", known: "Die günstigere Flux-2-Variante, nah an Pro", via: "Pollinations", cost: "Mittel" },
  { model: "FLUX.1 dev", family: "Fotoreal", known: "Die solide Basis, auf der die meisten Realismus-Varianten aufbauen", via: "Hugging Face", cost: "Günstig" },
  { model: "Qwen-Image 3 / 2.1", family: "Fotoreal", known: "Bildbearbeitung und Schrift im Bild", via: "Pollinations", cost: "Mittel" },
  { model: "epiCRealism XL", family: "Fotoreal", known: "Der Klassiker unter den fotorealen SDXL-Modellen", via: "Hugging Face", cost: "Günstig" },
  { model: "BigAsp v2", family: "Fotoreal", known: "Fotoreal mit vollen Figuren — genau die Richtung, die du beschreibst", via: "Hugging Face", cost: "Günstig" },
  { model: "MAI Image 2.6", family: "Fotoreal", known: "Microsoft, sauber und fotoreal", via: "Pollinations", cost: "Mittel" },
  { model: "Wan 2.7 Image", family: "Fotoreal", known: "Fotoreal — aus derselben Familie kommt später das Video", via: "Pollinations", cost: "Mittel" },
  { model: "Grok Imagine", family: "Fotoreal", known: "Lässt mehr durch als GPT Image", via: "Pollinations", cost: "Mittel" },
  { model: "GPT Image 1.5 / 2 / 2.5", family: "Fotoreal", known: "Sehr stark, aber stark gefiltert — für Nacktes unbrauchbar", via: "Pollinations", cost: "Mittel" },
];

// ── Die Lücken ────────────────────────────────────────────────
export const GAPS = [
  {
    gap: "Fotoreal UND unzensiert",
    why: "Deine zwei unzensierten Modelle sind gezeichnet, deine fotorealen haben einen Filter. Genau dazwischen liegt dein Geschäft.",
    fix: "Ein fotorealer unzensierter Checkpoint (Lustify, CyberRealistic, BigLust) über fal.ai oder CivitAI",
    cost: "0–20 €",
    urgent: true,
  },
  {
    gap: "Eigener Charakter, beliebig oft",
    why: "Ohne Training sieht Sarah in jedem Bild ein bisschen anders aus. Mit Training ist sie in jeder Pose dieselbe Frau.",
    fix: "Ein LoRA pro Hauptfigur, antrainiert aus 10–20 guten Bildern",
    cost: "0 € (Hugging Face) bis 5 € (fal.ai)",
    urgent: true,
  },
  {
    gap: "Gesicht aus einer Vorlage halten",
    why: "Wenn du ein Foto schickst, soll daraus ein Charakter werden — nicht dieselbe Person, aber dieselbe Art.",
    fix: "InstantID, PuLID, IP-Adapter FaceID",
    cost: "Cent pro Bild",
    urgent: false,
  },
  {
    gap: "3D-Render-Look",
    why: "Hochwertig und bewusst künstlich — für einen eigenen Look, der nicht mit der Masse verschwimmt.",
    fix: "Ein 3D-Checkpoint (Unreal-/Octane-Look)",
    cost: "0–10 €",
    urgent: false,
  },
  {
    gap: "Konsistenz über viele Bilder",
    why: "Muttermal, Narbe, Tattoo, Größe der Brust — muss in allen Bildern gleich bleiben.",
    fix: "LoRA plus feste Referenzbilder pro Figur",
    cost: "im LoRA enthalten",
    urgent: false,
  },
  {
    gap: "Schärfe fürs Verkaufen",
    why: "4K, Hautporen, kein Weichzeichnen — sonst wirkt es billig.",
    fix: "Ein Hochskalierer (SUPIR, ESRGAN, SeedVR)",
    cost: "Cent pro Bild",
    urgent: false,
  },
];

// ── Was wofür bekannt ist ─────────────────────────────────────
export const KNOWN_FOR = [
  { name: "RealVis XL", known: "Der Maßstab für fotoreale SDXL-Bilder", where: "CivitAI (gratis)" },
  { name: "CyberRealistic", known: "Fotoreal mit besonders guter Haut", where: "CivitAI (gratis)" },
  { name: "Lustify SDXL", known: "Fotoreal und unzensiert — einer der bekanntesten dafür", where: "CivitAI (gratis)" },
  { name: "BigLust / BigAsp", known: "Fotoreal, volle Figuren, unzensiert", where: "CivitAI (gratis)" },
  { name: "Juggernaut XL", known: "Der Allrounder für fotoreal, sehr ausgewogen", where: "CivitAI / fal.ai" },
  { name: "Pony Realism", known: "Fotoreal und freizügig — die zahmere Pony-Variante", where: "CivitAI (gratis)" },
  { name: "InstantID / PuLID", known: "Ein Gesicht aus einem einzigen Foto übernehmen", where: "fal.ai, Replicate" },
  { name: "IP-Adapter FaceID", known: "Gesicht aus einer Vorlage, ohne Training", where: "fal.ai, Replicate" },
  { name: "Flux Kontext", known: "Person behalten, Pose oder Szene ändern", where: "fal.ai (hast du schon als Kontext Pro)" },
  { name: "ControlNet OpenPose / Depth", known: "Genau dieselbe Pose — nur mit einer anderen Person", where: "fal.ai, Replicate" },
  { name: "Wan 2.2 / Hunyuan Video / Kling", known: "Video aus einem Bild — der Weg zu deinen Filmen", where: "fal.ai, Replicate" },
  { name: "SUPIR / SeedVR", known: "Hochskalieren mit echter Hautstruktur", where: "fal.ai, Replicate" },
];

// ── Wo kaufen ─────────────────────────────────────────────────
export const PLATFORMS = [
  {
    platform: "fal.ai",
    what: "Unzensierte fotoreale Modelle, Gesichtstreue, LoRA-Training, Hochskalieren — alles an einem Ort",
    cost: "Nur was du verbrauchst",
    status: "Schlüssel liegt schon in der App",
  },
  {
    platform: "CivitAI",
    what: "Die guten unzensierten Checkpoints und LoRAs als Download",
    cost: "Gratis",
    status: "Noch nicht verbunden",
  },
  {
    platform: "Hugging Face",
    what: "Modelle hosten und rechnen lassen — der Weg, CivitAI-Modelle bei uns laufen zu lassen",
    cost: "Gratis bis günstig",
    status: "Verbunden",
  },
  {
    platform: "Replicate",
    what: "Dieselbe Klasse wie fal.ai, andere Auswahl",
    cost: "Nur was du verbrauchst",
    status: "Noch nicht verbunden",
  },
  {
    platform: "Pollinations",
    what: "Viele Modelle ohne Anmeldung — läuft bei uns schon",
    cost: "Gratis",
    status: "Verbunden",
  },
];

// ── Der Weg in Stufen ─────────────────────────────────────────
export const STAGES = [
  {
    stage: "Stufe 0",
    what: "Alles Gezeichnete abschalten. Jedes Modell mit Familie und Freizügigkeit etikettieren. Die Modellwahl an den Stil der Figur binden.",
    brings: "Kein Sprung mehr zwischen echt und gezeichnet. Die Figur bleibt eine Figur.",
    cost: "0 €",
  },
  {
    stage: "Stufe 1",
    what: "Erstes Guthaben bei fal.ai. Ein fotoreales unzensiertes Modell einbinden, dazu Nano Banana zum Bearbeiten.",
    brings: "Echte, nackte Menschen in Verkaufsqualität — zum ersten Mal.",
    cost: "~10 €",
  },
  {
    stage: "Stufe 2",
    what: "Für jede Hauptfigur ein LoRA antrainieren: Sarah, die Zwillinge, Trish, Jenny, Tanja.",
    brings: "Jede Frau ist in jedem Bild dieselbe — in jeder Pose, jedem Outfit, jedem Bild.",
    cost: "~20 €",
  },
  {
    stage: "Stufe 3",
    what: "Hochskalierer für 4K und die Videokette für die Filme.",
    brings: "Verkaufsfähige Ware und bewegte Bilder aus denselben Figuren.",
    cost: "nach Bedarf",
  },
];

// ── Der Ablauf: billig entwerfen, stark veredeln ──────────────
export const PIPELINE = [
  { step: "1. Entwerfen", with: "Z-Image-Turbo oder Qwen-Lightning", does: "Zwanzig Varianten in kurzer Zeit — du suchst die beste aus", cost: "fast nichts" },
  { step: "2. Festnageln", with: "LoRA oder Referenzbilder", does: "Die Person wird festgeschrieben: Gesicht, Körper, Haare, Größe", cost: "einmalig" },
  { step: "3. Veredeln", with: "Seedream 4.5 oder Nano Banana Pro", does: "Dieselbe Frau, aber mit echtem Licht, echter Haut und Details", cost: "wenige Cent pro Bild" },
  { step: "4. Schärfen", with: "SUPIR oder SeedVR", does: "4K, Hautporen, kein Weichzeichnen", cost: "wenige Cent pro Bild" },
];

export const PIPELINE_NOTE =
  "Das ist genau dein Gedanke, und er ist richtig: das billige Modell macht die Menge, " +
  "das teure Modell macht nur das eine Bild, das du behältst. So kosten zehn Versuche " +
  "so viel wie früher einer — und genau deshalb reichen 10 bis 20 € weit.";

// ── Was aussortiert gehört ────────────────────────────────────
export const JUNK = [
  "Pony Diffusion V6 XL, Illustrious XL, DreamShaper 8 — gezeichnet",
  "Anima Uncensored, Uncensored v2 — unzensiert, aber gezeichnet",
  "totaldrama-qwen-image-lora, tosti-qwen-image-lora, video-installation — Suchergebnisse, keine Modelle für dich",
  "TeleOCR, text-to-image-shape, Text-to-Image (ZB-Tech, Pramodmunje) — Fremdfunde aus der automatischen Suche",
  "Recraft V4.1 Vector — Grafik und Design, keine Menschen",
  "SDXL-LoRA-slider.sexy — ein Regler, kein eigenes Modell",
];

// ── Was freizügig heißt ───────────────────────────────────────
export const EXPLICIT_LEVELS = [
  {
    level: "ZAHM",
    shows: "Nichts Nacktes, nichts Andeutendes. Ein Bikini ist schon zu viel, ein Ausschnitt wird weggefiltert.",
    use: "Porträts, Mode, alles Öffentliche",
  },
  {
    level: "ANZÜGLICH",
    shows: "Knappe Kleidung, Dessous, tiefe Ausschnitte, nasse Shirts — aber kein nackter Körper.",
    use: "Der Teaser, das Vorspiel, das, was Appetit macht",
  },
  {
    level: "SINNLICH",
    shows: "Nacktheit ist möglich, aber weich und verhüllt: im Halbdunkel, von hinten, mit Laken davor. Nichts offen Gezeigtes.",
    use: "Sinnliche Szenen, Kunst, alles, was Stil haben soll",
  },
  {
    level: "EXPLIZIT",
    shows: "Nackt und offen: Brust, Po, Schoß zu sehen. Sexuelle Handlungen sind darstellbar.",
    use: "Das eigentliche Geschäft",
  },
  {
    level: "HART",
    shows: "Alles offen, auch Nahaufnahmen, mehrere Personen, harte Praktiken.",
    use: "Die harte Schiene für die, die sie suchen",
  },
];

export const EXPLICIT_NOTE =
  "„Freizügig“ heißt ANZÜGLICH bis SINNLICH. „Nackt“ heißt EXPLIZIT. „Ganz nackt, auf den Knien“ ist EXPLIZIT bis HART. " +
  "Genau diese fünf Stufen kennt die App schon — sie stehen an jedem Modell als Etikett. " +
  "Bisher waren sie leer, deshalb wusste die App nicht, was sie nehmen darf. Jetzt sind sie gesetzt.";

// ── Warum Hochladen allein nicht reicht ───────────────────────
export const SERVICE_NOTE =
  "Ein Modell ist eine Datei, kein Dienst. Hugging Face verkauft dir rechnen, aber nur für die Modelle, " +
  "die dort auch laufen — und das sind wenige. Die berühmten unzensierten fotorealen Checkpoints " +
  "(RealVisXL, Juggernaut, CyberRealistic, LUSTIFY, BigAsp) liegen dort zum Herunterladen, " +
  "aber sie haben keinen Dienst: geprüft, alle „kein Dienst“. Sie laufen nur bei fal.ai oder auf einer eigenen Maschine. " +
  "Deshalb nützt es nichts, sie einfach einzutragen — die App würde bei jedem Bild einen Fehler bekommen.";

// ── Wo du suchst ──────────────────────────────────────────────
export const WHERE_TO_LOOK = [
  {
    platform: "fal.ai",
    search: "realism, photoreal, uncensored, NSFW, body type",
    gets: "Die Modelle, die sonst nirgends laufen — plus Gesichtstreue und Training",
    cost: "Nur Verbrauch",
  },
  {
    platform: "CivitAI",
    search: "Filter setzen auf Base model = SDXL oder Flux, dann nach „Most Downloaded“ sortieren. Begriffe: realistic, photoreal, NSFW",
    gets: "Die berühmten unzensierten Checkpoints — als Datei zum Herunterladen",
    cost: "Gratis",
  },
  {
    platform: "Hugging Face",
    search: "RealVisXL, Juggernaut, CyberRealistic, LUSTIFY, epiCRealism",
    gets: "Dieselben Dateien, nur anders sortiert — gut zum Hosten, nicht zum Rechnen",
    cost: "Guthaben, das du noch hast",
  },
  {
    platform: "Replicate",
    search: "realism, photoreal, face swap, upscale",
    gets: "Dieselbe Klasse wie fal.ai, andere Auswahl",
    cost: "Nur Verbrauch",
  },
];

// ── Was bei uns wirklich läuft (geprüft) ──────────────────────
export const RUNS_HERE = [
  { model: "FLUX.1 dev", via: "fal-ai, replicate", status: "Läuft" },
  { model: "FLUX.1 schnell", via: "fal-ai, nscale", status: "Läuft" },
  { model: "FLUX.1 Krea dev", via: "fal-ai, replicate", status: "Läuft" },
  { model: "FLUX.2 klein 4B", via: "fal-ai", status: "Läuft" },
  { model: "Qwen-Image", via: "fal-ai, replicate", status: "Läuft" },
  { model: "Qwen-Image-Lightning", via: "fal-ai", status: "Läuft" },
  { model: "Z-Image-Turbo", via: "fal-ai, replicate", status: "Läuft" },
  { model: "Stable Diffusion 3.5 Large", via: "fal-ai, replicate", status: "Läuft" },
  { model: "stable-diffusion-xl-base-1.0", via: "fal-ai", status: "Läuft" },
  { model: "SD3 Medium", via: "hf-inference", status: "Läuft (als einziges über die Haus-Schnittstelle)" },
  { model: "Ideogram 4", via: "fal-ai", status: "Läuft" },
  { model: "Krea 2 Turbo", via: "fal-ai", status: "Läuft" },
  { model: "RealVisXL V5.0", via: "—", status: "Kein Dienst: nur Datei" },
  { model: "Juggernaut XL v9", via: "—", status: "Kein Dienst: nur Datei" },
  { model: "CyberRealistic XL", via: "—", status: "Kein Dienst: nur Datei" },
  { model: "LUSTIFY v2.0", via: "—", status: "Kein Dienst: nur Datei" },
  { model: "Pony Diffusion V6 XL", via: "—", status: "Gezeichnet — ausgeschaltet" },
  { model: "Illustrious XL", via: "—", status: "Gezeichnet — ausgeschaltet" },
];

// ── Die Seitenstruktur ────────────────────────────────────────
export const PLAN_SECTIONS = [
  {
    key: "families",
    title: "Die Familien — damit du die Wörter sicher benutzt",
    icon: Camera,
    intro: "Es gibt nur drei Familien, die für dich in Frage kommen, und eine, die ausscheidet.",
    columns: [
      { key: "name", label: "Familie" },
      { key: "looks", label: "Wie es aussieht" },
      { key: "use", label: "Wofür" },
      { key: "status", label: "Bei uns" },
    ],
    rows: FAMILIES,
    note: FAMILY_NOTE,
  },
  {
    key: "have",
    title: "Was schon da ist und wirklich taugt",
    icon: Sparkles,
    intro: "Von deinen 84 eingetragenen Modellen sind diese hier brauchbar. Der Rest ist gezeichnet oder Müll aus der automatischen Suche.",
    columns: [
      { key: "model", label: "Modell" },
      { key: "family", label: "Familie" },
      { key: "known", label: "Bekannt für" },
      { key: "via", label: "Läuft über" },
      { key: "cost", label: "Kosten" },
    ],
    rows: HAVE,
  },
  {
    key: "gaps",
    title: "Die Lücken — was fehlt und was es schließt",
    icon: Ban,
    intro: "Der Reihe nach: das Wichtigste zuerst.",
    columns: [
      { key: "gap", label: "Was fehlt" },
      { key: "why", label: "Warum es zählt" },
      { key: "fix", label: "Was die Lücke schließt" },
      { key: "cost", label: "Preis" },
    ],
    rows: GAPS,
  },
  {
    key: "known",
    title: "Was wofür bekannt ist",
    icon: ListChecks,
    intro: "Die Namen, auf die du stoßen wirst — und wofür sie berühmt sind.",
    columns: [
      { key: "name", label: "Name" },
      { key: "known", label: "Bekannt für" },
      { key: "where", label: "Wo du es bekommst" },
    ],
    rows: KNOWN_FOR,
  },
  {
    key: "platforms",
    title: "Wo du einkaufst",
    icon: ShoppingCart,
    intro: "Vier Wege, einer davon liegt schon bereit.",
    columns: [
      { key: "platform", label: "Plattform" },
      { key: "what", label: "Was du dort bekommst" },
      { key: "cost", label: "Kosten" },
      { key: "status", label: "Stand bei uns" },
    ],
    rows: PLATFORMS,
  },
  {
    key: "stages",
    title: "Der Weg in Stufen",
    icon: Coins,
    intro: "Mit wenig Geld viel erreichen — in dieser Reihenfolge.",
    columns: [
      { key: "stage", label: "Stufe" },
      { key: "what", label: "Was du tust" },
      { key: "brings", label: "Was es bringt" },
      { key: "cost", label: "Kosten" },
    ],
    rows: STAGES,
  },
  {
    key: "pipeline",
    title: "Billig entwerfen, stark veredeln",
    icon: Wrench,
    intro: "Genau der Ablauf, den du beschrieben hast — erst das günstige Modell, dann das gute für das eine Bild.",
    columns: [
      { key: "step", label: "Schritt" },
      { key: "with", label: "Womit" },
      { key: "does", label: "Was passiert" },
      { key: "cost", label: "Kosten" },
    ],
    rows: PIPELINE,
    note: PIPELINE_NOTE,
  },
  {
    key: "explicit",
    title: "Was freizügig heißt — die fünf Stufen",
    icon: Ban,
    intro: "Genau diese fünf Wörter stehen an jedem Modell. Damit du weißt, was du bestellst.",
    columns: [
      { key: "level", label: "Stufe" },
      { key: "shows", label: "Was zu sehen ist" },
      { key: "use", label: "Wofür" },
    ],
    rows: EXPLICIT_LEVELS,
    note: EXPLICIT_NOTE,
  },
  {
    key: "service",
    title: "Warum Hochladen allein nicht reicht",
    icon: Box,
    intro: "Das ist der Grund, warum es bisher nicht voranging.",
    note: SERVICE_NOTE,
  },
  {
    key: "where",
    title: "Wo du suchst — und was du dort eingibst",
    icon: ShoppingCart,
    intro: "Für jede Plattform die richtigen Suchwörter. fal.ai ist der Ort, an dem die guten Modelle wirklich laufen.",
    columns: [
      { key: "platform", label: "Plattform" },
      { key: "search", label: "Was du eingibst" },
      { key: "gets", label: "Was du bekommst" },
      { key: "cost", label: "Kosten" },
    ],
    rows: WHERE_TO_LOOK,
  },
  {
    key: "runs",
    title: "Was bei uns wirklich läuft — geprüft",
    icon: ListChecks,
    intro: "Ich habe jedes Modell bei Hugging Face abgefragt. Das ist dabei herausgekommen.",
    columns: [
      { key: "model", label: "Modell" },
      { key: "via", label: "Läuft über" },
      { key: "status", label: "Status" },
    ],
    rows: RUNS_HERE,
  },
  {
    key: "junk",
    title: "Was aussortiert gehört",
    icon: Film,
    intro: "Damit die Liste kurz wird und die Auswahl wieder Spaß macht.",
    bullets: JUNK,
  },
  {
    key: "box",
    title: "Was ich sofort machen kann",
    icon: Box,
    intro: "Das habe ich schon erledigt, das kann ich als Nächstes tun.",
    bullets: [
      "Erledigt: 18 Modelle ausgeschaltet — gezeichnet, Grafik, Video und die kaputten Einträge.",
      "Erledigt: alle 66 übrigen mit Familie und Freizügigkeit etikettiert.",
      "Als Nächstes: die Modellwahl an den Stil der Figur binden — kein Sprung mehr zwischen echt und gezeichnet.",
      "Als Nächstes: Nano Banana und Flux Kontext als Werkzeuge einbinden — Vorlage rein, dieselbe Frau raus, neue Pose.",
      "Als Nächstes: die unzensierten fotorealen Modelle über fal.ai anbinden, sobald du dort Guthaben hast.",
      "Als Nächstes: die Kette für die Filme vorbereiten — Bild, Bewegung, Schnitt.",
    ],
  },
];