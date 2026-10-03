// Der Spickzettel: alles, was man beim Bauen eines Prompts wissen muss, an einer
// Stelle. Nur für den Besitzer sichtbar.

export const LENGTH_RULES = [
  "Bild: 40 bis 80 Wörter sind der süße Punkt. Ab etwa 150 Wörtern verliert das Modell Details, weil sich die Angaben gegenseitig verwässern.",
  "Nicht in Sätzen schreiben, sondern in Stichpunkten mit Kommas: Motiv, Körper, Kleidung, Licht, Ort, Kamera.",
  "Reihenfolge zählt. Was vorn steht, wird am stärksten gewichtet. Das Wichtigste zuerst, Beiwerk nach hinten.",
  "Ein Negativ-Prompt ist ein eigener Topf und zählt nicht gegen die Länge. Dort hinein, was NICHT ins Bild soll.",
  "Text und Chat: keine harte Grenze. 200 bis 400 Wörter halten die Figur am zuverlässigsten im Charakter.",
  "Video: kurz halten. Eine Bewegung pro Clip. Zwei Bewegungen in einem Clip zerfallen meist.",
];

export const MODEL_PICKS = [
  {
    task: "Ganzkörper, realistisch",
    models: "FLUX.2 Pro · Seedream 5.0 Pro · Nano Banana Pro",
    why: "Die Großen. Sie halten Anatomie und Proportionen auch bei voller Figur.",
  },
  {
    task: "Gesicht nah, Porträt",
    models: "Nano Banana Pro · MAI Image 2.6 · GPT Image 2",
    why: "Stark bei Haut, Augen und Licht. Ein bis zwei davon reichen.",
  },
  {
    task: "Luxus und Ästhetik — Villa, Meer, Yacht",
    models: "Ideogram 4.0 Quality",
    why: "Der eine Spezialist, der dafür stehen geblieben ist. Räume, Licht, Material.",
  },
  {
    task: "Dieselbe Person, neue Pose",
    models: "FLUX.1 Kontext Pro · Nano Banana · Pruna p-image-edit · Seedream",
    why: "Vorlage rein, dieselbe Person raus. Das ist der Weg für den Wiedererkennungswert.",
  },
  {
    task: "Erst mal ausprobieren, gratis",
    models: "Pollinations (kostenlos) · Flux (frei) · Turbo (frei)",
    why: "Kosten nichts. Gut zum Prüfen, ob ein Prompt überhaupt sitzt.",
  },
  {
    task: "Schrift oder Logo im Bild",
    models: "Ideogram 4.0 Quality",
    why: "Das einzige, das Buchstaben sauber setzt.",
  },
];

export const FILM_NOTE = {
  photo: {
    title: "Fotorealistisch",
    text: "Wie mit dem Handy geschossen. Scharf, neutral, alles erkennbar, kein Farbstich. Gut, wenn die Person im Vordergrund stehen soll und nichts ablenken darf.",
  },
  film: {
    title: "Film",
    text: "Wie ein Standbild aus einem Kinofilm. Leichter Farbstich, feines Korn, unscharfer Hintergrund, Licht das eine Stimmung macht. Für erotische Bilder meist der bessere Look — es wirkt inszeniert statt geknipst.",
  },
};

