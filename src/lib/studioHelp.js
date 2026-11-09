// Anleitungs-Texte pro Studio-Seite: Intro, Schritte und eine Legende,
// die erklärt, was jeder Button bedeutet. Gehört zu <StudioAnleitung />.

export const STUDIO_HELP = {
  sammelgalerie: {
    title: "Sammel-Galerie — Anleitung",
    intro:
      "Dein privater Sammel-Ort für alles, was du findest. Medien landen hier und warten auf Wiederverwertung, Training und Einbau.",
    steps: [
      "Medien per Drag&drop in die Feld-Zone werfen oder Klick zum Auswählen.",
      "Oder einen Bild-Link eingeben und „Einsammeln“ — das Bild kommt ins Archiv.",
      "Pro Kachel Art wählen (Allgemein / Idee / Charakter / Bausatz) und notieren.",
      "Kachel anklicken → „Bearbeiten“ schneidet/rotiert das Bild.",
      "„Ins Trainingsset“ schiebt das Bild zum nächsten freien Satz.",
    ],
    buttons: [
      { label: "Medien hierher ziehen", meaning: "Bilder, Videos oder Audio per Drag&drop oder Klick hochladen." },
      { label: "Link einsaugen", meaning: "Eine Bild-URL aus dem Netz ins Archiv holen." },
      { label: "Einsammeln", meaning: "Den eingegebenen Link als Archiv-Eintrag speichern." },
      { label: "Gefilterte ins Training", meaning: "Alle aktuell gefilterten Kacheln auf einmal ins Trainingsset schieben." },
      { label: "Google Drive", meaning: "Drive-Ordner öffnen und Dateien direkt importieren." },
      { label: "Bearbeiten (✂️)", meaning: "Bild zuschneiden, drehen oder optimieren." },
      { label: "Ins Trainingsset (🧠)", meaning: "Dieses Bild einem Trainings-Satz zuweisen." },
      { label: "Löschen (🗑️)", meaning: "Kachel aus dem Archiv entfernen." },
      { label: "Art-Dropdown", meaning: "Kategorie der Kachel festlegen (Allgemein/Idee/Charakter/Bausatz)." },
    ],
  },
  trainingszentrale: {
    title: "Trainings-Zentrale — Anleitung",
    intro:
      "Status aller KI-Modell-Workflows an einem Ort. Verfolge Sammlung, Bereitschaft und Trainings-Jobs.",
    steps: [
      "Kennzahlen oben zeigen Gesamtzahl, Sammlung, Bereit, Trainiert, Läuft, Fehler und fertige Modelle.",
      "Pro Satz: Bilder-Zähler (have/target) und Quellen zeigen Fortschritt.",
      "„Galerie zuweisen“ holt Dateien aus der Sammel-Galerie in den Satz.",
      "Läuft ein Job, „Status“ beim RunPod anfragen.",
      "Fertiges Modell über „Modell“ herunterladen.",
    ],
    buttons: [
      { label: "Zur Galerie", meaning: "Sammel-Galerie öffnen, um neue Medien zu holen." },
      { label: "Trainings-Werkstatt", meaning: "Schritt-für-Schritt-Assistent zum Trainieren öffnen." },
      { label: "Galerie", meaning: "Bilder aus der Galerie diesem Satz zuweisen." },
      { label: "Werkstatt", meaning: "Diesen Satz in der Trainings-Werkstatt öffnen." },
      { label: "Charakter", meaning: "Zugehörigen Charakter öffnen." },
      { label: "Status", meaning: "Aktuellen Trainings-Job-Status bei RunPod abfragen." },
      { label: "Modell", meaning: "Fertiges trainiertes Modell herunterladen." },
    ],
  },
  "studio-uebersicht": {
    title: "Studio-Übersicht — Anleitung",
    intro:
      "Zentrale Schaltstelle: Status deiner KI-Modelle, Voice-Daten und Trainingsfortschritte, plus direkte Galerie-Zuweisung und Sprung zur Charakter-Vorschau.",
    steps: [
      "Kennzahlen zeigen Sätze, trainierte Modelle, Bild/Video/Text-Modelle, Stimmen und Charaktere.",
      "Abschnitt „KI-Modelle“ listet alle Bild-, Video- und Text-Modelle mit Aktiv-Punkt.",
      "Abschnitt „Voice-Daten“ zeigt Stimmen und Voice-Modelle.",
      "Abschnitt „Trainingsfortschritt“: pro Satz „Galerie zuweisen“ oder „Vorschau & Erstellen“.",
      "Abschnitt „Charaktere & Erstellen“: Charakter anklicken → Vorschau & Erstellen.",
    ],
    buttons: [
      { label: "Galerie", meaning: "Sammel-Galerie öffnen." },
      { label: "Werkstatt", meaning: "Trainings-Werkstatt öffnen." },
      { label: "Galerie zuweisen", meaning: "Dateien aus der Galerie diesem Trainings-Satz anhängen." },
      { label: "Vorschau & Erstellen", meaning: "Charakter öffnen und Bild/Text/Clip erzeugen." },
      { label: "Status", meaning: "Trainings-Job-Status abfragen." },
      { label: "Charakter-Karte", meaning: "Charakter-Detail mit Erstellen-Panel öffnen." },
    ],
  },
  charakter: {
    title: "Charakter & Erstellen — Anleitung",
    intro:
      "Eine Figur aufgeschlagen: alle Felder, das Mischpult und das Erstellen-Panel, das aus der Figur Bilder, Text oder Clips macht.",
    steps: [
      "Links: großes Bild, Aussehen/Art/Benehmen/Verständnis, Stimme und Neigungen.",
      "Mitte: Mischpult — Rollen, Situationen und Szenarien zusammenstellen.",
      "„Vorschau & Erstellen“: Art wählen (Bild/Text/Clip), Szene beschreiben, erstellen.",
      "Logbuch zeigt Aufträge zur Figur, Storys darunter.",
    ],
    buttons: [
      { label: "Adventure-Bild", meaning: "Ein einzelnes Szenen-Bild aus der Figur erzeugen." },
      { label: "Roleplay-Text", meaning: "Einen kurzen Erzähl-/Dialog-Text als Figur schreiben." },
      { label: "Kurzer Clip", meaning: "Einen 6-Sekunden-Clip erzeugen (dauert ~30–60s)." },
      { label: "Erstellen", meaning: "Die gewählte Art mit dem eingegebenen Szenen-Text erzeugen." },
      { label: "Zur Charakter-Werkstatt", meaning: "Zurück zur Übersicht aller Figuren." },
    ],
  },
};

