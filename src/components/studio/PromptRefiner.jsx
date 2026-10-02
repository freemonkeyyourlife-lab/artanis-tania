import React, { useState } from "react";
import { Check, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { sharpenPrompt } from "@/lib/promptSharpen";
import { inputCls, labelCls, chipCls, btnCls, btnAccentCls } from "@/lib/narratorUi";

// Sprechen, schreiben lassen, nachjustieren: erst wird aus dem Gesagten ein
// fertiger Prompt, dann fragt er nach — bis es genau das ist, was du willst.
export default function PromptRefiner({ value, onChange, target = "BILD", style = "FOTO", character = null, preset = null }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [note, setNote] = useState("");

  const run = async (again) => {
    const source = (draft || value || "").trim();
    if (!source) return;
    setBusy(true);
    try {
      const res = await sharpenPrompt({
        prompt: source,
        previous: again ? draft : "",
        target,
        style,
        character,
        preset,
        answers: again ? answers : [],
        note: again ? note : "",
      });
      if (res.prompt) setDraft(res.prompt);
      setQuestions(res.questions);
      setAnswers([]);
      setNote("");
      setOpen(true);
    } catch (e) {
      console.error(e);
      toast({ title: "Der Prompt kam nicht durch", description: "Versuch es noch einmal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggle = (option) =>
    setAnswers((p) => (p.includes(option) ? p.filter((x) => x !== option) : [...p, option]));

  const accept = () => {
    if (!draft.trim()) return;
    onChange(draft.trim());
    setOpen(false);
    setDraft("");
    setQuestions([]);
    toast({ title: "Prompt übernommen" });
  };

  const drop = () => {
    setOpen(false);
    setDraft("");
    setQuestions([]);
    setAnswers([]);
    setNote("");
  };

  if (!open) {
    return (
      <button
        onClick={() => run(false)}
        disabled={busy || !(value || "").trim()}
        className={cn(btnCls, "w-full justify-center")}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
        {busy ? "Wird geschrieben …" : "In einen perfekten Prompt umschreiben"}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-background p-3 space-y-3">
      <label className={labelCls}>Dein fertiger Prompt</label>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={6}
        className={cn(inputCls, "resize-none")}
      />

      {questions.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[13px] font-bold text-foreground">Ist es das? Sonst sag mir noch:</p>
          {questions.map((q, i) => (
            <div key={i}>
              <p className="text-[12px] font-semibold text-muted-foreground mb-1">{q.question}</p>
              <div className="flex flex-wrap gap-1.5">
                {(q.options || []).map((o) => (
                  <button key={o} onClick={() => toggle(o)} className={chipCls(answers.includes(o))}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Oder in eigenen Worten: was soll schärfer, genauer, anders sein?"
        className={cn(inputCls, "resize-none")}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <button onClick={() => run(true)} disabled={busy} className={btnAccentCls}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Nachschärfen
        </button>
        <button onClick={accept} disabled={!draft.trim()} className={btnCls}>
          <Check className="w-3.5 h-3.5" /> Übernehmen
        </button>
        <button onClick={drop} className={btnCls}>
          <X className="w-3.5 h-3.5" /> Verwerfen
        </button>
      </div>
    </div>
  );
}