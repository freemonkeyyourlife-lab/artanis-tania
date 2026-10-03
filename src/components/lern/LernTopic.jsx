import React from "react";
import LernEntry from "@/components/lern/LernEntry";

// Ein Thema mit seinen Fragen und Antworten.
export default function LernTopic({ topic, entries }) {
  const Icon = topic.icon;

  return (
    <section id={topic.key} className="glass rounded-2xl border-2 border-border p-6 scroll-mt-28">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </span>
        <h2 className="font-display text-2xl text-foreground">{topic.title}</h2>
      </div>
      {topic.intro && <p className="text-[15px] font-semibold text-muted-foreground mb-4">{topic.intro}</p>}

      <div className="space-y-2">
        {entries.map((e) => (
          <LernEntry key={e.frage} {...e} />
        ))}
      </div>
    </section>
  );
}