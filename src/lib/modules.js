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
  { path: "/therapy", label: "Sprechstunde", description: "Sitzungen mit Tania." },
  { path: "/request", label: "Wünsche", description: "Wünsche eintragen und abstimmen." },
  { path: "/planung", label: "Content-Planer", description: "Wünsche übernehmen und den Plan für die nächsten Inhalte ziehen." },
  { path: "/paylinks", label: "Kasse", description: "Zahlungen anfordern und bezahlen." },
  { path: "/verkauf", label: "Verkaufs-Dashboard", description: "Umsatz, offene Beträge, Abos und die letzten Zahlungen." },
  { path: "/contests", label: "Wettbewerbe", description: "Wettbewerbe und ihre Beiträge." },
  { path: "/studio", label: "Studio", description: "Hier legst du Charaktere, Stimmen und Inhalte an." },
  { path: "/werkstatt", label: "Werkstatt", description: "Dein privater Raum: Charakter-Fabrik und frei sortierbare Kachel-Leinwand, abseits des App-Verkehrs." },
  { path: "/ideen", label: "Ideen-Ordner", description: "Ideen und Geschichten mit den Menschen, die dazugehören, dem Prompt und den Bildern." },
  { path: "/creator-studio", label: "Creator-Studio", description: "Dasselbe Studio als eigene Seite, ohne Website drumherum — für Charaktere und Stimmen." },
  { path: "/externes-studio", label: "Externes Studio", description: "Der Arbeitsplatz für Bilder: Inhalte, Vorlagen und Modelle auf einen Blick." },
  { path: "/stimmen", label: "Stimmen", description: "Die Stimmbank mit allen Stimmen." },
  { path: "/baukasten", label: "Baukasten", description: "Bausteine und fertige Pakete." },
  { path: "/dock", label: "Dockingstation", description: "Charaktere aus fremden Vorlagen anlegen." },
  { path: "/leitstand", label: "Leitstand", description: "Der Schaltraum für Chats und Gäste." },
  { path: "/archiv", label: "Archiv", description: "Alle Chats und Sitzungen im Rückblick." },
  { path: "/owner", label: "Besitzer-Konsole", description: "Diese Konsole hier." },
  { path: "/admin", label: "Verwaltung", description: "Nutzer und Freigaben." },
  { path: "/tutorial", label: "Tutorial", description: "Die Einführung Schritt für Schritt." },
  { path: "/anleitung", label: "Anleitung", description: "Nachschlagewerk zum Weiterbauen." },
  { path: "/leitfaden", label: "Leitfaden", description: "Wenn ich das will, klicke ich da und da — der Weg durch die ganze Seite." },
  { path: "/modellplan", label: "Modell-Plan", description: "Welche Bild-Modelle es gibt, was fehlt und was es kostet." },
  { path: "/banana", label: "Nano Banana", description: "Welches Modell bei fal.ai, wie ein Prompt aufgebaut ist und die Module zum Kopieren." },
  { path: "/palette", label: "Neigungen und Bausteine", description: "Die Neigungs-Palette und der Baukasten: jeder Baustein mit jedem kombinierbar." },
  { path: "/logbuch", label: "Logbuch", description: "Bauaufträge sprechen, Prompt freigeben, Weg bis fertig mitverfolgen." },
  { path: "/chatmodul", label: "Chat-Modul", description: "Das eigenständige Chatfenster — als App installierbar, mit Telegram gespiegelt und in fremde Seiten einbettbar." },
  { path: "/lernordner", label: "Lern-Ordner", description: "Alle Fragen aus dem Chat mit ihren Antworten, nach Themen sortiert." },
  { path: "/spickzettel", label: "Spickzettel", description: "Prompt-Länge, Modellwahl, Begriffe — zum Nachschlagen." },
  { path: "/call", label: "Video-Call", description: "Der Video-Raum für Gespräche." },
  { path: "/account", label: "Konto", description: "Eigenes Profil und Einstellungen." },
  { path: "/prompt", label: "Prompt-Generator", description: "Idee sprechen oder tippen — heraus kommt ein fertiger Prompt fürs externe Studio." },
  { path: "/sandbox", label: "Testsandbox", description: "Die Menüführung durchklicken, bevor sie für alle gilt." },
  { path: "/vorschau", label: "Vorschau als Nutzer", description: "Die Leiste so sehen, wie ein normaler Nutzer sie sieht." },
  { path: "/erzaehler", label: "Erzähler", description: "Story-Teller-Studio: Szenen sprechen, Bilder und Stimmen setzen." },
  { path: "/trainingsset", label: "Training", description: "Trainings-Sets anlegen, befüllen und exportieren." },
  { path: "/struktur", label: "Struktur-Übersicht", description: "Alle Seiten als Karten und Verzweigung — sieh, wo sich Menüs überschneiden." },
  { path: "/hilfe", label: "Hilfe & Wegweiser", description: "Wo ist was — und wie kommt man dahin." },
  { path: "/vorleser", label: "Vorleser", description: "Texte vorlesen lassen, stimmungsabhängig." },
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

