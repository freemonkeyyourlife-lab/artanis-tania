import React from "react";
import { Link } from "react-router-dom";
import { Send, MessageSquare, Power, RefreshCw, ArrowRight } from "lucide-react";

const STEPS = [
  {
    icon: Power,
    title: "1 · Empfang einschalten — einmalig",
    text: "Besitzer-Konsole → Kanäle → Telegram. Dort steht, ob dein Bot verbunden ist, und dort ist der Schalter „Empfang einschalten“. Erst wenn der an ist, darf die App Nachrichten empfangen.",
  },
  {
    icon: Send,
    title: "2 · Der Gast schreibt deinem Bot",
    text: "Nicht dir — deinem Bot. Er sucht ihn in Telegram unter dem Namen, den du bei @BotFather vergeben hast, und schreibt einfach „Hallo“. Diese Nachricht landet automatisch hier links in der Liste.",
  },
  {
    icon: MessageSquare,
    title: "3 · Du antwortest hier",
    text: "Chat links anklicken, Antwort tippen — fertig. Sie geht von allein zurück in denselben Telegram-Chat. Du musst nichts verknüpfen, nichts kopieren und nichts einstellen.",
  },
];

// Damit die leere Seite nicht ratlos macht: genau sagen, wer wem schreibt.
export default function LeitstandEmpty({ onReload }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <h2 className="font-display text-2xl text-foreground mb-1">Hier ist es noch leer</h2>
      <p className="text-[15px] font-semibold text-muted-foreground mb-6 max-w-2xl leading-relaxed">
        Das ist normal. Der Leitstand füllt sich erst, wenn jemand deinem Bot geschrieben hat.
        Schreibt dir jemand, erscheint er hier automatisch — du musst nichts suchen.
      </p>

      <div className="space-y-4 max-w-2xl">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="glass rounded-2xl border-2 border-border p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </span>
                <p className="font-display text-lg text-foreground">{s.title}</p>
              </div>
              <p className="text-[15px] font-semibold text-foreground/90 leading-relaxed">{s.text}</p>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-2xl border-2 border-primary/40 p-5 mt-4 max-w-2xl">
        <p className="font-display text-lg text-foreground mb-1">So testest du es selbst</p>
        <p className="text-[15px] font-semibold text-foreground/90 leading-relaxed">
          Schreib deinem eigenen Bot in Telegram „Hallo“. Dann tauchst du hier links als Chat auf —
          und kannst von hier aus antworten, so wie es später bei deinen Gästen läuft.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <Link
          to="/owner"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss"
        >
          <ArrowRight className="w-4 h-4" /> Zu den Kanälen
        </Link>
        <button
          onClick={onReload}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground"
        >
          <RefreshCw className="w-4 h-4" /> Neu laden
        </button>
      </div>
    </div>
  );
}