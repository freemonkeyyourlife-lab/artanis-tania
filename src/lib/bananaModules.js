// Alles, was du über Nano Banana (Google, über fal.ai) wissen musst — als
// kopierfertige Module. Platzhalter stehen in GROSSBUCHSTABEN und eckigen
// Klammern: einfach ersetzen, den Rest stehen lassen.

export const BANANA_MODELS = [
  {
    id: "fal-ai/nano-banana",
    label: "Nano Banana",
    what: "Text zu Bild. Schnell und günstig.",
    take: "Wenn du kein Vorlagenbild hast und nur beschreiben willst.",
  },
  {
    id: "fal-ai/nano-banana/edit",
    label: "Nano Banana · Edit",
    what: "Bild zu Bild. Nimmt mehrere Referenzbilder (image_urls).",
    take: "Der Standard für alles mit Charakter-Treue, Outfit, Ort, Pose.",
  },
  {
    id: "fal-ai/nano-banana-pro",
    label: "Nano Banana Pro",
    what: "Text zu Bild in bis zu 4K, schreibt Text im Bild sauber.",
    take: "Plakate, Logos, Schrift im Bild, hohe Auflösung.",
  },
  {
    id: "fal-ai/nano-banana-pro/edit",
    label: "Nano Banana Pro · Edit",
    what: "Bearbeiten mit Referenzbildern plus Auflösung 1K/2K/4K.",
    take: "Wenn das Ergebnis später groß gedruckt oder gezoomt wird.",
  },
  {
    id: "fal-ai/nano-banana-2/edit",
    label: "Nano Banana 2 · Edit",
    what: "Bearbeiten mit Bild, Video, Audio oder PDF als Referenz.",
    take: "Wenn eine ganze Szene oder ein Clip die Vorlage ist.",
  },
];

export const BANANA_PARAMS = [
  { name: "prompt", value: "Dein Text. Immer Pflicht." },
  { name: "image_urls", value: "Nur bei Edit: 1–4 öffentlich erreichbare Bilder." },
  { name: "num_images", value: "1 bis 4. Default 1." },
  { name: "aspect_ratio", value: "auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16. Bei Edit übernimmt auto das Format des Eingabebilds." },
  { name: "output_format", value: "png (Default), jpeg oder webp." },
  { name: "safety_tolerance", value: "1–6, Default 4. Nur über die API, nicht im fal-Playground." },
  { name: "seed", value: "Gleiche Zahl = gleiches Ergebnis. Zum Nachjustieren." },
  { name: "limit_generations", value: "Default true. Verhindert, dass das Modell aus einem Auftrag mehrere Bilder macht." },
  { name: "resolution", value: "Nur Pro: 1K, 2K, 4K." },
];

export const BANANA_WATCH = [
  "Google filtert hart. Alles Sexuelle oder Nackte wird blockiert — safety_tolerance hochdrehen hilft dabei nicht, es kommt einfach kein Bild zurück. Für freizügige Motive brauchst du ein anderes Modell.",
  "Referenzbilder müssen öffentlich erreichbar sein. Private Uploads funktionieren nur über eine zeitlich begrenzte, signierte URL.",
  "Bei Edit nur die Änderung beschreiben, nicht das ganze Bild neu. Sonst baut das Modell die Person neu und das Gesicht kippt.",
  "Gesicht halten heißt: das Gesicht in der Vorlage muss groß und scharf sein. Ein winziges Gesicht in einer Totale wird nicht zuverlässig übernommen.",
  "Mehr als vier Referenzbilder machen es schlechter, nicht besser. Zwei bis drei reichen: Gesicht, Outfit, Umgebung.",
  "Hände und Füße bleiben die Schwachstelle. Im Prompt erwähnen („Hände entspannt, fünf Finger, nicht verdeckt“) und das Ergebnis prüfen.",
  "Text im Bild nur mit Pro und in Anführungszeichen: exakt so geschrieben. Kurze Wörter klappen besser als ganze Sätze.",
  "Jeder Aufruf kostet. Pro kostet pro Bild deutlich mehr als das Basismodell — erst mit dem Basismodell die Richtung finden, dann in Pro wiederholen.",
  "Kein echtes Gesicht einer realen Person als Vorlage verwenden. Das ist rechtlich deine Baustelle, technisch merkt es das Modell nicht.",
];

