// Das Intro als geführtes Erlebnis. Alles, was die Erzählerin sagt, steht hier
// an einer Stelle; der Ablauf selbst kommt aus buildIntroFlow. Die Reihenfolge
// der Bausteine: ankommen, vorstellen, Modus fragen, Fragen, Weiche, Tour.

// ── Erleben ───────────────────────────────────────────────────────────────
export const INTRO_MODE = { AUDIO: "AUDIO", TEXT: "TEXT", BOTH: "BOTH" };

export const INTRO_MODES = [
  { id: INTRO_MODE.AUDIO, label: "Nur hören", hint: "Sie erzählt, du hörst zu — nichts zum Mitlesen." },
  { id: INTRO_MODE.TEXT, label: "Tippen & lesen", hint: "Alles auf dem Bildschirm, ohne Ton." },
  { id: INTRO_MODE.BOTH, label: "Beides gleichzeitig", hint: "Du hörst sie und liest mit." },
];

export const MODE_QUESTION =
  "Sag mir doch: erlebst du das lieber als interaktives Audio, tippst und liest du lieber — oder beides gleichzeitig?";

// Die beiden Freundinnen. OFFEN: Tania oder Tanja — bitte mit David abgleichen.
export const INTRO_FRIENDS = [
  { name: "Artemis", hint: "Ab und zu online — zusammen mit Tania oder allein." },
  { name: "Tania", hint: "Ab und zu online — zusammen mit Artemis oder allein." },
];

// ── Was sie sagt ──────────────────────────────────────────────────────────
export const FIRST_VOICE = "Hi, schön, dass du da bist. Mach's dir gemütlich.";
export const NAME_LINE = "Ich bin's — {narrator}.";

export const GREETING_LINES = [
  "Ich hab schon auf dich gewartet. Wir werden eine Menge Spaß haben.",
  "Vielleicht kommt noch eine Freundin dazu. Wir führen dich ein bisschen rum und schauen dir über die Schulter — wenn du nichts dagegen hast. Wenn nicht, auch okay, aber schade.",
  "Hilf mir, dir zu helfen: beantworte mir ein paar Fragen.",
];

export const TOUR_LINES = [
  "Hier kannst du das erleben — ich habe schon einiges erlebt.",
  "Was gefällt dir denn so? In welche Richtung darf es gehen?",
  "Sollen wir ein paar Mädels raussuchen, die zu dir passen?",
];

export const FRIEND_LINES = [
  "Hier sind zwei Freundinnen von mir: Artemis und Tania.",
  "Die sind ab und zu online — zusammen oder einzeln. Du kannst mit beiden reden oder mit einer.",
];

export const TREASURE_LINES = [
  "Und dann gibt es noch besondere Geschichten — alle auf wahren Begebenheiten.",
  "Du kannst in eine Rolle schlüpfen, nur zuhören oder zuschauen. Du entscheidest.",
];

export const THERAPIST_LINES = [
  "Vielleicht gibt es Sachen, die du erst mal mit einer Therapeutin besprechen möchtest.",
  "Keine Angst, keine Berührungsängste — eine etwas unkonventionelle Behandlungsart, wenn du verstehst.",
  "Du darfst dich wohlfühlen wie wenn du alleine bist, ganz offen und ehrlich aussprechen, was du möchtest. Sie hat Verständnis dafür — sie mag das sogar, im Gegenteil.",
];

export const VOYEUR_LINES = [
  "Wenn du dich austoben willst, ziehe ich mir in der Zwischenzeit was Bequemes an.",
  "Ich setze mich hinten hin, rauche eine und schaue dir ein bisschen zu. Und NICHT UMDREHEN — wer weiß, was ich hier hinten mache.",
  "Ich bin hier, wenn du mich brauchst.",
];

export const RECALL_LINES = [
  "Ja, hier bin ich. Ich kann es schon gar nicht erwarten — worauf freust du dich am meisten?",
  "Ich bin so gespannt, wie du abgehst.",
];

export const RECALL_TIPS = [
  "Ich würde vorschlagen, wir gehen mal 15 aufs Ganze.",
  "Frag sie doch mal das und das — ich kenne sie nämlich ganz gut, ich weiß, wie sie reagiert. Vertrau mir.",
];