export function getStudioHelp(key) {
  return STUDIO_HELP[key] || null;
}

// Baut aus allen Anleitungen ein vollständiges, druckbares HTML-Handbuch
// ( öffnet im Browser, „Drucken" → „Als PDF speichern" ) und lädt es herunter.
export function downloadStudioManual() {
  const esc = (s) => String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&", "<": "<", ">": ">" }[c]));
  const pages = Object.entries(STUDIO_HELP);
  const body = pages
    .map(([key, h]) => {
      const steps = (h.steps || [])
        .map((s, i) => `<li>${i + 1}. ${esc(s)}</li>`)
        .join("");
      const btns = (h.buttons || [])
        .map(
          (b) =>
            `<tr><td class="lbl">${esc(b.label)}</td><td>${esc(b.meaning)}</td></tr>`
        )
        .join("");
      return `
        <section>
          <h2>${esc(h.title)}</h2>
          <p class="intro">${esc(h.intro)}</p>
          ${steps ? `<h3>Schritte</h3><ol>${steps}</ol>` : ""}
          ${btns ? `<h3>Buttons erklärt</h3><table><tbody>${btns}</tbody></table>` : ""}
        </section>`;
    })
    .join("");

  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<title>Studio-Anleitung — ARTANIS × TANIA</title>
<style>
  body { font-family: "Montserrat", Arial, sans-serif; max-width: 760px; margin: 32px auto; padding: 0 20px; color: #111; line-height: 1.55; }
  h1 { font-size: 28px; margin-bottom: 4px; }
  .sub { color: #666; margin-bottom: 28px; }
  section { border-top: 2px solid #e29578; padding: 20px 0; }
  h2 { font-size: 20px; margin: 0 0 8px; }
  .intro { margin: 0 0 12px; }
  h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #888; margin: 14px 0 6px; }
  ol { padding-left: 20px; } li { margin: 3px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; font-size: 14px; }
  td.lbl { white-space: nowrap; background: #f6eee9; font-weight: 600; color: #b5654a; width: 38%; }
  @media print { body { margin: 0; } section { page-break-inside: avoid; } }
</style></head><body>
<h1>Studio-Anleitung</h1>
<p class="sub">ARTANIS × TANIA · Stand ${new Date().toLocaleDateString("de-DE")}</p>
${body}
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "studio-anleitung.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}