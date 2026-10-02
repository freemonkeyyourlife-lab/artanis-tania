import { base44 } from "@/api/base44Client";

// Alles, was der Besitzer in der Konsole umstellen kann, liegt hier zusammen:
// die Begrüßung am Anfang und die Erklärungen an den Info-Knöpfen.

export const DEFAULT_INTRO_STEPS = [
  {
    title: "Willkommen bei Artanis × Tania",
    text: "Das hier ist kein Katalog zum Durchklicken. Es sind Figuren, die mit dir reden, auf dich reagieren und sich an dich erinnern. Du redest mit ihnen — sie antworten dir.",
  },
  {
    title: "So läuft es ab",
    text: "Du suchst dir eine Figur, ein Szenario, und legst los. Schreiben, sprechen, Bilder schicken, selbst etwas erschaffen — alles geht. Nichts ist endgültig, du kannst jederzeit zurück.",
  },
  {
    title: "Du bestimmst das Tempo",
    text: "Du kannst alles ausprobieren, jederzeit wechseln, aufhören oder neu anfangen. Und du kannst dir die Erklärungen an jedem Punkt an- und ausschalten — oben auf das i.",
  },
];

export const DEFAULT_INTERESTS = [
  "Reden & Flirten",
  "Storys zum Mitmachen",
  "Bilder & Videos",
  "Live dabei sein",
  "Selbst erschaffen",
  "Zuschauen",
  "Rollenspiel",
  "Sprechstunde",
  "Wettbewerbe",
  "Nur stöbern",
];

// Wie jemand anfangen will. Das ist die Weiche am Ende der Begrüßung.
export const START_PATHS = [
  { id: "characters", label: "Figuren kennenlernen", hint: "Artanis, Tania und das Paar", to: "/artanis" },
  { id: "create", label: "Selbst etwas erschaffen", hint: "Eigene Figur, eigene Story", to: "/studio" },
  { id: "watch", label: "Erstmal nur schauen", hint: "Umsehen, nichts tun", to: "/explore" },
];

// Ganz am Anfang: wer bist du, und worauf stehst du. Danach wissen die
// Erzählerinnen, wie sie dich ansprechen dürfen.
export const DEFAULT_GENDERS = ["Mann", "Frau", "Divers"];
export const DEFAULT_ORIENTATIONS = ["Frauen", "Männer", "Beides", "Noch offen"];

export const DEFAULT_GREETING =
  "Ich hab schon auf dich gewartet. Wir werden eine Menge Spaß haben. Vielleicht kommt noch eine Freundin dazu. Wir führen dich ein bisschen rum und schauen dir über die Schulter — wenn du nichts dagegen hast. Wenn nicht, auch okay, aber schade. Hilf mir, dir zu helfen: beantworte mir ein paar Fragen.";

export const DEFAULT_GUIDE_BEHAVIOR =
  "Warm und direkt, duzt den Gast, keine Floskeln. Führt durch die Auswahl statt sie nur abzufragen: greift einen Punkt auf, macht neugierig, gibt ein Beispiel und lässt die Wahl offen. Fragt nach, wenn etwas unklar ist. Wird es persönlich, bleibt sie diskret und lässt das Tempo beim Gast.";

export const DEFAULT_INFO = {
  group_characters:
    "Die drei Hauptfiguren: Artanis, Triania und das Paar. Hier fängst du an, wenn du reden oder mitspielen willst.",
  group_create:
    "Alles, wo du selbst etwas baust: eigene Figuren, eigene Inhalte, eigene Preise.",
  group_explore:
    "Alles zum Erleben — Chats, Sprechstunde, Live, Wettbewerbe, Videos, Fotos, Storys. Das ist der größte Bereich.",
  group_admin:
    "Nur für dich als Besitzer: Übersicht, laufende Chats und dein Steuerpult.",
  messages:
    "Dein Chat. Links die Gespräche, rechts das Gespräch selbst. Den Balken dazwischen ziehst du dir breiter oder schmaler. Dateien kannst du einfach ins Fenster ziehen.",
  studio:
    "Deine Werkbank. Hier legst du Figuren, Stimmen, Inhalte, Storys, Themen, Live-Streams und Wettbewerbe an.",
  wish: "Sag frei heraus, was du willst — reden oder sprechen. Du bekommst fertige Angebote dafür, vom reinen Zuschauen bis zum eigenen Content.",
  dock: "Hier baust du aus einer Beschreibung eine ganz neue Figur — mit eigener Persönlichkeit.",
  therapy: "Die Sprechstunde. Ein geschützter Rahmen für Gespräche, die woanders keinen Platz haben.",
  contests: "Wettbewerbe mit Beiträgen und Abstimmung. Du legst Regeln, Preis und Laufzeit fest.",
  owner:
    "Dein Steuerpult. Lage, Menü, Schrift, Zugang und Sicherung — und die Schalter für die Begrüßung und die Erklärungen.",
};

