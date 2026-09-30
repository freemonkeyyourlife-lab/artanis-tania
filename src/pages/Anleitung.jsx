import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Blocks, Mic, Github, Plug, KeyRound, ShieldAlert } from "lucide-react";

// Zum Nachschlagen: wie alles zusammenhängt — und was hier bewusst nicht geht.
// Nur für den Besitzer.
const SECTIONS = [
  {
    icon: Blocks,
    title: "Der Baukasten",
    intro: "Aus einzelnen Teilen wird ein Paket, das du immer wieder verwendest.",
    items: [
      "Baustein: eine Situation mit Varianten, eine einzelne Datei oder eine ganze Szene. Jeder Baustein trägt eine Sprechzeile.",
      "Baukasten: mehrere Bausteine zu einem Paket zusammengesetzt — mit Titelbild, Schlagworten und Namen.",
      "Nachbauen: gibst du ein Paket frei, können andere eine eigene Kopie anlegen und sie mit ihrem Material füllen.",
      "Datei: jedes Paket lässt sich exportieren und wieder einlesen — zum Sichern oder Weiterreichen.",
      "Grundstimme: im Baustein wählst du, mit welcher Stimme aus der Stimmbank der Baustein spricht.",
    ],
    to: "/baukasten",
    toLabel: "Baukasten öffnen",
  },
  {
    icon: Mic,
    title: "Stimmen und Sprechzeilen",
    intro: "Damit jede Figur in jedem Moment etwas zu sagen hat.",
    items: [
      "Stimmbank (im Studio): die Stimmen selbst — Grundstimme, Stimmung, Tempo, Tiefe, Beispielsatz.",
      "Sprechzeilen (im Baukasten): Sätze in sechs Stufen, von der Begrüßung bis zum Schluss, je mit Situation.",
      "Anhören: beim ersten Anhören wird die Zeile gesprochen und bleibt liegen — danach kostet es nichts mehr.",
      "Im Baustein holst du eine Zeile mit einem Klick als Grundgerüst und schreibst sie weiter.",
    ],
    to: "/studio",
    toLabel: "Zur Stimmbank",
  },
  {
    icon: Plug,
    title: "Was hier geht",
    intro: "Die Wege, die auf dieser Plattform wirklich funktionieren.",
    items: [
      "GitHub: zwei getrennte Dinge — die Synchronisierung deines Projekts mit einem Repository, und eine Verbindung, um GitHub-Daten in der App zu nutzen. Sag welches, dann richte ich es ein.",
      "Verbindungen (Integrationen): Google, Slack, Notion, HubSpot und viele mehr lassen sich verbinden — jeder Nutzer mit eigenem Konto oder du einmal für alle.",
      "Secrets: Schlüssel und Zugangsdaten für Dienste, die keine fertige Verbindung haben, liegen im Dashboard unter Secrets.",
      "Hintergrund-Funktionen: alles, was im Hintergrund laufen soll — Zahlungen, Telegram, Benachrichtigungen — liegt dort.",
      "Automatik: Abläufe, die von selbst starten — wenn X passiert, dann Y — findest du im Dashboard.",
    ],
  },
  {
    icon: ShieldAlert,
    title: "Was hier nicht geht",
    intro: "Damit du keine Zeit mit Sachen verbringst, die technisch nicht möglich sind.",
    items: [
      "Zugangsdaten übernehmen: ich kann keine Passwörter oder Logins von dir annehmen und mich damit irgendwo anmelden. Verbindungen laufen immer über den offiziellen Weg der Plattform.",
      "Firebase und Replit: dafür gibt es hier keine Verbindung. Der Weg für Daten ist die eingebaute Datenbank, der Weg für Code dieses Projekt.",
      "Echte 3D-Modelle, die sich aus einem Chat aufbauen: dafür fehlt die Rechenleistung. Der stilisierte Look bleibt der Weg.",
      "Stimmklonen ohne Anbieter-Schlüssel: nur mit einem verbundenen Anbieter möglich.",
      "Fremde Dienste ohne eigene Schlüssel anzapfen: nicht möglich — jeder Dienst braucht seinen eigenen Zugang.",
    ],
  },
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
        <h1 className="font-display text-4xl text-foreground text-gloss">Programmierer</h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-4xl leading-relaxed">
          Alles zum Nachschlagen: wie die Teile zusammenhängen, wie du sie erweiterst — und was hier
          bewusst nicht geht. Damit du nicht jedes Mal fragen musst.
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
              <ul className="space-y-2">
                {s.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[15px] font-semibold text-foreground/90 leading-relaxed">
                    <span className="text-primary font-bold flex-shrink-0">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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
            {[
              "Dashboard → Secrets: Schlüssel und Zugangsdaten für Dienste.",
              "Dashboard → Integrations: Verbindungen zu fremden Diensten.",
              "Dashboard → API: die Schlüssel, die andere für deine App brauchen.",
              "Dashboard → Logs: wenn mal etwas nicht läuft, steht es hier.",
              "App → Besitzer-Konsole: Menü, Zugang, Kanäle, Baukasten — alles auf einen Blick.",
              "App → Studio: Charaktere, Stimmbank, Inhalte, Storys, Wettbewerbe.",
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] font-semibold text-foreground/90 leading-relaxed">
                <span className="text-primary font-bold flex-shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-2xl border-2 border-primary/40 p-6 flex items-start gap-3">
          <Github className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
          <div>
            <p className="font-display text-xl text-foreground mb-1">Wenn du etwas anbauen willst</p>
            <p className="text-[15px] font-semibold text-muted-foreground leading-relaxed">
              Sag einfach in einem Satz, was du willst — ich baue es ein. Für fremde Dienste brauche ich
              keine Zugangsdaten von dir: entweder gibt es eine offizielle Verbindung, oder du hinterlegst
              den Schlüssel selbst im Dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}