// Damit oben keine lange Liste aufklappt, bekommt jeder Punkt eine Untergruppe.
// Ein Punkt ohne Eintrag landet unter „Mehr" — nichts fällt weg.
export const NAV_GROUPS = {
  "/artanis": "Die drei",
  "/tania": "Die drei",
  "/couple": "Die drei",

  "/studio": "Bauen",
  "/werkstatt": "Bauen",
  "/ideen": "Bauen",
  "/externes-studio": "Bauen",
  "/stimmen": "Bauen",
  "/baukasten": "Bauen",
  "/dock": "Bauen",
  "/prompt": "Bauen",
  "/banana": "Bauen",
  "/palette": "Bauen",
  "/chatmodul": "Bauen",

  "/paylinks": "Verkaufen",
  "/verkauf": "Verkaufen",
  "/planung": "Verkaufen",

  "/explore": "Ansehen",
  "/videos": "Ansehen",
  "/photos": "Ansehen",
  "/stories": "Ansehen",
  "/topics": "Ansehen",
  "/live": "Ansehen",

  "/interactive": "Mitmachen",
  "/groups": "Mitmachen",
  "/community": "Mitmachen",
  "/contests": "Mitmachen",

  "/messages": "Miteinander",
  "/therapy": "Miteinander",
  "/request": "Miteinander",

  "/library": "Für mich",
  "/coins": "Für mich",
  "/account": "Für mich",
  "/tutorial": "Für mich",
  "/anleitung": "Für mich",
  "/archiv": "Für mich",

  "/admin": "Verwalten",
  "/leitstand": "Verwalten",
  "/lernordner": "Verwalten",
  "/leitfaden": "Verwalten",
  "/spickzettel": "Verwalten",
  "/owner": "Verwalten",
  "/struktur": "Verwalten",
  "/logbuch": "Verwalten",
  "/creator-studio": "Verwalten",
  "/sandbox": "Verwalten",
  "/vorschau": "Verwalten",
  "/story-dashboard": "Verwalten",
  "/erzaehler": "Bauen",
  "/trainingsset": "Bauen",
  "/hilfe": "Für mich",
  "/vorleser": "Für mich",
};

export const NAV_GROUP_FALLBACK = "Mehr";

// Die Reihenfolge der Untergruppen — einmal festgelegt, gilt sie überall.
export const NAV_GROUP_ORDER = [
  "Die drei",
  "Bauen",
  "Verkaufen",
  "Ansehen",
  "Mitmachen",
  "Miteinander",
  "Für mich",
  "Verwalten",
  "Mehr",
];

export const groupForPath = (path) => NAV_GROUPS[path] || NAV_GROUP_FALLBACK;

// Aus einer flachen Liste werden Blöcke mit Überschrift. Die Reihenfolge
// innerhalb eines Blocks bleibt genau so, wie sie eingestellt ist.
export function groupNavItems(items = [], order = NAV_GROUP_ORDER) {
  const byLabel = new Map();
  (items || []).forEach((it) => {
    if (!it || !it.path) return;
    const label = it.group || groupForPath(it.path);
    if (!byLabel.has(label)) byLabel.set(label, { label, items: [] });
    byLabel.get(label).items.push(it);
  });
  const rank = (label) => {
    const i = order.indexOf(label);
    return i === -1 ? order.length : i;
  };
  return [...byLabel.values()].sort((a, b) => rank(a.label) - rank(b.label));
}

// Die festen Bereiche der Kopfzeile. Sie stehen immer — nur „Erleben" wird aus
// den eigenen Menüpunkten bestückt.
export const FIXED_AREAS = [
  {
    label: "Charaktere",
    items: [
      { label: "Artanis", path: "/artanis" },
      { label: "Tania", path: "/tania" },
      { label: "Couple", path: "/couple" },
    ],
  },
  {
    label: "Selbst erstellen",
    items: [
      { label: "Studio", path: "/studio" },
      { label: "Werkstatt", path: "/werkstatt" },
      { label: "Ideen-Ordner", path: "/ideen" },
      { label: "Externes Studio", path: "/externes-studio" },
      { label: "Stimmen", path: "/stimmen" },
      { label: "Baukasten", path: "/baukasten" },
      { label: "Dockingstation", path: "/dock" },
      { label: "Content-Planer", path: "/planung" },
      { label: "Kasse", path: "/paylinks" },
      { label: "Prompt-Generator", path: "/prompt" },
      { label: "Nano Banana", path: "/banana" },
      { label: "Neigungen und Bausteine", path: "/palette" },
      { label: "Chat-Modul", path: "/chatmodul" },
      { label: "Erzähler", path: "/erzaehler" },
      { label: "Training", path: "/trainingsset" },
      { label: "Hilfe & Wegweiser", path: "/hilfe" },
      { label: "Vorleser", path: "/vorleser" },
    ],
  },
  {
    label: "Verwaltung",
    items: [
      { label: "Creator-Studio", path: "/creator-studio" },
      { label: "Verwaltung", path: "/admin" },
      { label: "Leitstand", path: "/leitstand" },
      { label: "Besitzer-Konsole", path: "/owner" },
      { label: "Struktur-Übersicht", path: "/struktur" },
      { label: "Logbuch", path: "/logbuch" },
      { label: "Testsandbox", path: "/sandbox" },
      { label: "Vorschau als Nutzer", path: "/vorschau" },
      { label: "Modell-Plan", path: "/modellplan" },
      { label: "Leitfaden", path: "/leitfaden" },
      { label: "Lern-Ordner", path: "/lernordner" },
      { label: "Spickzettel", path: "/spickzettel" },
      { label: "Story-Dashboard", path: "/story-dashboard" },
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