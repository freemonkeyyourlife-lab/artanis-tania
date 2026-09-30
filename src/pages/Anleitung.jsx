import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Archive, Blocks, Mic, Github, Plug, KeyRound, ShieldAlert, Sparkles, Image as ImageIcon, MessageSquare } from "lucide-react";

// Zum Nachschlagen: wie alles zusammenhängt — Schritt für Schritt, mit den
// genauen Stellen in der App. Nur für den Besitzer.
const SECTIONS = [
  {
    icon: Sparkles,
    title: "Hugging Face — hier kommen die Modelle her",
    intro: "Dein Konto hängt schon an der App. Du musst nichts eintippen — du holst dir die Modelle im Studio.",
    steps: [
      "Verbinden: ist schon erledigt. Dein Hugging-Face-Konto ist mit der App verbunden. Kein Schlüssel, keine ID, nichts zum Eintragen.",
      "Bildmodelle ansehen: App → Studio → Reiter Bild-KI. Oben steht die Liste der Modelle, die bei Hugging Face gerade wirklich laufen.",
      "Suchen: ins Suchfeld tippen, zum Beispiel flux, sdxl oder realistic.",
      "Übernehmen: beim gewünschten Modell auf Prüfen & übernehmen. Die App macht einen kurzen Probelauf — nur was wirklich ein Bild liefert, bleibt drin. Alles andere fällt von selbst raus.",
      "Benutzen: App → Studio → Reiter Generator. Dort ist das Modell jetzt als Quelle wählbar.",
      "Textmodelle ansehen: App → Studio → Reiter Text-KI. Genau dasselbe — suchen, Prüfen & übernehmen.",
      "Benutzen: im Chat oben rechts das Modell auswählen. Ab dann antwortet die Figur damit.",
      "Guthaben: die ganz großen Modelle kosten bei Hugging Face Geld. Verwalten kannst du das unter huggingface.co/settings/billing — der Link steht auch im Studio unter Bild-KI.",
    ],
    to: "/studio",
    toLabel: "Direkt ins Studio",
  },
  {
    icon: Github,
    title: "GitHub — zwei verschiedene Wege",
    intro: "Sag mir vorher, welchen der beiden du meinst — sie sind völlig verschieden.",
    steps: [
      "Was du brauchst: nur dein GitHub-Konto. Es gibt keinen Schlüssel zum Eintippen — die Anmeldung läuft über GitHub selbst, und ich sehe dein Passwort nie.",
      "Weg A — dein Projekt sichern: damit liegt der ganze Code der App in deinem GitHub-Repository und du kannst ihn dort sichern und mitnehmen.",
      "Weg B — GitHub-Daten in der App nutzen: damit kann die App auf deine GitHub-Inhalte zugreifen, zum Beispiel Repositories oder Issues anzeigen.",
      "Wenn du einen davon willst: sag einfach welchen. Dann starte ich die Anmeldung, du klickst bei GitHub auf Zustimmen, fertig.",
    ],
  },
  {
    icon: ImageIcon,
    title: "Was ist schon eingebaut — und was noch nicht",
    intro: "Damit du siehst, wo du gerade stehst.",
    items: [
      "Fertig: Hugging Face ist verbunden. Bildmodelle und Textmodelle holst du im Studio mit einem Klick.",
      "Fertig: der kostenlose Weg ohne Konto heißt Pollinations — im Studio unter Bild-KI als Plattform wählbar, wenn du mal kein Guthaben ausgeben willst.",
      "Fertig: Zahlen über Stripe (Testmodus), Coins, Telegram-Benachrichtigungen, Videochat.",
      "Fertig: Stimmen klonen — Aufnahme hochladen, klonen lassen, danach spricht die Stimme jeden Text. Studio → Stimmbank → Bearbeiten.",
      "Fertig: Links per Telegram verschicken — in jedem Einladen-Fenster auf „Per Telegram senden“.",
      "Offen: GitHub — noch nicht verbunden. Sag welchen Weg du willst.",
      "Offen: weitere Verbindungen wie Google, Slack, Notion — die gibt es, sind aber noch nicht eingerichtet.",
    ],
  },
  {
    icon: Archive,
    title: "Die Archive — wo alles wiederzufinden ist",
    intro: "Nichts geht verloren. Texte, Stimmen, Interessen, Chatverläufe und erstellte Bilder liegen jeweils an einer festen Stelle.",
    items: [
      "Texte: App → Studio → Reiter Inhalte. Dort stehen alle Beiträge und Storys. Was du mit dem Herz markierst, sammelt sich zusätzlich in App → Bibliothek.",
      "Stimmen: App → Studio → Reiter Stimmbank. Jede Stimme bleibt mit Aufnahme, Schlagworten und Notiz liegen — oben in der Sprechprobe hörst du sie sofort.",
      "Interessen: App → Besitzer-Konsole → Struktur. Das ist die Liste, aus der die Nutzer beim Start auswählen.",
      "Chatverläufe: App → Nachrichten für die Chats der Nutzer, App → Leitstand für alles, was über Telegram hereinkommt.",
      "Erstellte Bilder: App → Studio → Reiter Galerie. Jedes erzeugte Bild bleibt dort und lässt sich einem Charakter zuordnen.",
      "Faustregel: Alles, was du erstellst, landet im Studio. Alles, was du markierst, landet in der Bibliothek. Von allein gelöscht wird nichts.",
    ],
    to: "/studio",
    toLabel: "Direkt ins Studio",
  },
  {
    icon: Mic,
    title: "Stimmen — holen, klonen, freigeben",
    intro: "Der ElevenLabs-Schlüssel liegt schon in der App. Du musst nichts mehr eintragen und fürs Benutzen auch nicht mehr zu ElevenLabs.",
    steps: [
      "Holen: App → Studio → Stimmbank → Knopf „Aus ElevenLabs“. Dort stehen alle Stimmen aus deinem ElevenLabs-Konto — eigene, geklonte und fertige.",
      "„Alle noch fehlenden übernehmen“ holt sie in einem Zug herüber. Danach sind sie hier ganz normal nutzbar: Sprechprobe, Chat, Video-Call.",
      "Neue Stimme anlegen: Stimmbank → „Neue Stimme“. Aufnahme einsprechen oder eine mp3/wav hochladen (mindestens 30 Sekunden), dann „Als eigene Stimme klonen“. Das passiert hier in der App — nicht bei ElevenLabs.",
      "Einem Charakter geben: in der Zeile der Stimme rechts den Charakter auswählen. Eine Stimme gehört immer nur einem Charakter.",
      "Freigeben: in der Zeile auf „Freigeben“. Danach darf sie jeder nutzen — oben erscheint dann das grüne Zeichen. Mit „Freigabe zurücknehmen“ nimmst du es wieder weg.",
      "Kostenpflichtig machen: im Bearbeiten-Fenster unter „Preis in Coins“ (0 = gratis).",
      "Anhören: oben in der Stimmbank die Sprechprobe — Stimme wählen, Text tippen, anhören. Genau so klingt sie später im Chat.",
    ],
    to: "/studio",
    toLabel: "Zur Stimmbank",
  },
  {
    icon: Plug,
    title: "Was hier geht",
    intro: "Die Wege, die auf dieser Plattform wirklich funktionieren.",
    items: [
      "Verbindungen (Integrationen): Google, Slack, Notion, HubSpot und viele mehr — entweder du verbindest sie einmal für alle, oder jeder Nutzer verbindet sein eigenes Konto.",
      "Secrets: Schlüssel für Dienste, die keine fertige Verbindung haben. Nur nötig, wenn ich dir ausdrücklich sage, dass ein Dienst einen braucht.",
      "Hintergrund-Funktionen: alles, was im Hintergrund läuft — Zahlungen, Telegram, Benachrichtigungen.",
      "Automatik: Abläufe, die von selbst starten. Wenn X passiert, dann Y.",
    ],
  },
  {
    icon: ShieldAlert,
    title: "Was hier nicht geht",
    intro: "Damit du keine Zeit mit Sachen verbringst, die technisch nicht möglich sind.",
    items: [
      "Zugangsdaten annehmen: ich kann keine Passwörter oder Logins von dir annehmen und mich damit irgendwo anmelden. Verbindungen laufen immer über den offiziellen Weg.",
      "Firebase und Replit: dafür gibt es hier keine Verbindung. Der Weg für Daten ist die eingebaute Datenbank, der Weg für Code dieses Projekt.",
      "Echte 3D-Modelle, die sich aus einem Chat aufbauen: dafür fehlt die Rechenleistung. Der stilisierte Look bleibt der Weg.",
      "Stimmklonen ohne Anbieter-Schlüssel: nur mit einem verbundenen Anbieter möglich.",
      "Fremde Dienste ohne eigenen Zugang anzapfen: nicht möglich — jeder Dienst braucht seinen eigenen.",
    ],
  },
];

