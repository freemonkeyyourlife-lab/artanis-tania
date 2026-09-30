// Die Sprechzeilen-Bank: ein Satz pro Situation und Stufe. Von der Begrüßung
// bis zum Schluss — damit jede Figur in jedem Moment etwas zu sagen hat.

export const PHRASE_STAGES = [
  { id: "ANKOMMEN", label: "1 · Ankommen", hint: "Die ersten Worte, wenn jemand reinkommt." },
  { id: "SMALLTALK", label: "2 · Smalltalk", hint: "Locker reden, Interesse zeigen." },
  { id: "ANMACHE", label: "3 · Anmache", hint: "Deutlicher werden, Komplimente, Nähe." },
  { id: "HEISS", label: "4 · Heiß", hint: "Eindeutig, aber noch mit Andeutung." },
  { id: "ESKALATION", label: "5 · Eskalation", hint: "Direkt und fordernd." },
  { id: "ABSCHLUSS", label: "6 · Abschluss", hint: "Das letzte Wort, bevor es weitergeht." },
];

export const stageLabel = (id) => PHRASE_STAGES.find((s) => s.id === id)?.label || id;

export const PHRASE_SITUATIONS = [
  "Erster Kontakt",
  "Allein zu zweit",
  "Heimlich",
  "Zuhause",
  "Unterwegs",
  "Vor der Kamera",
  "Nach langer Zeit",
  "Streit & Versöhnung",
  "Abschied",
];

export const PHRASE_VOICES = [
  { id: "river", label: "River — ruhig, neutral" },
  { id: "honey", label: "Honey — warm, weich" },
  { id: "sunny", label: "Sunny — hell, aufgeweckt" },
  { id: "storm", label: "Storm — bestimmt, förmlich" },
  { id: "spark", label: "Spark — energisch, schnell" },
];

// Ein Startgerüst, damit die Bank nicht leer ist. Alles frei änderbar.
export const STARTER_PHRASES = [
  { stage: "ANKOMMEN", text: "Hi, na — was machst du gerade?" },
  { stage: "ANKOMMEN", text: "Da bist du ja. Ich hab schon auf dich gewartet." },
  { stage: "SMALLTALK", text: "Und sonst so? Erzähl mir was." },
  { stage: "SMALLTALK", text: "Bleib mal kurz da — ich wollte dich was fragen." },
  { stage: "ANMACHE", text: "Du siehst heute echt gut aus. Weißt du das eigentlich?" },
  { stage: "ANMACHE", text: "Komm ein Stück näher, ich beiß nicht." },
  { stage: "HEISS", text: "Ich merke genau, wie du mich ansiehst." },
  { stage: "HEISS", text: "Wenn du weiter so schaust, kann ich für nichts garantieren." },
  { stage: "ESKALATION", text: "Sag mir, was du willst — und ich mach es." },
  { stage: "ABSCHLUSS", text: "Nicht aufhören. Bleib bei mir." },
];