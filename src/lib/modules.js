// Was sich wirklich frei anlegen lässt — und was nicht. Die Liste enthält genau
// die Seiten, die es in der App gibt. Neue Seiten erfindet der Editor nicht.

export const MODULE_TYPES = [
  { path: "/", label: "Startseite", description: "Das Erste, was jeder sieht: Bühne, Neues und die wichtigsten Wege." },
  { path: "/explore", label: "Entdecken", description: "Zum Stöbern durch Charaktere und Inhalte." },
  { path: "/videos", label: "Videos", description: "Alle Videoclips an einer Stelle." },
  { path: "/photos", label: "Fotos", description: "Alle Bildergalerien." },
  { path: "/stories", label: "Storys", description: "Geschichten zum Lesen." },
  { path: "/topics", label: "Themen", description: "Inhalte nach Thema sortiert." },
  { path: "/live", label: "Live", description: "Laufende und geplante Übertragungen." },
  { path: "/interactive", label: "Interaktiv", description: "Mitmach-Geschichten mit Entscheidungen." },
  { path: "/groups", label: "Gruppen", description: "Gemeinsame Chatgruppen." },
  { path: "/community", label: "Community", description: "Beiträge und Wünsche der Nutzer." },
  { path: "/coins", label: "Börse", description: "Münzen, Guthaben und Einsätze." },
  { path: "/library", label: "Bibliothek", description: "Alles, was man sich gemerkt hat." },
  { path: "/messages", label: "Nachrichten", description: "Die Chats mit Charakteren und echten Leuten." },
  { path: "/therapy", label: "Sprechstunde", description: "Sitzungen mit Triania." },
  { path: "/request", label: "Wünsche", description: "Wünsche eintragen und abstimmen." },
  { path: "/planung", label: "Content-Planer", description: "Wünsche übernehmen und den Plan für die nächsten Inhalte ziehen." },
  { path: "/paylinks", label: "Kasse", description: "Zahlungen anfordern und bezahlen." },
  { path: "/verkauf", label: "Verkaufs-Dashboard", description: "Umsatz, offene Beträge, Abos und die letzten Zahlungen." },
  { path: "/contests", label: "Wettbewerbe", description: "Wettbewerbe und ihre Beiträge." },
  { path: "/studio", label: "Studio", description: "Hier legst du Charaktere, Stimmen und Inhalte an." },
  { path: "/stimmen", label: "Stimmen", description: "Die Stimmbank mit allen Stimmen." },
  { path: "/baukasten", label: "Baukasten", description: "Bausteine und fertige Pakete." },
  { path: "/dock", label: "Dockingstation", description: "Charaktere aus fremden Vorlagen anlegen." },
  { path: "/leitstand", label: "Leitstand", description: "Der Schaltraum für Chats und Gäste." },
  { path: "/archiv", label: "Archiv", description: "Alle Chats und Sitzungen im Rückblick." },
  { path: "/owner", label: "Besitzer-Konsole", description: "Diese Konsole hier." },
  { path: "/admin", label: "Verwaltung", description: "Nutzer und Freigaben." },
  { path: "/tutorial", label: "Tutorial", description: "Die Einführung Schritt für Schritt." },
  { path: "/anleitung", label: "Anleitung", description: "Nachschlagewerk zum Weiterbauen." },
  { path: "/call", label: "Video-Call", description: "Der Video-Raum für Gespräche." },
  { path: "/account", label: "Konto", description: "Eigenes Profil und Einstellungen." },
];

export const MODULE_LIMITS = [
  "Anlegen und umbenennen kannst du nur Menüpunkte, die auf eine dieser vorhandenen Seiten zeigen.",
  "Anordnen geht per Ziehen, mit den Pfeil-Knöpfen oder durch Eintippen der Position.",
  "Ausblenden heißt nur: nicht mehr in der Leiste. Inhalte, Chats und Rechte bleiben unverändert.",
  "Ausgeblendete Punkte holst du hier jederzeit zurück — nichts wird gelöscht.",
  "Ganz neue Seiten kann dieser Editor nicht erfinden; die entstehen im Chat mit dem Bau-Assistenten.",
];

export const moduleFor = (path) => MODULE_TYPES.find((m) => m.path === path) || null;

export const moduleLabelFor = (path) => moduleFor(path)?.label || path;

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

// Die festen Bereiche der Kopfzeile. Sie stehen immer — nur „Erleben" wird aus
// den eigenen Menüpunkten bestückt.
export const FIXED_AREAS = [
  {
    label: "Charaktere",
    items: [
      { label: "Artanis", path: "/artanis" },
      { label: "Triania", path: "/triania" },
      { label: "Couple", path: "/couple" },
    ],
  },
  {
    label: "Selbst erstellen",
    items: [
      { label: "Studio", path: "/studio" },
      { label: "Stimmen", path: "/stimmen" },
      { label: "Baukasten", path: "/baukasten" },
      { label: "Dockingstation", path: "/dock" },
      { label: "Kasse", path: "/paylinks" },
    ],
  },
  {
    label: "Verwaltung",
    items: [
      { label: "Verwaltung", path: "/admin" },
      { label: "Leitstand", path: "/leitstand" },
      { label: "Besitzer-Konsole", path: "/owner" },
    ],
  },
];

// Der Bereich, den du selbst bestückst.
export const MENU_AREA_LABEL = "Erleben";

// Diese Punkte hängen immer unter „Erleben" — auch wenn dein Menü sie nicht
// nennt. Sonst verschwindet dir ein Bereich unbemerkt.
export const ALWAYS_IN_MENU = [
  { label: "Tutorial", path: "/tutorial" },
  { label: "Nachrichten", path: "/messages" },
  { label: "Sprechstunde", path: "/therapy" },
  { label: "Wettbewerbe", path: "/contests" },
  { label: "Live", path: "/live" },
  { label: "Interaktiv", path: "/interactive" },
  { label: "Entdecken", path: "/explore" },
];

export const fixedAreaItems = () => FIXED_AREAS.flatMap((a) => a.items);