const FIND_SPOTS = [
  "App → Studio → Galerie: alle erstellten Bilder.",
  "App → Studio → Stimmbank: alle Stimmen samt Aufnahme.",
  "App → Studio → Inhalte: alle Texte, Storys und Beiträge.",
  "App → Besitzer-Konsole → Struktur: die Liste der Interessen.",
  "App → Nachrichten und App → Leitstand: alle Chatverläufe.",
  "Dashboard → Secrets: Schlüssel für Dienste, die keine fertige Verbindung haben.",
  "Dashboard → Integrations: Verbindungen zu fremden Diensten.",
  "Dashboard → API: die Schlüssel, die andere für deine App brauchen.",
  "Dashboard → Logs: wenn mal etwas nicht läuft, steht es hier.",
  "App → Studio: Charaktere, Stimmbank, Bild-KI, Text-KI, Inhalte, Storys.",
  "App → Besitzer-Konsole: Menü, Zugang, Kanäle, Baukasten.",
];

export default function Anleitung() {
  const [me, setMe] = useState(undefined);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  if (me === undefined) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!me || me.role !== "admin") {
    return (
      <div className="w-full px-4 lg:px-10 py-20 text-center">
        <h1 className="font-display text-2xl text-foreground">Nur für den Besitzer</h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2">Diese Anleitung sieht nur der Admin.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss">Anleitung</h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-4xl leading-relaxed">
          Zum Nachschlagen: Schritt für Schritt, mit den genauen Stellen in der App. Damit du nicht
          jedes Mal fragen musst — und damit du weißt, was schon läuft und was nicht.
        </p>
      </div>

      <div className="space-y-5">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="glass rounded-2xl border-2 border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </span>
                <h2 className="font-display text-2xl text-foreground">{s.title}</h2>
              </div>
              <p className="text-[15px] font-semibold text-muted-foreground mb-4">{s.intro}</p>

              {s.steps && (
                <ol className="space-y-3">
                  {s.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-[13px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[15px] font-semibold text-foreground/90 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {s.items && (
                <ul className="space-y-2">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-[15px] font-semibold text-foreground/90 leading-relaxed">
                      <span className="text-primary font-bold flex-shrink-0">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s.to && (
                <Link
                  to={s.to}
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
                >
                  {s.toLabel}
                </Link>
              )}
            </div>
          );
        })}

        <div className="glass rounded-2xl border-2 border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5 text-primary" />
            </span>
            <h2 className="font-display text-2xl text-foreground">Wo du was findest</h2>
          </div>
          <ul className="space-y-2">
            {FIND_SPOTS.map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] font-semibold text-foreground/90 leading-relaxed">
                <span className="text-primary font-bold flex-shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-2xl border-2 border-primary/40 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-primary" />
            </span>
            <h2 className="font-display text-2xl text-foreground">Wenn du etwas anbauen willst</h2>
          </div>
          <p className="text-[15px] font-semibold text-muted-foreground leading-relaxed">
            Sag in einem Satz, was du willst — ich baue es ein. Für fremde Dienste brauche ich keine
            Zugangsdaten von dir: entweder gibt es eine offizielle Verbindung, oder du hinterlegst den
            Schlüssel selbst im Dashboard. Dann sage ich dir nur, welcher Name dorthin gehört und wo du
            den Wert herbekommst.
          </p>
        </div>
      </div>
    </div>
  );
}