// Der Takt: eine Zeile nach der anderen, wie in einem Chat — keine Textwand.
export const INTRO_TAKT = { line: 1100, pause: 380 };

export const LANDING_HINT =
  "Bevor es losgeht: du kannst dir deine eigene Erzählerin bauen — Aussehen, Persönlichkeit, Stimme. Sie führt dich danach durch alles.";

// ── Gemerkt ───────────────────────────────────────────────────────────────
const MODE_KEY = "artanis_intro_mode";
const BRANCH_KEY = "artanis_intro_branch";

const read = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch (e) {
    return "";
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* egal */
  }
};

export const introMode = () => read(MODE_KEY);
export const setIntroMode = (mode) => write(MODE_KEY, mode || "");

// Wohin er will: sie geht ins Eck und schaut zu, oder sie führt ihn durch.
export const INTRO_BRANCH = { CORNER: "CORNER", TOUR: "TOUR" };

export const introBranch = () => read(BRANCH_KEY);
export const setIntroBranch = (branch) => write(BRANCH_KEY, branch || "");

// ── Der Ablauf ────────────────────────────────────────────────────────────
// Jeder Baustein ist ein Schritt. Die Tour hängt sich nur ein, wenn er sich
// führen lassen will; sonst geht sie ins Eck und bleibt rückrufbar.
export function buildIntroFlow({ structure = {}, branch = "" } = {}) {
  const beats = [
    { id: "landing", kind: "landing" },
    { id: "arrival", kind: "arrival" },
    // Die Begrüßung darfst du in der Konsole umschreiben — sonst gilt Davids Wortlaut.
    {
      id: "greeting",
      kind: "script",
      eyebrow: "Sie begrüßt dich",
      lines: structure.greetingText ? [structure.greetingText] : GREETING_LINES,
    },
    { id: "mode", kind: "mode" },
  ];

  if (structure.askGender !== false) {
    beats.push({
      id: "gender",
      kind: "choice",
      eyebrow: "Kurz zu dir",
      title: "Was bist du?",
      hint: "Damit sie dich richtig ansprechen. Du kannst es jederzeit ändern.",
      field: "gender",
      options: structure.genderOptions || [],
    });
  }

  if (structure.askOrientation !== false) {
    beats.push({
      id: "orientation",
      kind: "choice",
      eyebrow: "Und sonst",
      title: "Worauf stehst du?",
      hint: "Nur damit die Figuren wissen, in welche Richtung sie mit dir gehen dürfen. Sonst nichts.",
      field: "orientation",
      options: structure.orientationOptions || [],
    });
  }

  beats.push({ id: "wish", kind: "wish" });
  beats.push({ id: "branch", kind: "branch" });

  if (branch === INTRO_BRANCH.TOUR) {
    (structure.introSteps || []).forEach((step, i) => {
      beats.push({ id: `tour-${i}`, kind: "tourStop", step, lines: i === 0 ? TOUR_LINES : [] });
    });
  }

  beats.push({ id: "friends", kind: "script", eyebrow: "Ihre Freundinnen", lines: FRIEND_LINES });
  beats.push({ id: "treasures", kind: "script", eyebrow: "Schmankerl", lines: TREASURE_LINES });
  beats.push({ id: "therapist", kind: "script", eyebrow: "Sprechstunde", lines: THERAPIST_LINES });
  beats.push({ id: "voyeur", kind: "script", eyebrow: "Sie bleibt da", lines: VOYEUR_LINES });
  beats.push({ id: "interests", kind: "interests" });
  beats.push({ id: "start", kind: "start" });

  return beats;
}

// {narrator}, {name}, {friend1}, {friend2} — je nachdem, wer gerade da ist.
export function fillLine(text, ctx = {}) {
  return String(text || "")
    .replace(/\{narrator\}/g, ctx.narrator || "deine Erzählerin")
    .replace(/\{name\}/g, ctx.name || "du")
    .replace(/\{friend1\}/g, ctx.friend1 || INTRO_FRIENDS[0].name)
    .replace(/\{friend2\}/g, ctx.friend2 || INTRO_FRIENDS[1].name);
}

// Glücksprinzip: eine von ihnen kommt zufällig näher.
export function pickByChance(list = []) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}