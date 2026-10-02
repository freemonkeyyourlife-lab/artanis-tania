import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Video, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { composeImagePrompt } from "@/lib/composeImagePrompt";
import { emptyDirection } from "@/lib/imageDirection";
import ImageDirectionPanel from "@/components/studio/ImageDirectionPanel";
import VoiceTextArea from "@/components/voice/VoiceTextArea";
import ModelStrengthNote from "@/components/studio/ModelStrengthNote";
import PromptRefiner from "@/components/studio/PromptRefiner";
import { characterFromNarrator } from "@/lib/promptSharpen";
import { STANDARD_VIDEO_STRENGTH } from "@/lib/modelStrengths";
import { labelCls, chipCls, btnCls, btnAccentCls } from "@/lib/narratorUi";

const LENGTHS = [4, 6, 8];

// Bewegtbild aus demselben Baukasten: derselbe Prompt, dieselbe Regie — nur
// dass sie sich darin regt. Was gut wird, bleibt bei ihr.
export default function NarratorVideoBlock({ narrator, onSaved }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [direction, setDirection] = useState(emptyDirection());
  const [seconds, setSeconds] = useState(6);
  const [vertical, setVertical] = useState(true);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [videos, setVideos] = useState(narrator?.videos || []);

  useEffect(() => {
    setVideos(narrator?.videos || []);
    setUrl("");
  }, [narrator?.id]);

  const buildPrompt = () => {
    const scene = [narrator?.appearance?.trim() ? `Her look: ${narrator.appearance.trim()}.` : "", prompt.trim()]
      .filter(Boolean)
      .join(" ");
    return composeImagePrompt({
      animated: narrator?.artStyle === "CARTOON",
      name: narrator?.name?.trim(),
      subject: narrator?.gender === "MAENNLICH" ? "man" : "woman",
      withRefs: !!(narrator?.avatar || (narrator?.referenceImages || []).length),
      prompt: scene,
      direction,
    });
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    setUrl("");
    try {
      const res = await base44.integrations.Core.GenerateVideo({
        prompt: buildPrompt(),
        duration: seconds,
        aspect_ratio: vertical ? "9:16" : "16:9",
      });
      setUrl(res.url);
    } catch (e) {
      toast({
        title: "Das Video kam nicht durch",
        description: "Bewegtbild dauert länger — versuch es nochmal.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const keep = async (target) => {
    const next = [target, ...videos].filter((v, i, a) => a.indexOf(v) === i).slice(0, 12);
    setVideos(next);
    const rec = await base44.entities.Narrator.update(narrator.id, { videos: next });
    onSaved?.(rec);
    toast({ title: "Bleibt bei ihr" });
  };

  const drop = async (target) => {
    const next = videos.filter((v) => v !== target);
    setVideos(next);
    const rec = await base44.entities.Narrator.update(narrator.id, { videos: next });
    onSaved?.(rec);
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-border bg-background px-3 py-2.5">
            <p className="text-[13px] font-bold text-foreground mb-0.5">Der eingebaute Filmer</p>
            <ModelStrengthNote chips={STANDARD_VIDEO_STRENGTH.chips} hint={STANDARD_VIDEO_STRENGTH.hint} />
          </div>

          <div>
            <label className={labelCls}>Was soll sich bewegen?</label>
            <VoiceTextArea
              value={prompt}
              onChange={setPrompt}
              rows={4}
              placeholder="Sie dreht sich zur Kamera, das Haar fällt, das Licht wandert über die Haut …"
            />
            <div className="mt-2">
              <PromptRefiner
                value={prompt}
                onChange={setPrompt}
                target="VIDEO"
                style={narrator?.artStyle === "CARTOON" ? "ANIMIERT" : "FOTO"}
                character={characterFromNarrator(narrator)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Länge</label>
            <div className="flex flex-wrap gap-1.5">
              {LENGTHS.map((s) => (
                <button key={s} onClick={() => setSeconds(s)} className={chipCls(seconds === s)}>
                  {s} Sekunden
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Bild</label>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setVertical(true)} className={chipCls(vertical)}>
                Hochkant
              </button>
              <button onClick={() => setVertical(false)} className={chipCls(!vertical)}>
                Quer
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ImageDirectionPanel
            value={direction}
            onChange={setDirection}
            title="Regie: Stil, Inhalt, Stimmung, Freizügigkeit, Klamotte"
          />

          <button
            onClick={generate}
            disabled={busy || !prompt.trim()}
            className={cn(btnAccentCls, "w-full justify-center py-3")}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {busy ? "Wird gefilmt …" : "Video erzeugen"}
          </button>

          <p className="text-[12px] font-semibold text-muted-foreground">
            Ein Video braucht etwa eine Minute. Sie erscheint darin so, wie du sie oben beschrieben hast.
          </p>
        </div>
      </div>

      {busy && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-[14px] font-semibold">Es wird gefilmt — das dauert einen Moment …</p>
        </div>
      )}

      {!busy && url && (
        <div className="rounded-xl border-2 border-border bg-elevated p-3 mt-5">
          <video src={url} controls playsInline className="w-full rounded-lg" />
          <div className="flex flex-wrap gap-1.5 mt-2">
            <a href={url} target="_blank" rel="noreferrer" download className={btnCls}>
              Herunterladen
            </a>
            <button onClick={() => keep(url)} className={btnAccentCls}>
              Bei ihr behalten
            </button>
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-5">
          <label className={labelCls}>Ihre Filme · {videos.length}</label>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {videos.map((v) => (
              <div key={v} className="rounded-xl border-2 border-border bg-background p-2">
                <video src={v} controls playsInline className="w-full rounded-lg" />
                <button
                  onClick={() => drop(v)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/15 text-destructive text-[11px] font-bold"
                >
                  <Trash2 className="w-3 h-3" /> Entfernen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}