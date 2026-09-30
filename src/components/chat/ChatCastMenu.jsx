import React from "react";
import { Users, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";

// Ein Klick je Figur: redet mit, du spielst sie, sie hört nur zu, oder sie ist pausiert.
const STATES = [
  { id: "AI", label: "Redet mit", hint: "Ist in der Szene und redet — die KI spielt sie." },
  { id: "ME", label: "Ich spiele", hint: "Du übernimmst diese Figur selbst." },
  { id: "MUTE", label: "Hört zu", hint: "Ist dabei, sagt aber nichts." },
  { id: "OFF", label: "Pausiert", hint: "Ist gerade nicht in der Szene." },
];

// Ein Klick je Figur: spielt mit, du spielst sie, oder sie hört nur zu.
export default function ChatCastMenu({ creators, mainId, stateOf, onChange, count }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          title="Wer spielt mit, wen spielst du, wer hört nur zu"
          className="h-8 px-2.5 rounded-full bg-elevated text-muted-foreground flex items-center gap-1.5 flex-shrink-0 hover:text-foreground transition-colors"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline text-[11px] font-semibold">Rollen</span>
          {count > 0 && <span className="text-[10px] font-bold text-primary">{count}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-bold text-foreground">Wer spielt mit</p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Tippe je Figur an, was sie gerade macht: mitreden, du spielst sie, nur zuhören oder pausiert.
          </p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1.5">
          {creators.map((c) => {
            const st = stateOf(c.id);
            return (
              <div key={c.id} className={cn("flex items-center gap-2.5 p-2 rounded-xl", st === "OFF" ? "bg-transparent" : "bg-elevated/60")}>
                {c.avatar ? (
                  <Image src={c.avatar} fittingType="fit" className="w-9 h-9 rounded-full flex-shrink-0 bg-elevated" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center font-display text-primary text-xs flex-shrink-0">{c.stageName[0]}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-bold truncate", st === "OFF" ? "text-muted-foreground" : "text-foreground")}>
                    {c.stageName}
                    {c.id === mainId && <span className="text-[10px] font-semibold text-muted-foreground"> · diese Szene</span>}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {STATES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onChange(c.id, s.id)}
                        title={s.hint}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors",
                          st === s.id ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {st === s.id && <Check className="w-3 h-3 inline mr-0.5" />}{s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}