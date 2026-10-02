import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import BotTrainingControls from "@/components/studio/BotTrainingControls";
import BotTrainingChat from "@/components/studio/BotTrainingChat";
import { PERSONA_MODES } from "@/lib/personaPrompts";
import { PERSONAS, emptyTraining, personaById, trainingBlock } from "@/lib/botTraining";

const asArray = (res) => (Array.isArray(res) ? res : res?.items || []);

// Erst einstellen, dann ausprobieren: links die Persönlichkeit, rechts sofort
// die Antwort. Gespeichert wird pro Bot — jeder behält seinen eigenen Ton.
export default function BotTrainingSandbox() {
  const { toast } = useToast();
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);
  const [training, setTraining] = useState(emptyTraining());
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);

  const persona = personaById(personaId);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setMessages([]);
    base44.entities.BotTraining.filter({ persona: personaId }, { limit: 1 })
      .then((res) => {
        if (!live) return;
        const found = asArray(res)[0];
        setRecord(found || null);
        setTraining(found ? { ...emptyTraining(), ...found } : emptyTraining());
      })
      .catch(() => live && setTraining(emptyTraining()))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [personaId]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        persona: personaId,
        moods: training.moods || [],
        explicit: training.explicit || "",
        style: training.style || "",
        tone: training.tone,
        length: training.length,
        instruction: training.instruction || "",
        active: true,
      };
      if (record?.id) {
        await base44.entities.BotTraining.update(record.id, payload);
      } else {
        const created = await base44.entities.BotTraining.create(payload);
        setRecord(created);
      }
      toast({ title: `Training für ${persona.label} gespeichert` });
    } catch (e) {
      toast({ title: "Speichern hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const send = async (text) => {
    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setBusy(true);
    try {
      const convo = next
        .map((m) => `${m.role === "user" ? "User" : persona.label}: ${m.text}`)
        .join("\n");
      const prompt = `${PERSONA_MODES[persona.mode].prompt}

${trainingBlock(training)}

═══ CONVERSATION SO FAR ═══
${convo}
═══ END ═══

Reply now, in character, as ${persona.label}. Only the reply itself — no preamble, no labels, no explanations.`;
      const answer = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages([...next, { role: "bot", text: String(answer || "").trim() || "…" }]);
    } catch (e) {
      toast({ title: "Antwort hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <p className="font-display text-2xl text-foreground mb-1">Bot-Training</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-3xl">
        Stell Persönlichkeit, Tonfall und Grenze ein — und schreib direkt darunter. Du siehst sofort, wie sich jede
        Änderung auf die Antwort auswirkt. Jeder Bot behält sein eigenes Training.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPersonaId(p.id)}
            className={cn(
              "px-5 py-2.5 rounded-full text-[15px] font-bold transition-colors",
              personaId === p.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border-2 border-border bg-card p-4">
            <p className="text-[15px] font-bold text-foreground mb-3">Persönlichkeit von {persona.label}</p>
            <BotTrainingControls value={training} onChange={setTraining} />
            <button
              onClick={save}
              disabled={saving}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Training speichern
            </button>
          </div>

          <BotTrainingChat
            personaLabel={persona.label}
            messages={messages}
            busy={busy}
            block={trainingBlock(training)}
            onSend={send}
            onReset={() => setMessages([])}
          />
        </div>
      )}
    </div>
  );
}