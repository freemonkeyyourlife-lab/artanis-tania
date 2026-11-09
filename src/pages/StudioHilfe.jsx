import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Lock, Paintbrush, Users, Cpu, Mic, Share2, ClipboardList, Wand2, Boxes, ArrowRight } from "lucide-react";

// Persönliche Studio-Hilfe: erklärt, wie der private Bereich funktioniert,
// was jedes Werkzeug tut, wo Dinge eingebunden/fließen und wie du sie änderst.

const GROUPS = [
  {
    icon: Lock, title: "Zugang & Struktur", color: "text-primary",
    items: [
      { to: "/admin", name: "Privater Bereich", what: "Alle Trainings-, Modell- und Charakter-Werkzeuge, abgetrennt vom öffentlichen Verkehr. Nur Admin sieht sie.", flow: "Eintritt über /admin oder Direkt-Links. Nicht-Admins sehen einen Hinweis, Gast geht zum Login mit Rückkehr (Deep-Link).", change: "Partnerin einladen: Button oben rechts, E-Mail als Admin. Link zu einer Funktion teilen über den Teilen-Button." },
      { to: "/", name: "Design-Editor", what: "Schrift, Zeilenabstand und Akzentfarbe für die ganze Seite ändern.", flow: "Schwebender Button unten links (nur Admin). Änderungen gelten nach Speichern für alle Besucher.", change: "Voreinstellung wählen oder Helligkeit regeln, dann Für-alle-speichern." },
    ],
  },
  {
    icon: Users, title: "Charaktere & Werkstatt", color: "text-secondary",
    items: [
      { to: "/werkstatt", name: "Werkstatt", what: "Dashboard mit Charakter-Kacheln und Aktionen, frei anordnen.", flow: "Charaktere aus dem Charakter-Studio erscheinen hier als Kacheln und im Werkstatt-Spiel.", change: "Bearbeiten-Modus: Kacheln ziehen/skalieren/löschen, Layout wird lokal gespeichert." },
      { to: "/charakter", name: "Charakter-Studio", what: "Charaktere anlegen und bearbeiten (Aussehen, Verhalten, Stimme).", flow: "Charaktere gehen in Werkstatt-Kacheln, Chat-Personas und Detailseiten /charakter/:id.", change: "Im Formular Felder ändern, Bild hochladen (stored privately), Stimme zuweisen, speichern." },
      { to: "/dock", name: "Dock", what: "Persona-Vorlagen einreichen und freigeben.", flow: "Freigegebene Docks können in Charaktere und Personas übernommen werden.", change: "Vorlage anlegen, Status auf APPROVED setzen, dann in Charaktere übernehmen." },
      { to: "/baukasten", name: "Baukasten", what: "Bausteine und Phrasen sammeln.", flow: "Phrasen fließen in Prompts und Bot-Antworten.", change: "Kits/Blöcke anlegen, Phrasen ergänzen." },
    ],
  },
  {
    icon: Cpu, title: "Training & Modelle", color: "text-primary",
    items: [
      { to: "/trainingsset", name: "Trainingsassistent", what: "6-Schritt-Flow: Sammlung, Zuweisung, Sortierung, Training, Charakter, Download.", flow: "Medien gehen in ein TrainingsSet, dann GPU-Training (RunPod), dann Modell-Download und Charakter-Übernahme.", change: "Pro Schritt Medien zuweisen, Parameter setzen, Training starten. Status steht im Satz." },
      { to: "/sammelgalerie", name: "Sammelgalerie", what: "Bilder, Videos, Audio sammeln per Drag & Drop oder Link.", flow: "Ins-Trainingsset wählt einen Trainings-Satz (Person) oder legt einen an. Videos werden im Trainingsassistent zu Frames extrahiert.", change: "Drop-Zone, Link einsaugen, pro Stück Ins-Training oder Gefilterte-ins-Training." },
      { to: "/modellplan", name: "Modellplan", what: "Planung welcher Satz wann trainiert wird.", flow: "Pläne gehen in den Trainingsassistent.", change: "Einträge anlegen/verschieben." },
      { to: "/archiv", name: "Archiv", what: "Therapie- und Chat-Verläufe durchsuchen.", flow: "Nur Lesen für Admins.", change: "Filtern, Transkript öffnen, herunterladen." },
    ],
  },
  {
    icon: Mic, title: "Stimmen & Erzähler", color: "text-secondary",
    items: [
      { to: "/stimmen", name: "Voice-Studio", what: "Stimmen anlegen, klonen (ElevenLabs), feintunen.", flow: "Stimmen werden am Charakter (voiceId) gebunden und im Chat sowie Vorleser gesprochen.", change: "Stimme anlegen, Samples hochladen, klonen, im Charakter zuweisen." },
      { to: "/erzaehler", name: "Erzähler-Studio", what: "Narrator-Workbench mit Text-, Bild-, Video-, Stimmen- und Regie-Blöcken.", flow: "Narrator-Ergebnisse erscheinen als Homepage-Audiomomente und Begleitung.", change: "Blöcke zusammenstellen, generieren, speichern." },
      { to: "/banana", name: "Banana-Studio", what: "Modul-Glossar und Prompt-Bausteine.", flow: "Banana-Module fließen in Prompts.", change: "Glossar ergänzen, Prompt-Karten kopieren." },
    ],
  },
  {
    icon: Share2, title: "Schnittstelle & Export", color: "text-primary",
    items: [
      { to: "/schnittstelle", name: "Schnittstelle", what: "SillyTavern-Kompatibilität: JSON-Karten, Stimmen-Export, Modell-Download.", flow: "Charaktere, Stimmen und Modelle werden zu exportierbaren Dateien für SillyTavern.", change: "Charakter wählen, Karte/Export/Download erzeugen, Datei speichern." },
      { to: "/botimport", name: "Bot-Import", what: "Externe Bots und Personas importieren.", flow: "Import wird zu Charakter oder Modul.", change: "Quelle wählen, Mapping prüfen, importieren." },
    ],
  },
  {
    icon: ClipboardList, title: "Planung & Logbuch", color: "text-secondary",
    items: [
      { to: "/logbuch", name: "Logbuch", what: "Bau- und Fortschrittsberichte.", flow: "Berichte geben Übersicht über Fertig/Offen.", change: "Einträge anlegen, Status setzen." },
      { to: "/story-dashboard", name: "Story-Dashboard", what: "Kapitel-Funnel und Engagement.", flow: "Stories fließen in Analytics.", change: "Kapitel bearbeiten, Metriken lesen." },
      { to: "/prompt", name: "Prompt-Studio", what: "Prompts bauen, schärfen, testen.", flow: "Prompts gehen in Generatoren und Chat.", change: "Prompt schreiben, verfeinern, in Sandbox testen." },
      { to: "/sandbox", name: "Sandbox", what: "Freies Testen von Modellen und Prompts.", flow: "Eingabe wird ausgeführt, ohne Produktion zu berühren.", change: "Modell/Prompt wählen, ausführen." },
    ],
  },
];