// So ist ein Prompt aufgebaut. Von oben nach unten, in dieser Reihenfolge.
export const BANANA_RECIPE = [
  { step: "1. Auftrag", text: "Was soll passieren? „Ändere nur das Outfit“ oder „Erzeuge ein neues Bild“." },
  { step: "2. Vorlage", text: "Welches Bild wofür? „Bild 1 = die Person, Bild 2 = die Kleidung.“" },
  { step: "3. Was bleibt", text: "Alles aufzählen, was unverändert bleiben muss: Gesicht, Frisur, Pose, Licht, Ausschnitt." },
  { step: "4. Was sich ändert", text: "Nur das Neue: Ort, Kleidung, Haltung, Stimmung." },
  { step: "5. Licht und Kamera", text: "Tageszeit, Lichtrichtung, Brennweite, Bildausschnitt." },
  { step: "6. Stil", text: "Fotorealistisch, Anime, Ölgemälde — plus Auflösung und Detailgrad." },
  { step: "7. Verbote", text: "Kurz am Ende: keine neuen Personen, keine verzerrten Hände, kein Text im Bild." },
];

export const BANANA_MODULES = [
  {
    id: "gesicht-halten",
    title: "Charakter-Treue · Gesicht halten",
    goal: "Dieselbe Person in einer neuen Situation — Gesicht bleibt gleich.",
    model: "fal-ai/nano-banana/edit",
    params: "image_urls: [Bild 1] · aspect_ratio: auto",
    prompt: `Nutze die Person aus Bild 1 als feste Vorlage.
Gesicht, Frisur, Augenfarbe, Körperbau und Hautton exakt beibehalten.
Ändere nur die Umgebung: [ORT], [TAGESZEIT].
Ganzkörperaufnahme, [BLICKWINKEL], natürliches Licht.
Fotorealistisch, 35 mm, flache Tiefenschärfe.
Keine neuen Personen, keine zusätzlichen Gliedmaßen, keine Veränderung am Gesicht.`,
    watch: [
      "Vorlagenbild: Gesicht groß und scharf, keine Sonnenbrille, kein starkes Gegenlicht.",
      "Nur die Umgebung beschreiben — nichts am Gesicht.",
      "Nach dem ersten Bild nur noch nachjustieren: „gleiches Bild, nur [DETAIL] ändern“.",
    ],
  },
  {
    id: "outfit",
    title: "Outfit wechseln",
    goal: "Neue Kleidung, alles andere bleibt wie im Original.",
    model: "fal-ai/nano-banana/edit",
    params: "image_urls: [Bild 1, Bild 2 = Kleidung] · aspect_ratio: auto",
    prompt: `Bild 1 = die Person. Gesicht, Pose, Licht und Hintergrund unverändert lassen.
Ziehe ihr die Kleidung aus Bild 2 an — [FARBE, STOFF, SCHNITT] beibehalten.
Der Rest des Bildes bleibt exakt gleich: gleicher Ausschnitt, gleiches Licht, gleicher Hintergrund.
Stoffstruktur sichtbar, Falten natürlich, saubere Kanten an Kragen und Ärmeln.`,
    watch: [
      "Ohne zweites Bild beschreibt das Modell die Kleidung nur — mit Vorlage wird sie genauer.",
      "Hintergrund und Licht im Prompt ausdrücklich festhalten, sonst ändern sie sich mit.",
    ],
  },
  {
    id: "zwei-personen",
    title: "Zwei Personen in ein Bild",
    goal: "Paar oder Duo, beide Gesichter bleiben erkennbar.",
    model: "fal-ai/nano-banana/edit",
    params: "image_urls: [Bild 1, Bild 2] · num_images: 1",
    prompt: `Bild 1 = Person A, Bild 2 = Person B. Beide exakt wie gezeigt übernehmen.
Setze sie nebeneinander in [ORT], halbnahe Aufnahme, beide blicken in die Kamera.
Kleidung Person A: [KLEIDUNG A]. Person B: [KLEIDUNG B].
Gleiche Lichtrichtung für beide, gleicher Bildstil, gleiche Schärfe.
Gesichter nicht verändern, nicht vertauschen, keine dritte Person.`,
    watch: [
      "Die Gesichter werden kleiner, je mehr Personen im Bild sind. Nahaufnahme funktioniert besser als Totale.",
      "Lichtrichtung für beide ausdrücklich nennen — sonst klebt eine Person mit falschem Licht im Bild.",
    ],
  },
  {
    id: "pose",
    title: "Pose ändern",
    goal: "Neue Haltung, Gesicht und Kleidung bleiben.",
    model: "fal-ai/nano-banana/edit",
    params: "image_urls: [Bild 1] · aspect_ratio: auto",
    prompt: `Bild 1 = Vorlage. Gesicht und Kleidung unverändert lassen.
Ändere nur die Haltung: [POSE, z. B. auf einem Stuhl sitzend, ein Bein übergeschlagen].
Alles andere bleibt gleich: Licht, Hintergrund, Ausschnitt, Farben.
Anatomie sauber: Hände entspannt, fünf Finger sichtbar, nicht verdeckt.`,
    watch: [
      "Hände sind die häufigste Fehlerquelle. Immer mit in den Prompt.",
      "Bei starken Drehungen das Gesicht zusätzlich mit einem zweiten Referenzbild absichern.",
    ],
  },
  {
    id: "ort",
    title: "Ort und Umgebung tauschen",
    goal: "Person bleibt, Kulisse wechselt.",
    model: "fal-ai/nano-banana/edit",
    params: "image_urls: [Bild 1] · aspect_ratio: auto",
    prompt: `Bild 1 = die Person, unverändert lassen.
Versetze sie nach [ORT], [TAGESZEIT], [WETTER].
Hintergrund passend zur neuen Umgebung, Lichtrichtung und Schatten anpassen.
Die Person selbst nicht verändern: gleiches Gesicht, gleiche Kleidung, gleiche Haltung.
Tiefe im Bild: Vordergrund, Mittelgrund, Hintergrund getrennt.`,
    watch: [
      "„Lichtrichtung und Schatten anpassen“ ist der Satz, der es echt aussehen lässt.",
      "Bei Innenräumen den Bildausschnitt mitgeben (Totale, halbnahe, Nahaufnahme).",
    ],
  },
  {
    id: "licht",
    title: "Licht und Stimmung",
    goal: "Dasselbe Bild, andere Atmosphäre.",
    model: "fal-ai/nano-banana/edit",
    params: "image_urls: [Bild 1] · aspect_ratio: auto",
    prompt: `Bild 1 vollständig unverändert lassen — nur das Licht ändern.
Neues Licht: [GOLDENE STUNDE / KERZENLICHT / NEON / BLAUE STUNDE].
Stimmung: [RUHIG / SPANNUNG / VERSPIELT]. Farbtemperatur [WARM / KALT].
Hauttöne natürlich halten, keine ausgefressenen Lichter.`,
    watch: [
      "„Vollständig unverändert lassen — nur das Licht“ verhindert, dass das Gesicht neu gezeichnet wird.",
    ],
  },
  {
    id: "retusche",
    title: "Retusche und Aufräumen",
    goal: "Bild sauberer machen, nichts neu erfinden.",
    model: "fal-ai/nano-banana/edit",
    params: "image_urls: [Bild 1] · output_format: png",
    prompt: `Bild 1 behalten, nichts neu erfinden.
Entferne [STÖRENDES, z. B. den Gegenstand links am Rand].
Haut leicht glätten, Poren sichtbar lassen. Augen und Haare schärfen.
Farben, Ausschnitt und Proportionen unverändert.`,
    watch: [
      "Bei Retusche nichts über Stil oder Umgebung schreiben — sonst fängt das Modell an umzubauen.",
    ],
  },
  {
    id: "freistellen",
    title: "Hintergrund ersetzen",
    goal: "Person sauber ausgeschnitten vor neuer Kulisse.",
    model: "fal-ai/nano-banana/edit",
    params: "image_urls: [Bild 1] · aspect_ratio: auto",
    prompt: `Bild 1: die Person unverändert lassen — Gesicht, Haare, Kleidung, Pose, Lichtrichtung.
Ersetze nur den Hintergrund durch [NEUER HINTERGRUND].
Kanten sauber, keine Reste des alten Hintergrunds, keine Lichtsäume an den Haaren.
Bodenschatten passend zur neuen Umgebung, Lichteinfall von [RICHTUNG].`,
    watch: [
      "Haarkanten sind die Schwachstelle. Einfarbige, ruhige Hintergründe klappen am besten.",
    ],
  },
  {
    id: "text-im-bild",
    title: "Text und Schrift im Bild",
    goal: "Plakat, Titel oder Logo mit korrekter Schreibweise.",
    model: "fal-ai/nano-banana-pro",
    params: "aspect_ratio: 4:5 · resolution: 2K",
    prompt: `Ein [PLAKAT / TITELBILD / COVER] im Stil [STIL].
Große Überschrift: "[TEXT]" — exakt so geschrieben, keine Tippfehler, keine zusätzlichen Wörter.
Darunter kleiner: "[UNTERTITEL]".
Farben: [FARBEN]. Klare Typografie, zentriert, gut lesbar, genug Rand.
Hintergrund: [MOTIV].`,
    watch: [
      "Nur Pro schreibt zuverlässig. Beim Basismodell kommen Buchstabendreher.",
      "Text immer in Anführungszeichen und kurz halten — ein bis drei Wörter.",
      "Mehrere Anläufe einplanen: bei Schrift entscheidet oft der dritte Versuch.",
    ],
  },
  {
    id: "stilwechsel",
    title: "Stil umwandeln",
    goal: "Dasselbe Motiv in einem anderen Look.",
    model: "fal-ai/nano-banana/edit",
    params: "image_urls: [Bild 1] · output_format: png",
    prompt: `Bild 1 = Motiv und Komposition. Beides exakt beibehalten.
Zeichne dasselbe Bild neu als [ANIME / ÖLGEMÄLDE / COMIC / 3D-RENDER].
Gleicher Bildausschnitt, gleiche Pose, gleiche Lichtrichtung.
Stil durchgezogen: keine Mischung aus Foto und Zeichnung.`,
    watch: [
      "„Gleicher Bildausschnitt, gleiche Pose“ ist der Satz, der das Motiv zusammenhält.",
      "Bei Anime das Gesicht mit einem zweiten Referenzbild absichern.",
    ],
  },
  {
    id: "storyboard",
    title: "Szenen-Reihe mit gleicher Person",
    goal: "Mehrere Bilder einer Geschichte, Figur bleibt dieselbe.",
    model: "fal-ai/nano-banana/edit",
    params: "Ein Aufruf pro Bild · image_urls: [Bild 1] jedes Mal dieselbe Vorlage",
    prompt: `Bild 1 = die Person. Gesicht, Frisur und Kleidung exakt beibehalten.
Neue Szene: [WAS PASSIERT], [ORT], [TAGESZEIT].
Kamera: [TOTALE / HALBNAH / NAH]. Gleiches Licht wie im Rest der Reihe: [LICHT].
Fotorealistisch, gleiche Farbstimmung wie die übrigen Bilder.`,
    watch: [
      "Vier Einzelaufrufe mit derselben Vorlage sind konsistenter als ein Aufruf mit num_images 4.",
      "Licht und Farbstimmung in jedem Prompt wiederholen — sonst springt die Reihe.",
    ],
  },
  {
    id: "neu-erzeugen",
    title: "Charakter neu erzeugen (ohne Vorlage)",
    goal: "Eine Figur nur aus Beschreibung, wiederholbar über den seed.",
    model: "fal-ai/nano-banana",
    params: "aspect_ratio: 3:4 · seed: [ZAHL] merken!",
    prompt: `[ALTER]-jährige [FRAU / MANN], [HAARFARBE und LÄNGE], [AUGENFARBE], [STATUR und FIGUR].
Kleidung: [KLEIDUNG]. Pose: [POSE]. Ort: [ORT], [TAGESZEIT].
Fotorealistisch, 50 mm, natürliche Haut mit Poren, kein Weichzeichner.
Ganzkörper, Kamera auf Augenhöhe.
Keine verzerrten Hände, keine Doppel-Gesichter, kein Text im Bild.`,
    watch: [
      "Den seed aufschreiben — mit derselben Zahl bekommst du dieselbe Person wieder.",
      "Beschreibung kurz und konkret halten. Zu viele Adjektive machen das Gesicht beliebig.",
    ],
  },
];