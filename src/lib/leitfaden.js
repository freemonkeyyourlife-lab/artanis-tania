import {
  UserRound, Image as ImageIcon, Sparkles, Mic, Hash, BookOpen, Users, MessageSquare,
  SlidersHorizontal, ShoppingBag, Compass, HelpCircle, Heart,
} from "lucide-react";

// Der Leitfaden: Wenn ich das will, klicke ich da und da. Jeder Weg ist ein
// Rezept mit den genauen Stellen in der App und einem Knopf, der direkt hinspringt.
export const RECIPES = [
  {
    icon: UserRound,
    want: "Ich will eine neue Freundin anlegen, die zu Wort kommt",
    steps: [
      "App -> Erzähler öffnen.",
      "Auf 'Neue Freundin' — Namen, Art und Wesen eintragen.",
      "Unter 'Zeilen' hinterlegen, was sie sagt: Begrüßung, Zwischenrufe, Rückblicke.",
      "Unter 'Regie' einstellen, wann sie von selbst dazwischenredet.",
    ],
    to: "/erzaehler",
    toLabel: "Zum Erzähler-Studio",
  },
  {
    icon: Users,
    want: "Ich will eine Figur anlegen oder ändern",
    steps: [
      "App -> Studio -> Reiter Charaktere.",
      "Auf 'Neuer Charakter' — Name, Art, Wesen, Aussehen.",
      "Bilder hochladen: bei der Karte auf 'Bilder'.",
      "Stimme geben: bei der Karte auf 'Klang & Stimme'.",
    ],
    to: "/studio",
    toLabel: "Ins Studio",
  },
  {
    icon: Heart,
    want: "Ich will Vorbilder hochladen, die als Maßstab gelten",
    steps: [
      "App -> Studio -> Reiter Vorbilder.",
      "Auf 'Neues Vorbild' — Bilder hochladen.",
      "Darunter schreiben, wofür sie verwendbar ist und wie sie auftritt.",
      "Schlagworte setzen, damit du sie später wiederfindest.",
    ],
    to: "/studio",
    toLabel: "Zu den Vorbildern",
  },
  {
    icon: Sparkles,
    want: "Ich will ein Bild bauen",
    steps: [
      "App -> Prompt-Generator — Idee sprechen oder tippen.",
      "Daraus wird ein fertiger Prompt mit Negativ-Prompt.",
      "Prompt kopieren und im externen Studio einsetzen.",
      "Oder direkt: App -> Studio -> Reiter Generator.",
    ],
    to: "/prompt",
    toLabel: "Zum Prompt-Generator",
  },
  {
    icon: Hash,
    want: "Ich will die Hashtags sehen oder ändern",
    steps: [
      "App -> Prompt-Generator -> ganz unten der Abschnitt Hashtags.",
      "Dort steht zu jedem Hashtag, was er bedeutet.",
      "Neuen Hashtag anlegen: Name, Bedeutung, Art.",
      "Diese Bedeutung fließt automatisch in jeden Prompt ein.",
    ],
    to: "/prompt",
    toLabel: "Zu den Hashtags",
  },
  {
    icon: Mic,
    want: "Ich will eine Stimme holen, klonen oder einstellen",
    steps: [
      "App -> Studio -> Reiter Stimmbank.",
      "Der Knopf 'Aus ElevenLabs' holt alle Stimmen herüber.",
      "Neue Stimme klonen: auf 'Neue Stimme', aufnehmen oder Datei hochladen.",
      "Klang einstellen: Tonlage, Intensität, Tempo — dann 'Klang speichern'.",
    ],
    to: "/studio",
    toLabel: "Zur Stimmbank",
  },
  {
    icon: ImageIcon,
    want: "Ich will alle erstellten Bilder wiederfinden",
    steps: [
      "App -> Studio -> Reiter Galerie.",
      "Dort liegen alle Bilder, die erstellt wurden.",
      "Ein Bild am Charakter zuweisen: Studio -> Charaktere -> 'Bilder'.",
    ],
    to: "/studio",
    toLabel: "Zur Galerie",
  },
  {
    icon: MessageSquare,
    want: "Ich will Chats beantworten, die hereinkommen",
    steps: [
      "App -> Leitstand.",
      "Links den Gast auswählen.",
      "Antwort tippen — oder den Mikrofon-Knopf für eine Sprachnachricht.",
      "Häkchen 'Jede Antwort als Sprachnachricht', wenn sie deine Stimme hören sollen.",
    ],
    to: "/leitstand",
    toLabel: "Zum Leitstand",
  },
  {
    icon: SlidersHorizontal,
    want: "Ich will das Menü oder die Struktur ändern",
    steps: [
      "App -> Besitzer-Konsole -> Struktur.",
      "Menüpunkte anordnen, umbenennen oder ausblenden.",
      "Interessen-Liste pflegen: dort unter Interessen.",
      "Vorher ansehen: App -> Testsandbox.",
    ],
    to: "/owner",
    toLabel: "Zur Besitzer-Konsole",
  },
  {
    icon: ShoppingBag,
    want: "Ich will etwas verkaufen oder Zahlungen sehen",
    steps: [
      "App -> Kasse — Zahlungslinks anlegen und teilen.",
      "App -> Verkaufs-Dashboard — Umsatz und offene Beträge.",
      "Inhalte mit Preis: App -> Studio -> Reiter Inhalte & Preise.",
    ],
    to: "/verkauf",
    toLabel: "Zum Verkaufs-Dashboard",
  },
  {
    icon: Compass,
    want: "Ich will Storys und Erlebnisse anlegen",
    steps: [
      "App -> Studio -> Reiter Storys.",
      "Neue Story anlegen und der Figur zuordnen.",
      "Mitmach-Geschichten: App -> Interaktiv.",
    ],
    to: "/studio",
    toLabel: "Zu den Storys",
  },
  {
    icon: BookOpen,
    want: "Ich will nachschlagen, wie etwas geht",
    steps: [
      "App -> Spickzettel — Prompt-Länge, Modellwahl, Begriffe.",
      "App -> Anleitung — Schritt für Schritt zu jedem Thema.",
      "App -> Lern-Ordner — alle Fragen aus dem Chat mit Antworten.",
    ],
    to: "/spickzettel",
    toLabel: "Zum Spickzettel",
  },
];

// Die Landkarte: welche Bereiche es gibt und was in welchem steckt.
export const MAP = [
  { area: "Die drei", what: "Artanis, Triania und das Paar — die Hauptfiguren der Seite." },
  { area: "Bauen", what: "Studio, Erzähler, Stimmen, Baukasten, Vorbilder, Prompt-Generator. Hier entsteht alles." },
  { area: "Verkaufen", what: "Kasse, Verkaufs-Dashboard und der Content-Planer." },
  { area: "Ansehen", what: "Entdecken, Videos, Fotos, Storys, Themen, Live — was die Gäste sehen." },
  { area: "Mitmachen", what: "Interaktiv, Gruppen, Community, Wettbewerbe." },
  { area: "Miteinander", what: "Nachrichten, Sprechstunde, Wünsche." },
  { area: "Für mich", what: "Bibliothek, Börse, Konto, Tutorial, Anleitung, Archiv." },
  { area: "Verwalten", what: "Verwaltung, Leitstand, Besitzer-Konsole, Lern-Ordner, Spickzettel, Testsandbox." },
];

export const RULE = {
  icon: HelpCircle,
  text: "Alles, was du erstellst, landet im Studio. Alles, was du markierst, landet in der Bibliothek. Wenn du etwas nicht findest: frag den Assistenten unten links — er bringt dich direkt hin.",
};