export const GLOSSARY = [
  { term: "fotorealistisch", meaning: "Sieht aus wie ein echtes Foto. Haut mit Poren, echtes Licht." },
  { term: "film still", meaning: "Standbild aus einem Film. Der Kino-Look." },
  { term: "cinematic lighting", meaning: "Licht wie im Kino: von der Seite, mit Schatten, nicht flach von vorn." },
  { term: "golden hour", meaning: "Die Stunde kurz vor Sonnenuntergang. Warmes, weiches Licht." },
  { term: "shallow depth of field", meaning: "Nur die Person scharf, der Hintergrund verschwimmt." },
  { term: "85mm", meaning: "Brennweite für Porträts. Macht Gesichter natürlich, nicht verzerrt." },
  { term: "editorial", meaning: "Wie ein Magazin-Foto. Aufgeräumt, bewusst gestellt." },
  { term: "candid", meaning: "Wie zufällig erwischt. Nicht gestellt." },
  { term: "Negativ-Prompt", meaning: "Der Topf für das, was nicht ins Bild soll. Getrennt vom eigentlichen Prompt." },
  { term: "LoRA", meaning: "Ein Zusatz, der einem Modell etwas beibringt — einen Stil oder ein Gesicht." },
  { term: "Seed", meaning: "Die Zahl, die den Zufall festnagelt. Gleicher Seed, gleiches Bild." },
  { term: "Referenzbild", meaning: "Ein Foto, das als Vorlage mitgeht. Damit bleibt dieselbe Person dieselbe." },
];

export const REFERENCE_STEPS = [
  "Ein gutes Foto der Person hochladen — Gesicht gut sichtbar, gleichmäßiges Licht, keine Sonnenbrille.",
  "Als Referenzbild an der Figur speichern, damit es bei jeder Generierung mitgeht.",
  "Ein Bearbeiten-Modell wählen: FLUX.1 Kontext Pro, Nano Banana, Pruna p-image-edit oder Seedream.",
  "In den Prompt schreiben, was sich ändern soll — Pose, Ort, Kleidung. Was gleich bleiben soll, ausdrücklich benennen.",
  "Für die Filme später: erst das Bild festnageln, dann Bewegung, dann Schnitt.",
];

export const EXPLICIT_NOTES = [
  "Die Stufen sind: ZAHM, ANZÜGLICH, SINNLICH, EXPLIZIT, HART. Sie stehen an jedem Modell als Etikett.",
  "Etikett ist aber nicht Wirklichkeit: die Anbieter filtern selbst. Von den aktiven Modellen steht nur Grok Imagine auf SINNLICH, alle anderen auf ZAHM oder ANZÜGLICH.",
  "Das lässt sich nicht hochdrehen — es liegt beim Anbieter, nicht an der Einstellung.",
  "Der Weg für alles darüber führt über fal.ai. Das Konto steht gerade auf TOP_UP, also blockiert.",
  "Zweiter Weg: die unzensierten Modelle, die in der Liste liegen. Sie sind abgeschaltet, weil sie nicht zuverlässig laufen — bei Bedarf wieder einschalten und testen.",
];

export const VOICE_STEPS = [
  "Die Erzählerin ist eine eigene Figur mit eigener Stimme — App → Erzähler.",
  "Unter „Zeilen“ hinterlegst du, was sie sagt: Begrüßung, Zwischenrufe, Rückblicke, Tipps.",
  "Die Zwischenrufe greifen im Chat. Sie reagieren auf Hörwörter, die du unter Regie festlegst.",
  "Im Regie-Modus bestimmst du, ob sie von selbst dazwischenredet oder erst auf „fertig“ wartet.",
  "Für die Szene: den Text der Szene an die Erzählerin geben und mit ihrer Stimme vorlesen lassen — dann beschreibt sie es mit ihren Worten.",
  "Dieselbe Erzählerin kann eine bestehende Figur sein: bei der Figur die Stimme setzen und sie als Erzählerin eintragen.",
  "Zwölf Audios sind kein Problem: Hochladen in der App kostet keine Nachrichten-Credits. Nur eine Nachricht an mich zählt — dann aber als eine, egal wie viele Dateien dranhängen.",
];

export const LIMITS = [
  "Zugangsgeschützte fremde Plattformen lassen sich nicht automatisch auslesen. Nur manuell verlinken.",
  "Reale Personen als Vorlage: ohne Einwilligung nicht möglich.",
  "Bluetooth-Kameras laufen nicht im Browser — nur USB, HDMI oder die Handy-Kopplung.",
  "Nur bei uns sichtbar: diese Seite und die Anleitung sind für den Admin. Die Nutzer sehen sie nicht.",
];