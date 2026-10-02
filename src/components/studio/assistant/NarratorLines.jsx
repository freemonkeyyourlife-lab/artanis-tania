import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Image } from "@/components/ui/image";

// Die Worte der Erzählerinnen — sie stehen immer da, auch ohne Ton.
export default function NarratorLines({ lines = [], people = [], speaking, onSpeak, onStop }) {
  if (!lines.length) return null;
  const two = people.length > 1;

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-4 h-4 text-primary" />
        <p className="text-[12px] font-bold uppercase tracking-wider text-primary">
          {two ? "Die Erzählerinnen" : "Die Erzählerin"}
        </p>
        <button
          onClick={() => (speaking ? onStop() : onSpeak())}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn text-[11px] font-bold text-foreground"
        >
          {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          {speaking ? "Verstummen" : "Hören"}
        </button>
      </div>

      <div className="space-y-3">
        {lines.map((line, i) => {
          const person = people[line.who] || people[0] || {};
          return (
            <div key={i} className="flex items-start gap-2.5">
              {two &&
                (person.avatar ? (
                  <Image src={person.avatar} fittingType="fill" className="w-8 h-8 rounded-full flex-shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-background flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-muted-foreground">
                    {(person.name || "?").slice(0, 1)}
                  </span>
                ))}
              <div className="min-w-0">
                {two && <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-0.5">{person.name}</p>}
                <p className="text-[15px] font-semibold text-foreground leading-relaxed italic">„{line.text}“</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}