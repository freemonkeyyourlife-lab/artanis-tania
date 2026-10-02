// Feste Plätze für alles, was schwebt.
//
// Regel, für immer: Jeder Knopf und jedes Fenster bekommt von vornherein genau
// einen Platz. Die Plätze liegen nebeneinander und stapeln sich in einer festen
// Reihenfolge — dadurch können sich zwei Elemente nie überschneiden. Sie sind
// nur nicht immer sichtbar. Etwas Neues bekommt einen Platz, nie einen eigenen
// `fixed`-Wert.
//
// Ebenen, von unten nach oben:
//    50  Kopfzeile und untere Leiste
//    60  die festen Plätze (dieser Katalog)
//    80  aufpoppende Fenster — immer über den Plätzen
//    90  Sperren (Alterstor, Lusttor)
//   100  Meldungen ganz oben
//
// Jeder Platz liegt unterhalb von 96 px, solange die untere Leiste sichtbar ist
// (bis 1024 px Breite) — sonst läge er auf der Leiste.

export const ZONES = {
  "bottom-left": {
    className:
      "fixed left-4 bottom-24 lg:bottom-6 z-[60] flex flex-col-reverse items-start gap-2 pointer-events-none",
  },
  "bottom-right": {
    className:
      "fixed right-4 bottom-24 lg:bottom-6 z-[60] flex flex-col-reverse items-end gap-2 pointer-events-none",
  },
  "bottom-center": {
    className:
      "fixed left-1/2 -translate-x-1/2 bottom-24 lg:bottom-6 z-[60] flex flex-col-reverse items-center gap-2 pointer-events-none w-[calc(100%-2rem)] max-w-md",
  },
  "top-right": {
    className:
      "fixed right-4 top-[84px] z-[60] flex flex-col items-end gap-2 pointer-events-none",
  },
};

// Ein aufpoppendes Fenster liegt immer über den Plätzen.
export const WINDOW_LAYER = "z-[80]";

export const zoneId = (zone) => `floating-zone-${zone}`;