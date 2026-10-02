// God-Mode: der Meister-Schalter für deine eigene Ansicht. An heißt: keine
// Sperren, die Verwaltung steht in der Leiste, alles ist erreichbar. Aus heißt:
// die App verhält sich wie bei einem normalen Besucher. Gespeichert wird nur
// bei dir im Browser — für andere ändert sich nichts.

import { getViewAs, setViewAs, subscribeViewAs } from "@/lib/viewAs";

const KEY = "artanis_god_mode";

let listeners = [];

const emit = () => listeners.forEach((fn) => fn());

export const subscribeGodMode = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((x) => x !== fn);
  };
};

export const isGodMode = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch (e) {
    return false;
  }
};

export const setGodMode = (on) => {
  try {
    if (on) {
      localStorage.setItem(KEY, "1");
      // Der Blick als Nutzer und der God-Mode schließen sich aus — sonst
      // wüsstest du nicht, welche der beiden Ansichten du gerade siehst.
      setViewAs(null);
    } else {
      localStorage.removeItem(KEY);
    }
  } catch (e) {
    /* privater Modus */
  }
  emit();
};

// Wird der Blick als Nutzer eingeschaltet, geht der God-Mode von selbst aus —
// beide zusammen würden sich widersprechen, und du wüsstest nicht mehr, welche
// Ansicht du gerade siehst.
subscribeViewAs(() => {
  if (!getViewAs() || !isGodMode()) return;
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* privater Modus */
  }
  emit();
});