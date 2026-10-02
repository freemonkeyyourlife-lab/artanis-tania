// Was sich wirklich frei anlegen lässt — und was nicht. Die Liste enthält genau
// die Seiten, die es in der App gibt. Neue Seiten erfindet der Editor nicht.

export const MODULE_TYPES = [
  { path: "/", label: "Startseite" },
  { path: "/explore", label: "Entdecken" },
  { path: "/videos", label: "Videos" },
  { path: "/photos", label: "Fotos" },
  { path: "/stories", label: "Storys" },
  { path: "/topics", label: "Themen" },
  { path: "/live", label: "Live" },
  { path: "/interactive", label: "Interaktiv" },
  { path: "/groups", label: "Gruppen" },
  { path: "/community", label: "Community" },
  { path: "/coins", label: "Börse" },
  { path: "/library", label: "Bibliothek" },
  { path: "/messages", label: "Nachrichten" },
  { path: "/therapy", label: "Sprechstunde" },
  { path: "/request", label: "Wünsche" },
  { path: "/paylinks", label: "Kasse" },
  { path: "/contests", label: "Wettbewerbe" },
  { path: "/studio", label: "Studio" },
  { path: "/stimmen", label: "Stimmen" },
  { path: "/baukasten", label: "Baukasten" },
  { path: "/dock", label: "Dockingstation" },
  { path: "/leitstand", label: "Leitstand" },
  { path: "/archiv", label: "Archiv" },
  { path: "/owner", label: "Besitzer-Konsole" },
  { path: "/admin", label: "Verwaltung" },
  { path: "/tutorial", label: "Tutorial" },
  { path: "/anleitung", label: "Anleitung" },
  { path: "/call", label: "Video-Call" },
  { path: "/account", label: "Konto" },
];

export const MODULE_LIMITS = [
  "Anlegen und umbenennen kannst du nur Menüpunkte, die auf eine dieser vorhandenen Seiten zeigen.",
  "Anordnen geht per Ziehen, mit den Pfeil-Knöpfen oder durch Eintippen der Position.",
  "Ausblenden heißt nur: nicht mehr in der Leiste. Inhalte, Chats und Rechte bleiben unverändert.",
  "Ausgeblendete Punkte holst du hier jederzeit zurück — nichts wird gelöscht.",
  "Ganz neue Seiten kann dieser Editor nicht erfinden; die entstehen im Chat mit dem Bau-Assistenten.",
];

export const moduleLabelFor = (path) => MODULE_TYPES.find((m) => m.path === path)?.label || path;

// Was ändert sich gegenüber dem gespeicherten Stand? Für die Vorschau vor dem Anwenden.
export function diffModules(saved = [], draft = []) {
  const changes = [];
  const savedByPath = new Map(saved.map((s) => [s.path, s]));
  const draftPaths = new Set(draft.map((d) => d.path));

  draft.forEach((item, index) => {
    const before = savedByPath.get(item.path);
    if (!before) {
      changes.push({ kind: "add", text: `„${item.label}“ kommt an Position ${index + 1} dazu.` });
      return;
    }
    if (before.hidden !== !!item.hidden) {
      changes.push({ kind: "visibility", text: `„${item.label}“ wird ${item.hidden ? "ausgeblendet" : "wieder eingeblendet"}.` });
    }
    if (before.label !== item.label) {
      changes.push({ kind: "rename", text: `„${before.label}“ heißt danach „${item.label}“.` });
    }
  });

  saved.forEach((before, index) => {
    if (!draftPaths.has(before.path)) {
      changes.push({ kind: "remove", text: `„${before.label}“ fällt aus der Leiste (war Position ${index + 1}).` });
    }
  });

  const orderBefore = saved.filter((s) => draftPaths.has(s.path)).map((s) => s.path);
  const orderAfter = draft.map((d) => d.path).filter((p) => orderBefore.includes(p));
  if (orderBefore.length > 1 && orderBefore.join() !== orderAfter.join()) {
    changes.push({ kind: "order", text: `Neue Reihenfolge: ${draft.map((d) => d.label).join(" · ")}` });
  }

  return changes;
}