export const DEFAULT_STRUCTURE = {
  introEnabled: true,
  infoEnabled: true,
  introSteps: DEFAULT_INTRO_STEPS,
  interestOptions: DEFAULT_INTERESTS,
  infoTexts: DEFAULT_INFO,
  askGender: true,
  askOrientation: true,
  genderOptions: DEFAULT_GENDERS,
  orientationOptions: DEFAULT_ORIENTATIONS,
  greetingText: DEFAULT_GREETING,
  guideBehavior: DEFAULT_GUIDE_BEHAVIOR,
  guideVoice: "honey",
};

const SEEN_KEY = "artanis_intro_seen_v1";
const PROFILE_KEY = "artanis_intro_profile";

let cached = null;
let inflight = null;
let listeners = [];

export async function loadStructure() {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const rows = await base44.entities.SiteLayout.list("-updated_date", 1);
      const row = rows[0] || {};
      cached = {
        introEnabled: row.introEnabled !== false,
        infoEnabled: row.infoEnabled !== false,
        introSteps: Array.isArray(row.introSteps) && row.introSteps.length ? row.introSteps : DEFAULT_INTRO_STEPS,
        interestOptions:
          Array.isArray(row.interestOptions) && row.interestOptions.length ? row.interestOptions : DEFAULT_INTERESTS,
        infoTexts: { ...DEFAULT_INFO, ...(row.infoTexts || {}) },
        askGender: row.askGender !== false,
        askOrientation: row.askOrientation !== false,
        genderOptions:
          Array.isArray(row.genderOptions) && row.genderOptions.length ? row.genderOptions : DEFAULT_GENDERS,
        orientationOptions:
          Array.isArray(row.orientationOptions) && row.orientationOptions.length
            ? row.orientationOptions
            : DEFAULT_ORIENTATIONS,
        greetingText: row.greetingText || DEFAULT_GREETING,
        guideBehavior: row.guideBehavior || DEFAULT_GUIDE_BEHAVIOR,
        guideVoice: row.guideVoice || "honey",
      };
    } catch (e) {
      cached = { ...DEFAULT_STRUCTURE };
    }
    inflight = null;
    listeners.forEach((fn) => fn(cached));
    return cached;
  })();
  return inflight;
}

export const getStructure = () => cached || DEFAULT_STRUCTURE;

export const subscribeStructure = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((x) => x !== fn);
  };
};

export const clearStructureCache = () => {
  cached = null;
};

export const infoText = (topic) => getStructure().infoTexts?.[topic] || DEFAULT_INFO[topic] || "";

export const introSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === "true";
  } catch (e) {
    return false;
  }
};

export const markIntroSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, "true");
  } catch (e) {
    /* ignore */
  }
};

export const resetIntroSeen = () => {
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch (e) {
    /* ignore */
  }
};

// Die Konsole ruft das auf, damit du die Begrüßung jederzeit selbst ansehen kannst.
export const openIntroPreview = () => {
  window.dispatchEvent(new CustomEvent("artanis:intro-preview"));
};

// Braucht gerade etwas die volle Aufmerksamkeit (Begrüßung, Kreieren)? Dann
// hält sich die Begleiterin im Eck raus — sonst redet sie dazwischen.
const quietReasons = new Set();
let quietFlag = false;
let quietListeners = [];

export const isQuiet = () => quietFlag;

export const holdQuiet = (reason, on) => {
  if (on) quietReasons.add(reason);
  else quietReasons.delete(reason);
  const next = quietReasons.size > 0;
  if (next === quietFlag) return;
  quietFlag = next;
  quietListeners.forEach((fn) => fn(quietFlag));
};

export const subscribeQuiet = (fn) => {
  quietListeners.push(fn);
  return () => {
    quietListeners = quietListeners.filter((x) => x !== fn);
  };
};

export const saveIntroProfile = async (profile) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    /* ignore */
  }
  try {
    const me = await base44.auth.me();
    if (!me?.id) return;
    const data = { userId: me.id };
    if (profile.gender) data.gender = profile.gender;
    if (profile.orientation) data.orientation = profile.orientation;
    if (profile.interests?.length) data.interests = profile.interests;
    if (profile.path) data.topicsToDiscuss = [profile.path];
    if (profile.wish) data.whatTheyWantToSee = profile.wish;
    const existing = await base44.entities.UserPreference.filter({ userId: me.id });
    if (existing[0]) await base44.entities.UserPreference.update(existing[0].id, data);
    else await base44.entities.UserPreference.create(data);
  } catch (e) {
    /* noch nicht angemeldet — dann bleibt es eben im Browser */
  }
};