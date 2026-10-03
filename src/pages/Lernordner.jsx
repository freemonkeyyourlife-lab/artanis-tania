import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { NotebookPen, Search } from "lucide-react";
import { LERN_TOPICS } from "@/lib/lernordner";
import LernTopic from "@/components/lern/LernTopic";
import { cn } from "@/lib/utils";

// Der Lern-Ordner: alles, was im Chat gefragt wurde, nach Themen sortiert —
// Frage oben, Antwort beim Aufklappen. Nur für den Besitzer.
export default function Lernordner() {
  const [me, setMe] = useState(undefined);
  const [query, setQuery] = useState("");
  const [only, setOnly] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  const topics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LERN_TOPICS.filter((t) => !only || t.key === only)
      .map((t) => ({
        topic: t,
        entries: t.entries.filter((e) => {
          if (!q) return true;
          const hay = [e.frage, e.antwort, ...(e.punkte || [])].join(" ").toLowerCase();
          return hay.includes(q);
        }),
      }))
      .filter((t) => t.entries.length > 0);
  }, [query, only]);

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
        <p className="text-[15px] font-semibold text-muted-foreground mt-2">Den Lern-Ordner sieht nur der Admin.</p>
      </div>
    );
  }

  const total = LERN_TOPICS.reduce((n, t) => n + t.entries.length, 0);

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-3">
          <NotebookPen className="w-8 h-8 text-primary" /> Lern-Ordner
        </h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-4xl leading-relaxed">
          {total} Fragen aus unseren Gesprächen, nach Themen sortiert. Tippe einen Begriff ein oder wähle ein Thema —
          dann klappe die Frage auf, die du brauchst.
        </p>
      </div>

      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen — z. B. Ankerbild, Space, Serie, LoRA"
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-background border-2 border-border text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setOnly(null)}
          className={cn(
            "px-4 py-2 rounded-full text-[13px] font-bold border-2 transition-colors",
            only === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:text-foreground"
          )}
        >
          Alle Themen
        </button>
        {LERN_TOPICS.map((t) => (
          <button
            key={t.key}
            onClick={() => setOnly(only === t.key ? null : t.key)}
            className={cn(
              "px-4 py-2 rounded-full text-[13px] font-bold border-2 transition-colors",
              only === t.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {t.title}
          </button>
        ))}
      </div>

      {topics.length === 0 ? (
        <div className="glass rounded-2xl border-2 border-border p-10 text-center">
          <p className="text-[15px] font-bold text-foreground">Dazu steht hier nichts.</p>
          <p className="text-[14px] font-semibold text-muted-foreground mt-2">
            Frag mich im Chat — dann trage ich es hier nach.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {topics.map(({ topic, entries }) => (
            <LernTopic key={topic.key} topic={topic} entries={entries} />
          ))}
        </div>
      )}
    </div>
  );
}