import React, { useRef, useState } from "react";
import { ImagePlus, Eye, EyeOff, Loader2, X, FlaskConical } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import PromptGenerator from "@/components/studio/PromptGenerator";
import { presetById } from "@/lib/modelPrompts";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const IS_VIDEO = /\.(mp4|webm|mov|m4v)(\?|$)/i;

// Die Sandbox im Studio: Prompt schreiben, Bild oder Clip dazulegen — und in
// derselben Sekunde sehen, wie das fertige Stück bei einem normalen Nutzer ankommt.
export default function PromptSandbox() {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [result, setResult] = useState(null);
  const [idea, setIdea] = useState("");
  const [presetId, setPresetId] = useState("PONY");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState("");
  const [asUser, setAsUser] = useState(true);
  const [uploading, setUploading] = useState(false);

  const take = (written, meta) => {
    setResult(written);
    setIdea(meta.rough);
    setPresetId(meta.presetId);
    if (!title.trim()) setTitle(meta.rough.split(/[.,\n]/)[0].slice(0, 60).trim());
    if (!caption.trim()) setCaption(meta.rough);
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const up = await base44.integrations.Core.UploadPublicFile({ file });
      setMedia(up.file_url);
    } catch (e) {
      console.error(e);
      toast({ title: "Datei kam nicht an", description: "Versuch es noch einmal.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const preset = presetById(presetId);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="font-display text-2xl text-foreground flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" /> Prompt-Sandbox
          </p>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-2xl mt-1 leading-relaxed">
            Erst hier ausprobieren, dann auf die Plattform. Schreib den Prompt, leg das Ergebnisbild dazu — rechts
            siehst du sofort, wie es bei einem normalen Nutzer ankommt.
          </p>
        </div>
        <button
          onClick={() => setAsUser((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors",
            asUser ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground"
          )}
        >
          {asUser ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {asUser ? "Als Nutzer angesehen" : "Bearbeiten"}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <div>
          <PromptGenerator onResult={take} />

          {result && (
            <div className="glass rounded-2xl border border-border p-5 mt-5">
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Was gerade getestet wird
              </p>
              <p className="text-[13px] font-semibold text-primary mb-3">
                {preset.label} · {preset.mode}
              </p>
              <p className="text-[13px] font-semibold text-muted-foreground">
                Aus deiner Idee ist ein Prompt in der Sprache dieses Modells geworden. Steht er so, wie du ihn willst,
                kopier ihn oben ins externe Studio — und häng das Ergebnisbild rechts an.
              </p>
            </div>
          )}
        </div>

        <div className="glass rounded-2xl border-2 border-border p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              Live-Vorschau
            </p>
            {asUser && (
              <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-bold uppercase tracking-wider">
                Ansicht: Nutzer
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="relative aspect-[3/4] bg-elevated">
              {media ? (
                IS_VIDEO.test(media) ? (
                  <video src={media} controls playsInline className="w-full h-full object-cover" />
                ) : (
                  <Image src={media} fittingType="fill" className="w-full h-full" />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  {uploading ? (
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  ) : (
                    <>
                      <ImagePlus className="w-7 h-7" />
                      <span className="text-[13px] font-semibold">Noch kein Bild dazu</span>
                    </>
                  )}
                </div>
              )}
              {media && !asUser && (
                <button
                  onClick={() => setMedia("")}
                  title="Bild wieder wegnehmen"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full glass-strong text-foreground flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-4">
              <p className="text-[16px] font-bold text-foreground truncate">
                {title || "Ohne Titel"}
              </p>
              <p className="text-[13px] font-semibold text-muted-foreground mt-1 line-clamp-3">
                {caption || "Noch keine Beschreibung."}
              </p>
            </div>
          </div>

          {!asUser && (
            <div className="mt-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Titel</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Wie soll das Stück heißen?"
                  className="mt-1.5 w-full h-11 rounded-xl bg-background border border-border px-3 text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Beschreibung für Nutzer
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  placeholder="Ein paar Worte, die ein Nutzer unter dem Bild liest."
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-background border border-border text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => upload(e.target.files?.[0])}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  Bild oder Clip wählen
                </button>
                <input
                  value={media}
                  onChange={(e) => setMedia(e.target.value)}
                  placeholder="… oder einen Link einfügen"
                  className="flex-1 min-w-[200px] h-11 rounded-full bg-background border border-border px-4 text-[14px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              {result && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Deine Idee
                  </p>
                  <p className="text-[13px] font-semibold text-muted-foreground whitespace-pre-wrap">{idea}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}