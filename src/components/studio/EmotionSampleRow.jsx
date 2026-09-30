import React from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, Mic, Play, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";

// Eine Zeile pro Stimmung: den Satz vorlesen, aufnehmen, fertig.
export default function EmotionSampleRow({ emotion, sample, onRecorded, onRemove }) {
  const { recording, busy, toggle } = useVoiceRecorder(onRecorded);

  const play = async () => {
    const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: sample.fileUri, expires_in: 600 });
    if (res?.signed_url) new Audio(res.signed_url).play();
  };

  return (
    <div className={cn("rounded-2xl border p-3", sample ? "border-emerald-600/40 bg-emerald-600/5" : "border-border bg-elevated")}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[190px]">
          <p className="text-sm font-bold text-foreground">
            {emotion.label}
            <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">{emotion.hint}</span>
          </p>
          <p className="text-[11px] text-muted-foreground italic mt-0.5">„{emotion.prompt}“</p>
        </div>

        <button
          type="button"
          onClick={() => toggle(`${emotion.id.toLowerCase()}.webm`)}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors disabled:opacity-50",
            recording ? "bg-red-500 text-white animate-pulse" : sample ? "bg-elevated border border-border text-foreground hover:border-primary/50" : "bg-primary text-primary-foreground"
          )}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : recording ? <Square className="w-3.5 h-3.5" /> : sample ? <Check className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          {busy ? "Lädt …" : recording ? "Stopp" : sample ? "Neu aufnehmen" : "Aufnehmen"}
        </button>

        {sample && (
          <>
            <button type="button" onClick={play} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-elevated border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Play className="w-3.5 h-3.5" /> Hören
            </button>
            <button type="button" onClick={onRemove} title="Aufnahme wegwerfen" className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}