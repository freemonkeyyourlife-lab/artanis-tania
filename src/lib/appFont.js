// Schriftart für die ganze App — wählbar im Konto. Wirkt sofort, bleibt
// auf diesem Gerät gespeichert. Platform-Schriften liegen als woff2-Dateien
// und werden in index.css per @font-face geladen.

export const FONTS = [
  { value: "Montserrat", label: "Montserrat", sample: "Modern & kräftig" },
  { value: "Recoleta", label: "Recoleta", sample: "Elegant & weich" },
  { value: "Helvetica", label: "Helvetica", sample: "Klar & zeitlos" },
  { value: "Proxima Nova", label: "Proxima Nova", sample: "Sanft & modern" },
  { value: "Aether", label: "Aether", sample: "Ruhig & leicht" },
  { value: "Benzin", label: "Benzin", sample: "Kantig & laut" },
  { value: "Adobe Caslon", label: "Adobe Caslon", sample: "Klassisch & serif" },
];

const LS_KEY = "app-font";
const DEFAULT = "Montserrat";

const stack = (family) => `"${family}", "Montserrat", sans-serif`;

export function applyFont(family) {
  const root = document.documentElement;
  const s = stack(family || DEFAULT);
  root.style.setProperty("--font-heading", s);
  root.style.setProperty("--font-body", s);
  root.style.setProperty("--font-display", s);
}

export function getStoredFont() {
  try { return localStorage.getItem(LS_KEY) || DEFAULT; } catch { return DEFAULT; }
}

export function setStoredFont(family) {
  try { localStorage.setItem(LS_KEY, family); } catch { /* ignore */ }
  applyFont(family);
}

// Beim Start einmal anwenden, damit die gewählte Schrift sofort steht.
export function applyStoredFont() {
  applyFont(getStoredFont());
}