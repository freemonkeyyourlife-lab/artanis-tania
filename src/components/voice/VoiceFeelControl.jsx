import React from "react";
import { base44 } from "@/api/base44Client";
import { Mic } from "lucide-react";
import { assignVoiceToCreator } from "@/lib/voiceAssign";
import VoiceDescribeBox from "@/components/voice/VoiceDescribeBox";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Antippen — die Stimme wird sofort tiefer, höher, schneller oder langsamer.
const FEEL = [
  { label: "tiefer", patch: (v) => ({ depth: clamp((v.depth ?? 0) - 8, -40, 20) }) },
  { label: "höher", patch: (v) => ({ depth: clamp((v.depth ?? 0) + 8, -40, 20) }) },
  { label: "langsamer", patch: (v) => ({ speed: clamp((v.speed ?? 1) - 0.08, 0.7, 1.4) }) },
  { label: "schneller", patch: (v) => ({ speed: clamp((v.speed ?? 1) + 0.08, 0.7, 1.4) }) },
];

// Eine Figur ansprechen: welche Stimme sie spricht — und wie sie klingt.
// Alles per Gefühl: antippen, einsprechen, anhören. Gilt sofort.
export default function VoiceFeelControl({ creator, voice, voices = [], creators = [], onChanged }) {
  const pick = async (voiceId) => {
    const list = creators?.length ? creators : await base44.entities.Creator.list();
    await assignVoiceToCreator(creator.id, voiceId, list);
    onChanged?.();
  };

  const applyVoice = async (patch) => {
    if (!voice) return;
    await base44.entities.Voice.update(voice.id, patch);
    onChanged?.();
  };

  return (
    <div className="rounded-2xl border border-border bg-background p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground flex-shrink-0">
          <Mic className="w-3.5 h-3.5 text-primary" /> Stimme
        </span>
        <select
          value={voice?.id || ""}
          onChange={(e) => pick(e.target.value)}
          title="Welche Stimme diese Figur spricht"
          className="flex-1 min-w-0 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-semibold text-foreground focus:outline-none focus:border-primary/50"
        >
          <option value="">Keine Stimme</option>
          {voices.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        {voice && <VoicePreviewButton profile={voice} live />}
      </div>

      {voice ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {FEEL.map((f) => (
              <button
                key={f.label}
                onClick={() => applyVoice(f.patch(voice))}
                className="px-3 py-1.5 rounded-full bg-elevated border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {f.label}
              </button>
            ))}
          </div>
          <VoiceDescribeBox voice={voice} onApply={applyVoice} />
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Wähle oben eine Stimme — dann kannst du sie mit Worten und Gefühl einstellen.</p>
      )}
    </div>
  );
}