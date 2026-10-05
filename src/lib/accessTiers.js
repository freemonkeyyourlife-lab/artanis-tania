// Zwei Welten: der offene Nutzerbereich und alles, was nur mit Rechten
// erreichbar ist. Jede Seite trägt genau eine Stufe — danach richtet sich der
// gelbe Rand, an dem man beides sofort auseinanderhält.

export const TIER = {
  USER: "user",
  ADMIN: "admin",
  DEV: "dev",
};

export const TIER_LABEL = {
  [TIER.USER]: "Nutzerbereich",
  [TIER.ADMIN]: "Admin & Entwicklung",
  [TIER.DEV]: "Godmode",
};

// Der gelbe Rand — dieselbe Kennfarbe überall, damit nichts durchrutscht.
export const TIER_RING = {
  [TIER.USER]: "",
  [TIER.ADMIN]: "ring-2 ring-yellow-400",
  [TIER.DEV]: "ring-2 ring-yellow-300",
};

export const TIER_BADGE = {
  [TIER.USER]: "",
  [TIER.ADMIN]: "bg-yellow-400 text-black",
  [TIER.DEV]: "bg-yellow-300 text-black",
};

// Werkzeuge zum Anlegen, Verwalten und Verkaufen.
const ADMIN_PATHS = new Set([
  "/studio",
  "/ideen",
  "/creator-studio",
  "/stimmen",
  "/baukasten",
  "/dock",
  "/prompt",
  "/paylinks",
  "/verkauf",
  "/planung",
  "/admin",
  "/leitstand",
  "/archiv",
  "/anleitung",
  "/modellplan",
  "/banana",
  "/lernordner",
  "/spickzettel",
]);

// Nur für dich: hier wird nichts veröffentlicht, hier wird geprüft und gesteuert.
const DEV_PATHS = new Set(["/owner", "/sandbox", "/vorschau", "/logbuch"]);

export const tierForPath = (path) => {
  if (DEV_PATHS.has(path)) return TIER.DEV;
  if (ADMIN_PATHS.has(path)) return TIER.ADMIN;
  return TIER.USER;
};

export const isRestricted = (path) => tierForPath(path) !== TIER.USER;

export const isRestrictedTier = (tier) => !!tier && tier !== TIER.USER;