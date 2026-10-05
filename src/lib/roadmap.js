import { kindLabel } from "@/lib/logbuch";

// Die Roadmap: was zuerst dran ist. Drei Kriterien, in genau dieser Reihenfolge —
// Dringlichkeit, dann der kleinste Aufwand (Quick Wins zuerst), dann thematisch
// gebündelt, damit Gleichartiges in einem Rutsch gebaut wird.

export const URGENCY_LABEL = {
  1: "ganz ruhig",
  2: "ruhig",
  3: "normal",
  4: "bald",
  5: "sofort",
};

export const EFFORT_LABEL = {
  1: "Handgriff",
  2: "klein",
  3: "mittel",
  4: "größer",
  5: "groß",
};

// Layout und Design stehen vorn, damit sie zusammen liegen. Alles andere
// ordnet sich alphabetisch dahinter — gleich bleibt bei gleich.
export const CLUSTER_ORDER = ["LAYOUT", "DESIGN", "LOGBUCH", "MODUL", "DATEN", "SONSTIGES"];

export const clusterOf = (task) =>
  String(task?.cluster || kindLabel(task?.kind) || "Sonstiges").trim().toUpperCase();

const clusterRank = (task) => {
  const i = CLUSTER_ORDER.indexOf(clusterOf(task));
  return i === -1 ? CLUSTER_ORDER.length : i;
};

// Das Herz der Engine: erst die Dringlichkeit, dann der Aufwand von klein nach
// groß, dann das Thema.
export function rankTasks(tasks = []) {
  return [...tasks].sort((a, b) => {
    const byUrgency = Number(b.urgency ?? 3) - Number(a.urgency ?? 3);
    if (byUrgency) return byUrgency;

    const byEffort = Number(a.effort ?? 3) - Number(b.effort ?? 3);
    if (byEffort) return byEffort;

    const byCluster = clusterRank(a) - clusterRank(b);
    if (byCluster) return byCluster;

    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

// Die Reihenfolge, die wirklich gilt: die eigene. Der Agent arbeitet von oben
// nach unten.
export const sortByOrder = (tasks = []) =>
  [...tasks].sort(
    (a, b) =>
      Number(a.order ?? 0) - Number(b.order ?? 0) ||
      String(a.title || "").localeCompare(String(b.title || ""))
  );

// Kriterien anwenden und daraus feste Positionen machen.
export const withOrder = (tasks = []) => rankTasks(tasks).map((t, i) => ({ ...t, order: i + 1 }));

// Was der Agent als Nächstes anfasst.
export const nextTask = (tasks = []) => sortByOrder(tasks)[0] || null;