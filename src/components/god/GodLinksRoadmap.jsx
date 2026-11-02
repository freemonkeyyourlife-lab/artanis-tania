import React, { useState } from "react";
import { ExternalLink, Folder, Map, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

// Links & Roadmap im God-Mode: nur die echten Seiten-Adressen und Subdomains,
// die Anforderungen und die Roadmap. Keine Quell-Archive — die saugen wir
// woanders rein. Bleibt als Reiter in der Konsole erreichbar.

const SITES = [
  { label: "Medienwerkstatt – David", url: "https://artanis-werkstatt-david.david-springer4ncnda.chatgpt.site/" },
  { label: "Medienwerkstatt – weitere Adresse", url: "https://artanis-werkstatt-david.funyew6.chatgpt.site/" },
  { label: "ARTANIS × TANIA (Base44-Vorbild)", url: "https://artanis-tania.base44.app/" },
  { label: "Einladungslink", url: "https://artanis-tania.base44.app/?invite=pro" },
  { label: "Creator Studio", url: "https://artanis-tania.base44.app/creator-studio" },
  { label: "Vorschau", url: "https://preview--artanis-tania.base44.app/" },
  { label: "Weitere Live-Adresse", url: "https://artanis-tania-live.base44.app/" },
  { label: "FreeMonkey", url: "https://freemonkey.ai.studio/" },
];

const SOFTWARE = [
  { label: "ARTANIS × TANIA – GitHub", url: "https://github.com/freemonkeyyourlife-lab/artanis-tania" },
  { label: "SillyTavern", url: "https://github.com/SillyTavern/SillyTavern" },
  { label: "KoboldCpp", url: "https://github.com/LostRuins/koboldcpp" },
  { label: "Stable Diffusion WebUI Forge", url: "https://github.com/lllyasviel/stable-diffusion-webui-forge" },
  { label: "AllTalk TTS", url: "https://github.com/daswer123/alltalk_tts" },
  { label: "FaceFusion", url: "https://github.com/facefusion/facefusion" },
  { label: "Stash", url: "https://github.com/stashapp/stash" },
];

const ANFORDERUNGEN = [
  {
    titel: "Grundidee",
    punkte: [
      "Eine zentrale ARTANIS-App statt vieler getrennter Oberflächen.",
      "Zuerst für dich persönlich, möglichst lokal und privat.",
      "Base44 als Vorbild für Aussehen und Funktionen, ohne notwendige Verbindung.",
      "Funktionen vergleichen und sinnvoll zusammenführen, keine Doppelungen.",
      "Bereiche logisch anordnen, anklickbar und miteinander verbindbar.",
      "Lokale ARTANIS-Daten getrennt von Free-Monkeys- und KITT-Systemdaten.",
    ],
  },
  {
    titel: "Dateien, Links und Quellen",
    punkte: [
      "Bilder, Videos, Audios, Dokumente, Modelle einfügen.",
      "Dateien/Ordner per Auswahl oder Drag-and-Drop.",
      "Links eingeben und Unterseiten untersuchen, soweit freigegeben.",
      "Automatische Erfassung oder manuelle Auswahl.",
      "Inhalte ordnen, durchsuchen, filtern, archivieren.",
      "Quellen und Herkunft nachvollziehbar halten, Duplikate erkennen.",
      "Originale nicht ungefragt löschen.",
      "Eigene Bilder und Drives selbst erfassbar machen, dann anbinden.",
    ],
  },
  {
    titel: "Kreativ-Baukasten",
    punkte: [
      "Bilder, Videos, Texte, Stimmen, Charaktere, Modelle anklicken und wählen.",
      "Bausteine individuell kombinieren.",
      "Neue Inhalte erzeugen, soweit ein Werkzeug die Umwandlung unterstützt.",
      "Geeignete Inhalte an Generatoren und Training übergeben.",
    ],
  },
  {
    titel: "Texte, Chats und Geschichten",
    punkte: [
      "Texte einfügen und bearbeiten.",
      "Geschichten/Chats über angeschlossenes Modell erstellen.",
      "Fortsetzen, speichern, wiederfinden, weiterverwenden.",
    ],
  },
  {
    titel: "Stimmen und Hörbuch",
    punkte: [
      "Stimme auswählen und mit Text/Charakter verbinden.",
      "Texte vorlesen lassen wie ein Hörbuch.",
      "Eigene Stimmen einbinden, sofern ein Sprachserver angeschlossen ist.",
      "Audio abspielen und exportieren.",
    ],
  },
  {
    titel: "Bilder und Videos",
    punkte: [
      "Einfügen, auswählen, archivieren, weiterverwenden.",
      "Neue Bilder/Videos mit angebundenen Generatoren.",
      "Promptgenerator für Bildbeschreibungen.",
      "Modelle, Charaktere, Stimmen, Medien kombinieren.",
    ],
  },
  {
    titel: "Charaktere und Training",
    punkte: [
      "Eigene Charaktere selbst erstellen und gestalten.",
      "Bilder/Materialien einem Charakter zuordnen.",
      "Geeignete Inhalte direkt ans Training schicken.",
      "Echten Trainingsserver und Rechenkapazität anbinden.",
      "Fertiges Modell auswählen und für Generierungen verwenden.",
      "Nur Materialien mit Rechten und Einwilligungen trainieren.",
    ],
  },
  {
    titel: "Therapie- und Gesprächsbereich",
    punkte: [
      "Bereich für persönliche/sexualtherapeutische Themen.",
      "Thema wählen, virtuelle Gesprächspartnerin zusammenstellen.",
      "Szenarien durchspielen und fortsetzen.",
      "KI erkennbar, keine echte Behandlung vortäuschen.",
    ],
  },
  {
    titel: "Programmierteam",
    punkte: [
      "Vorhandene Agentenwerkstatt nutzen, keine Ersatz-App bauen.",
      "Projekt wählen, echten Programmierauftrag erteilen.",
      "BILL, Claude, Hermes, Manus/OpenManus, n8n einzeln und als Kette.",
      "Status, Protokolle, Ergebnisse, Änderungen sichtbar.",
      "Änderungen prüfen, testen, sichern, zurücknehmen.",
      "Nicht installierte Werkzeuge nicht als betriebsbereit darstellen.",
    ],
  },
];

const ROADMAP = [
  {
    prio: "Priorität 1 – Programmierteam nutzbar machen",
    schritte: [
      "BILL-/Agentenwerkstatt und Projektstände zuordnen.",
      "Speicher, Server, Zugänge, Modellweg prüfen.",
      "Kleines Testprojekt, echten Auftrag aus der Oberfläche ausführen.",
      "Ergebnis, Änderungen, Test, Rücknahme nachweisen.",
      "Weitere Werkzeuge einzeln verbinden und testen.",
    ],
    fertig: "Auftrag geht von der Oberfläche bis zur gespeicherten Änderung; Test und Rücknahme funktionieren.",
  },
  {
    prio: "Priorität 2 – Oberfläche und Grundfunktionen",
    schritte: [
      "ARTANIS-Code und Medienwerkstatt vergleichen.",
      "Seite fertig zusammenführen und logisch ordnen.",
      "Doppelte Bereiche zusammenführen.",
      "Base44-Abhängigkeiten ersetzen.",
      "Echten Chat anschließen, Geschichtenfortsetzung testen.",
      "Vorlesen mit verfügbarer Stimme testen, eigene Stimmen anbinden.",
    ],
    fertig: "Seite ist zusammengeführt, geordnet und ohne Base44-Abhängigkeiten lauffähig.",
  },
  {
    prio: "Danach – Quellen und Kreativfunktionen",
    schritte: [
      "Dateien, Links, Unterseiten, Ordner, Drives anbinden.",
      "Archiv, Suche, Filter, Duplikaterkennung testen.",
      "Baukasten: Charaktere, Bilder, Videos, Stimmen, Modelle verbinden.",
      "Bild-, Video-, Sprachgeneratoren einzeln anschließen.",
      "Therapiebereich integrieren.",
      "Trainingsserver prüfen, echten Trainingslauf + Modelltest nachweisen.",
      "Weitere Apps untersuchen, Funktionen übernehmen.",
    ],
    fertig: "Quellen angebunden, Kreativfunktionen getestet, Trainingslauf nachgewiesen.",
  },
];

const STAND = [
  "Vorhanden: Projektdateien, Archive, Code-Bausteine, Unterlagen.",
  "Nicht fertig: Unabhängige Gesamtseite noch nicht gebaut und getestet.",
  "Nicht nachgewiesen: Echter Trainingslauf mit nutzbarem Modell.",
  "Blocker: Quellstand und lauffähige Programmierumgebung noch nicht abgenommen.",
  "Kleinster Schritt: KITT-Agentenwerkstatt-Paket und ARTANIS-Quellstand prüfen.",
];

function LinkRow({ label, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-start gap-2 rounded-xl bg-elevated border border-border px-3 py-2 hover:border-primary/40 transition-colors"
    >
      <ExternalLink className="w-3.5 h-3.5 mt-0.5 text-muted-foreground group-hover:text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-foreground leading-tight">{label}</p>
        <p className="text-[10px] text-muted-foreground break-all">{url}</p>
      </div>
    </a>
  );
}

function Section({ icon: Icon, titel, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{titel}</p>
      </div>
      {children}
    </div>
  );
}

export default function GodLinksRoadmap() {
  const [view, setView] = useState("links");

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 px-4 py-2 border-b-2 border-border">
        {[
          { key: "links", label: "Links" },
          { key: "anforderungen", label: "Anforderungen" },
          { key: "roadmap", label: "Roadmap" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors",
              view === t.key ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {view === "links" && (
          <>
            <Section icon={ExternalLink} titel="ARTANIS-Seiten (Subdomains)">
              <div className="space-y-1.5">
                {SITES.map((l) => (
                  <LinkRow key={l.url} {...l} />
                ))}
              </div>
            </Section>
            <Section icon={Folder} titel="GitHub & Software">
              <div className="space-y-1.5">
                {SOFTWARE.map((l) => (
                  <LinkRow key={l.url} {...l} />
                ))}
              </div>
            </Section>
          </>
        )}

        {view === "anforderungen" && (
          <Section icon={ListChecks} titel="Anforderungen">
            <div className="space-y-3">
              {ANFORDERUNGEN.map((a) => (
                <div key={a.titel} className="rounded-xl bg-elevated border border-border p-3">
                  <p className="text-[12px] font-bold text-primary mb-1.5">{a.titel}</p>
                  <ul className="space-y-1">
                    {a.punkte.map((p, i) => (
                      <li key={i} className="text-[12px] text-foreground/90 leading-snug flex gap-1.5">
                        <span className="text-primary">·</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {view === "roadmap" && (
          <>
            <Section icon={Map} titel="Roadmap">
              <div className="space-y-3">
                {ROADMAP.map((r) => (
                  <div key={r.prio} className="rounded-xl bg-elevated border border-border p-3">
                    <p className="text-[12px] font-bold text-primary">{r.prio}</p>
                    <ul className="mt-1.5 space-y-1">
                      {r.schritte.map((s, i) => (
                        <li key={i} className="text-[12px] text-foreground/90 leading-snug flex gap-1.5">
                          <span className="text-primary">{i + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] font-semibold text-emerald-400">
                      Fertig: {r.fertig}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
            <Section icon={ListChecks} titel="Ehrlicher aktueller Stand">
              <div className="rounded-xl bg-elevated border border-border p-3 space-y-1">
                {STAND.map((s, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground leading-snug">• {s}</p>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}