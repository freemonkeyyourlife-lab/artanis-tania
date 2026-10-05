import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import VoiceInput from "@/components/VoiceInput";
import { Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_KINDS, buildCodePrompt, titleFromText, logLine, STATUS } from "@/lib/logbuch";

// Der Chat im Logbuch: Auftrag sprechen oder tippen, Prompt erzeugen, freigeben.
// Erst die Freigabe schiebt ihn in die In-Arbeit-Liste.
export default function LogbuchComposer({ onCreated }) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState("MODUL");
  const [urgency, setUrgency] = useState(3);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const generate = () => {
    if (!text.trim()) return;
    setPrompt(buildCodePrompt({ text, kind }));
  };

  const approve = async () => {
    const body = prompt || buildCodePrompt({ text, kind });
    if (!body.trim()) return;
    setBusy(true);
    try {
      const created = await base44.entities.BuildTask.create({
        title: titleFromText(text),
        description: text.trim(),
        prompt: body,
        kind,
        urgency,
        status: STATUS.IN_ARBEIT,
        source: "GODMODE",
        progress: [logLine("Freigegeben und in Arbeit gesetzt.")],
      });
      setText("");
      setPrompt("");
      onCreated?.(created);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="font-heading">Auftrag an den Bau-Agenten</div>
      <div className="text-xs text-muted-foreground">
        Sprechen oder tippen. Der Originaltext bleibt wörtlich im Prompt erhalten.
      </div>

      <div className="relative mt-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Was soll gebaut werden?"
          className="pr-14"
        />
        <VoiceInput
          onResult={(t) => setText((cur) => [cur, t].filter(Boolean).join(" "))}
          className="absolute bottom-2 right-2"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TASK_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              kind === k.id ? "border-primary text-primary" : "border-border text-muted-foreground"
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Dringlichkeit</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setUrgency(n)}
            className={cn(
              "h-7 w-7 rounded-full border text-xs font-bold",
              urgency === n ? "border-primary text-primary" : "border-border text-muted-foreground"
            )}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={generate} disabled={!text.trim()}>
          <Sparkles className="mr-2 h-4 w-4" /> Prompt erzeugen
        </Button>
        <Button onClick={approve} disabled={busy || !text.trim()}>
          <Send className="mr-2 h-4 w-4" /> Freigeben &amp; Senden
        </Button>
      </div>

      {prompt && (
        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs">
          {prompt}
        </pre>
      )}
    </div>
  );
}