export default function StudioHilfe() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-2">
        <BookOpen className="h-7 w-7 text-primary" />
        <h1 className="font-display text-4xl text-foreground text-gloss">Studio-Hilfe</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
        Dein privater Bereich ist vom öffentlichen Verkehr abgetrennt — nur du (und eingeladene Admins) arbeiten hier.
        Diese Seite erklärt, wie der Bereich funktioniert, was jedes Werkzeug tut, wo Dinge eingebunden werden und wie du sie änderst.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 font-heading text-sm text-foreground">
          <Wand2 className="h-4 w-4 text-primary" /> So fließt alles zusammen
        </div>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Sammelgalerie sammelt Medien, Ins-Training übergibt sie an einen Trainings-Satz (Person), der Trainingsassistent
          trainiert das Modell (RunPod), Modell und Stimme (Voice-Studio) werden am Charakter gebunden, der Charakter
          erscheint in Werkstatt, Chat und auf der Seite, und die Schnittstelle exportiert ihn als SillyTavern-Karte.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {GROUPS.map((g) => {
          const GIcon = g.icon;
          return (
            <section key={g.title}>
              <h2 className={"font-heading text-lg flex items-center gap-2 " + g.color}>
                <GIcon className="h-5 w-5" /> {g.title}
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {g.items.map((it) => (
                  <div key={it.name} className="rounded-2xl border border-border bg-card p-4">
                    <Link to={it.to} className="font-display text-base text-foreground hover:text-primary inline-flex items-center gap-1">
                      {it.name} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <p className="mt-2 text-xs text-foreground/90">{it.what}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground"><span className="text-foreground/70">Fließt nach:</span> {it.flow}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground"><span className="text-foreground/70">Ändern:</span> {it.change}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5 accent-glow">
        <div className="flex items-center gap-2 font-heading text-sm text-foreground">
          <Boxes className="h-4 w-4 text-primary" /> Schnellzugriff
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {GROUPS.flatMap((g) => g.items).map((it) => (
            <Link key={it.to} to={it.to} className="rounded-full bg-elevated px-3 py-1.5 text-muted-foreground hover:text-foreground">{it.name}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}