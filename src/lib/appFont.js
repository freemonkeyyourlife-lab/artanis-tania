// Schriftarten-Liste und Font-Anwendung. Die Plattform-Schriften liegen als
// woff2-Dateien und werden in index.css per @font-face geladen.

export const FONTS = [
  { value: "Montserrat", label: "Montserrat", sample: "Modern & kräftig" },
  { value: "Recoleta", label: "Recoleta", sample: "Elegant & weich" },
  { value: "Helvetica", label: "Helvetica", sample: "Klar & zeitlos" },
  { value: "Proxima Nova", label: "Proxima Nova", sample: "Sanft & modern" },
  { value: "Aether", label: "Aether", sample: "Ruhig & leicht" },
  { value: "Benzin", label: "Benzin", sample: "Kantig & laut" },
  { value: "Adobe Caslon", label: "Adobe Caslon", sample: "Klassisch & serif" },
];

export function applyFont(family) {
  const root = document.documentElement;
  const s = `"${family || "Montserrat"}", "Montserrat", sans-serif`;
  root.style.setProperty("--font-heading", s);
  root.style.setProperty("--font-body", s);
  root.style.setProperty("--font-display", s);
}