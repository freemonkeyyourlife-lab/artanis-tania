import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowLeft, ArrowRight, Wand2, ListChecks, Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import AssistantImportStep from "@/components/studio/assistant/AssistantImportStep";
import AssistantCharacterStep from "@/components/studio/assistant/AssistantCharacterStep";
import AssistantImageStep from "@/components/studio/assistant/AssistantImageStep";
import AssistantModelStep from "@/components/studio/assistant/AssistantModelStep";
import AssistantBlockStep from "@/components/studio/assistant/AssistantBlockStep";
import AssistantVoiceStep from "@/components/studio/assistant/AssistantVoiceStep";
import AssistantPromptStep from "@/components/studio/assistant/AssistantPromptStep";
import AssistantMoodMode from "@/components/studio/assistant/AssistantMoodMode";
import AssistantWishMode from "@/components/studio/assistant/AssistantWishMode";

const MODES = [
  { id: "WISH", label: "Sag was du willst", icon: Sparkles },
  { id: "GUIDED", label: "Schritt für Schritt", icon: ListChecks },
  { id: "MOOD", label: "Stimmung", icon: Flame },
];

const STEPS = [
  { id: "import", label: "Import" },
  { id: "character", label: "Charakter" },
  { id: "images", label: "Bilder" },
  { id: "model", label: "Modell" },
  { id: "blocks", label: "Bausteine" },
  { id: "voice", label: "Stimme" },
  { id: "prompt", label: "Prompt" },
];

// Der Assistent führt einmal von vorne bis hinten: Charakter, Bilder, Modell,
// Bausteine, Stimme, Prompt. Jeder Schritt fragt — du entscheidest.
export default function AssistantWizard() {
  const [mode, setMode] = useState("WISH");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    creators: [],
    voices: [],
    imageModels: [],
    videoModels: [],
    textModels: [],
    blocks: [],
    experiences: [],
    contents: [],
  });
  const [creator, setCreator] = useState(null);
  const [model, setModel] = useState(null);
  const [pickedBlocks, setPickedBlocks] = useState([]);
  const [voice, setVoice] = useState(null);

  const load = async () => {
    try {
      const [creators, voices, imageModels, videoModels, textModels, blocks, experiences, contents] = await Promise.all([
        base44.entities.Creator.list("-created_date"),
        base44.entities.Voice.list("-created_date"),
        base44.entities.ImageModel.list(),
        base44.entities.VideoModel.list(),
        base44.entities.TextModel.list(),
        base44.entities.BuildBlock.list("-created_date"),
        base44.entities.Experience.list("-created_date"),
        base44.entities.Content.list("-created_date"),
      ]);
      setData({ creators, voices, imageModels, videoModels, textModels, blocks, experiences, contents });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const ready = [true, !!creator, true, !!model, true, true, true][step];
  const last = step === STEPS.length - 1;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="font-display text-2xl text-foreground inline-flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" /> Assistent
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-colors",
                mode === m.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
              )}
            >
              <m.icon className="w-3.5 h-3.5" /> {m.label}
            </button>
          ))}
        </div>
        {mode === "GUIDED" && (
          <div className="flex flex-wrap gap-1.5 w-full">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors",
                  i === step ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
                )}
              >
                {i + 1}. {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === "WISH" ? (
        <AssistantWishMode creators={data.creators} experiences={data.experiences} contents={data.contents} onChanged={load} />
      ) : mode === "MOOD" ? (
        <AssistantMoodMode creators={data.creators} voices={data.voices} onChanged={load} />
      ) : (
        <>
      {step === 0 && (
        <AssistantImportStep
          onImported={(c) => {
            setCreator(c);
            setStep(2);
            load();
          }}
        />
      )}
      {step === 1 && <AssistantCharacterStep creators={data.creators} value={creator} onChange={setCreator} />}
      {step === 2 && <AssistantImageStep creators={data.creators} onReloaded={load} />}
      {step === 3 && (
        <AssistantModelStep
          creator={creator}
          imageModels={data.imageModels}
          videoModels={data.videoModels}
          textModels={data.textModels}
          value={model}
          onChange={setModel}
        />
      )}
      {step === 4 && (
        <AssistantBlockStep blocks={data.blocks} creator={creator} value={pickedBlocks} onChange={setPickedBlocks} />
      )}
      {step === 5 && (
        <AssistantVoiceStep
          voices={data.voices}
          creators={data.creators}
          creator={creator}
          value={voice}
          onChange={setVoice}
          onChanged={load}
        />
      )}
      {step === 6 && (
        <AssistantPromptStep creator={creator} model={model} blocks={pickedBlocks} voice={voice} />
      )}

      <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-border">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-muted-foreground disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück
        </button>
        {!last && (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!ready}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-50"
          >
            Weiter <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
        </>
      )}
    </div>
  );
}