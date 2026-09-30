import React from "react";
import { Check, SkipForward, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { visibleChapters, currentChapter } from "@/lib/tutorial";

// Alle Kapitel zum Anspringen — und zum Überspringen, was dich nicht interessiert.
export default function TutorialChapterMenu({ state, onJump, onSkipChapter, onOpenInterests }) {
  const list = visibleChapters(state);
  const active = currentChapter(state);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Kapitel</p>
        <button
          onClick={onOpenInterests}
          className="text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          Interessen ändern
        </button>
      </div>

      {list.map((chapter) => {
        const isActive = chapter.id === active.id;
        const isDone = chapter.steps.every((_, i) => state.done.includes(`${chapter.id}:${i}`));
        const isSkipped = state.skipped.includes(chapter.id);
        return (
          <div
            key={chapter.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 p-3 transition-colors",
              isActive ? "border-primary bg-primary/10" : "border-border"
            )}
          >
            <button onClick={() => onJump(chapter.id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
              <span className="text-xl flex-shrink-0">{chapter.icon}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-display text-[16px] text-foreground">
                  {chapter.title}
                  {isDone && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  {isSkipped && !isDone && <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />}
                </span>
                <span className="block text-[13px] font-semibold text-muted-foreground truncate">
                  {chapter.steps.length} Schritte · {chapter.subtitle}
                </span>
              </span>
            </button>
            {isActive ? (
              <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[12px] font-bold flex-shrink-0">
                läuft
              </span>
            ) : (
              <button
                onClick={() => onJump(chapter.id)}
                title="Hier einsteigen"
                className="w-9 h-9 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-primary transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            )}
            {!isDone && !isSkipped && (
              <button
                onClick={() => onSkipChapter(chapter.id)}
                title="Kapitel überspringen"
                className="w-9 h-9 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}