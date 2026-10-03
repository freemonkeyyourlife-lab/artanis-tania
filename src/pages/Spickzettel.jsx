import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { NotebookPen, Ruler, Layers, Film, BookOpen, UserSquare, Flame, Mic, Ban } from "lucide-react";
import {
  LENGTH_RULES,
  MODEL_PICKS,
  FILM_NOTE,
  GLOSSARY,
  REFERENCE_STEPS,
  EXPLICIT_NOTES,
  VOICE_STEPS,
  LIMITS,
} from "@/lib/spickzettel";

// Der Spickzettel: alles zum Nachschlagen an einer Stelle — Prompt-Länge,
// Modellwahl, Begriffe, Referenzbilder, Stimmen. Nur für den Besitzer.

function Card({ icon: Icon, title, intro, children }) {
  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </span>
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
      </div>
      {intro && <p className="text-[15px] font-semibold text-muted-foreground mb-4">{intro}</p>}
      {children}
    </div>
  );
}

function Bullets({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] font-semibold text-foreground/90 leading-relaxed">
          <span className="text-primary font-bold flex-shrink-0">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Spickzettel() {
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
        <p className="text-[15px] font-semibold text-muted-foreground mt-2">Den Spickzettel sieht nur der Admin.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-3">
          <NotebookPen className="w-8 h-8 text-primary" /> Spickzettel
        </h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-4xl leading-relaxed">
          Zum Nachschlagen, wenn du vor dem Prompt-Feld sitzt: wie lang, welches Modell, welches Wort bedeutet was.
          Alles auf einer Seite — damit du nichts suchen musst.
        </p>
      </div>

      <div className="space-y-5">
        <Card
          icon={Ruler}
          title="Wie lang darf ein Prompt sein?"
          intro="Kurz gesagt: kurz. Ein Prompt ist keine Beschreibung, sondern eine Anweisung."
        >
          <Bullets items={LENGTH_RULES} />
        </Card>

        <Card
          icon={Layers}
          title="Welches Modell wofür?"
          intro="Du musst nicht alle kennen. Eine Handvoll deckt alles ab."
        >
          <div className="space-y-3">
            {MODEL_PICKS.map((m) => (
              <div key={m.task} className="rounded-xl bg-background border border-border p-4">
                <p className="text-[15px] font-bold text-foreground">{m.task}</p>
                <p className="text-[14px] font-bold text-primary mt-1">{m.models}</p>
                <p className="text-[13px] font-semibold text-muted-foreground mt-1">{m.why}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card icon={Film} title="Film oder fotorealistisch?">
          <div className="grid sm:grid-cols-2 gap-3">
            {[FILM_NOTE.photo, FILM_NOTE.film].map((n) => (
              <div key={n.title} className="rounded-xl bg-background border border-border p-4">
                <p className="text-[15px] font-bold text-primary">{n.title}</p>
                <p className="text-[13px] font-semibold text-muted-foreground mt-1 leading-relaxed">{n.text}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card
          icon={BookOpen}
          title="Wörter, die etwas bewirken"
          intro="Diese Brocken kann die Maschine lesen. Deine Gefühle kann sie nicht lesen — nur das hier."
        >
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            {GLOSSARY.map((g) => (
              <div key={g.term} className="flex gap-3">
                <span className="text-[13px] font-bold text-primary w-40 flex-shrink-0">{g.term}</span>
                <span className="text-[13px] font-semibold text-foreground/90 leading-relaxed">{g.meaning}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          icon={UserSquare}
          title="Dieselbe Person nochmal"
          intro="Der Weg zum Wiedererkennungswert — damit sie nicht bei jedem Bild anders aussieht."
        >
          <ol className="space-y-3">
            {REFERENCE_STEPS.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-[13px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[15px] font-semibold text-foreground/90 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          <Link
            to="/studio"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
          >
            Ins Studio
          </Link>
        </Card>

        <Card
          icon={Flame}
          title="Explizit — der ehrliche Stand"
          intro="Damit du nicht suchst, was es nicht gibt."
        >
          <Bullets items={EXPLICIT_NOTES} />
        </Card>

        <Card icon={Mic} title="Stimmen zu einer Szene">
          <Bullets items={VOICE_STEPS} />
          <Link
            to="/erzaehler"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
          >
            Zur Erzählerin
          </Link>
        </Card>

        <Card icon={Ban} title="Was nicht geht" intro="Damit keine Zeit in Sackgassen läuft.">
          <Bullets items={LIMITS} />
        </Card>
      </div>
    </div>
  );
}