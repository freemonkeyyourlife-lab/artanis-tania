import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BANANA_MODELS, BANANA_PARAMS, BANANA_WATCH, BANANA_RECIPE, BANANA_MODULES } from "@/lib/bananaModules";
import BananaPromptCard from "@/components/banana/BananaPromptCard";

// Nano Banana: welches Modell, wie ein Prompt aufgebaut ist, was schiefgeht —
// und die Module zum Kopieren.
export default function BananaStudio() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      <Link
        to="/studio"
        className="inline-flex items-center gap-2 text-[13px] font-bold text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Zurück ins Studio
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="text-3xl lg:text-4xl font-display text-gradient-warm">Nano Banana</h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-3xl">
          Google-Bildmodell über fal.ai. Stark bei Charakter-Treue, Kleidung, Orten und Schrift im Bild.
          Unten stehen fertige Module — Text kopieren, die GROSSBUCHSTABEN in Klammern ersetzen, fertig.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-display text-foreground mb-3">Welches Modell?</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {BANANA_MODELS.map((m) => (
            <div key={m.id} className="rounded-2xl glass border-2 border-border p-4">
              <p className="text-[15px] font-display text-foreground">{m.label}</p>
              <p className="text-[12px] font-mono text-primary mt-1 break-all">{m.id}</p>
              <p className="text-[13px] font-semibold text-foreground/85 mt-2">{m.what}</p>
              <p className="text-[13px] font-semibold text-muted-foreground mt-1">Nimm es, wenn: {m.take}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-display text-foreground mb-3">So ist ein Prompt aufgebaut</h2>
          <div className="rounded-2xl glass border-2 border-border p-4 space-y-2.5">
            {BANANA_RECIPE.map((r) => (
              <div key={r.step} className="flex items-start gap-3">
                <span className="text-[13px] font-bold text-primary whitespace-nowrap min-w-[110px]">{r.step}</span>
                <span className="text-[13px] font-semibold text-foreground/85">{r.text}</span>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-display text-foreground mt-6 mb-3">Die Schalter</h2>
          <div className="rounded-2xl glass border-2 border-border p-4 space-y-2">
            {BANANA_PARAMS.map((p) => (
              <div key={p.name} className="flex items-start gap-3">
                <span className="text-[12px] font-mono text-primary whitespace-nowrap min-w-[150px]">{p.name}</span>
                <span className="text-[13px] font-semibold text-foreground/85">{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-display text-foreground mb-3">Was du beachten musst</h2>
          <div className="rounded-2xl glass border-2 border-primary/40 p-4 space-y-2.5">
            {BANANA_WATCH.map((w) => (
              <p key={w} className="text-[13px] font-semibold text-foreground/90 flex gap-2">
                <span className="text-primary">•</span>
                <span>{w}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-display text-foreground mb-3">Module zum Kopieren</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {BANANA_MODULES.map((m) => (
            <BananaPromptCard key={m.id} module={m} />
          ))}
        </div>
      </section>
    </div>
  );
}