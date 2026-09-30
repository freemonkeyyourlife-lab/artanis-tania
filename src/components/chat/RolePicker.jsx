import React, { useEffect, useState } from "react";
import { Clapperboard, User, Drama } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiCast } from "@/lib/chatRole";
import PersonChip from "@/components/chat/PersonChip";

const MODES = [
  { id: "ME", icon: User, label: "Ich bin ich", hint: "Du bist selbst in der Szene — die Figuren reden mit dir." },
  { id: "DIRECTOR", icon: Clapperboard, label: "Regie", hint: "Du schaust zu, gibst Anweisungen und bestimmst das Tempo. Die Figuren spielen miteinander." },
  { id: "PLAY", icon: Drama, label: "Ich spiele …", hint: "Du übernimmst eine oder mehrere Figuren. Die KI spielt nur die anderen." },
];

// Vor dem Chat klären: wer ist dabei, und wer bin ich darin.
export default function RolePicker({ creators, mainId, extras, onToggleExtra, value, onDone, doneLabel = "Los geht's" }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const roomIds = [mainId, ...extras.map((c) => c.id)];
  const others = creators.filter((c) => c.id !== mainId);
  const left = aiCast(roomIds, draft);
  const invalid = draft.mode === "PLAY" && (!draft.playing.length || left.length === 0);

  const togglePlay = (id) => {
    const playing = draft.playing.includes(id) ? draft.playing.filter((x) => x !== id) : [...draft.playing, id];
    setDraft({ ...draft, playing, current: playing.includes(draft.current) ? draft.current : playing[0] || null });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-5 space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Wer ist dabei</p>
        <div className="flex flex-wrap gap-2">
          <PersonChip creator={creators.find((c) => c.id === mainId)} active locked />
          {others.map((c) => (
            <PersonChip key={c.id} creator={c} active={extras.some((x) => x.id === c.id)} onClick={() => onToggleExtra(c)} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Wer bist du</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setDraft({ ...draft, mode: m.id })}
              className={cn("p-3 rounded-2xl border-2 text-left transition-colors", draft.mode === m.id ? "border-primary bg-primary/10" : "border-border hover:bg-elevated")}
            >
              <m.icon className="w-5 h-5 text-primary mb-1.5" />
              <p className="text-sm font-bold text-foreground">{m.label}</p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{m.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {draft.mode === "PLAY" && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Welche Figur(en) spielst du</p>
          <div className="flex flex-wrap gap-2">
            {creators.map((c) => (
              <PersonChip key={c.id} creator={c} active={draft.playing.includes(c.id)} onClick={() => togglePlay(c.id)} />
            ))}
          </div>
          {left.length === 0 && draft.playing.length > 0 && (
            <p className="text-xs font-semibold text-destructive mt-2">Niemand spielt mit sich selbst — hol noch jemanden dazu oder gib eine Figur frei.</p>
          )}
        </div>
      )}

      <button
        onClick={() => onDone(draft)}
        disabled={invalid}
        className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
      >
        {doneLabel}
      </button>
    </div>
  );
}