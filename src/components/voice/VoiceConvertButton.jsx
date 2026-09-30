import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Square, Loader2, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";
import { Image } from "@/components/ui/image";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// Du sprichst — gesendet wird es mit der Stimme des gewählten Charakters.
// Aufgenommen wird mit deinem Mikrofon, umgewandelt auf dem Server.
export default function VoiceConvertButton({ creators = [], creator = null, onConverted, disabled, className }) {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState([]);
  const [targetId, setTargetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.entities.Voice.list().then(setVoices).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) setTargetId((prev) => prev || creator?.id || "");
  }, [open, creator?.id]);

  // Nur Charaktere, denen schon eine Stimme zugeordnet ist — sonst gäbe es nichts umzuwandeln.
  const ready = creators.filter((c) => c.voiceProfileId);
  const target = ready.find((c) => c.id === targetId) || null;

  const record = useVoiceRecorder(async (fileUri) => {
    const profile = voices.find((v) => v.id === target?.voiceProfileId) || null;
    if (!profile) {
      setError("Für diesen Charakter ist keine Stimme hinterlegt.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("voiceConvert", {
        fileUri,
        voiceId: profile.externalVoiceId || "",
        baseVoice: profile.baseVoice || "honey",
        mood: profile.mood,
        intensity: profile.intensity,
        ending: profile.ending,
      });
      if (res.data?.error) throw new Error(res.data.error);
      await onConverted?.(res.data.url, target);
      setOpen(false);
    } catch (e) {
      setError(e.message || "Umwandeln hat nicht geklappt.");
    } finally {
      setBusy(false);
    }
  });

  const working = busy || record.busy;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title="Deine eigene Sprachnachricht mit einer Charakter-Stimme senden"
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-10 rounded-full bg-elevated border border-border text-muted-foreground text-xs font-semibold whitespace-nowrap flex-shrink-0 hover:text-foreground transition-colors disabled:opacity-50",
            className
          )}
        >
          <AudioLines className="w-4 h-4" />
          <span className="hidden sm:inline">Meine Stimme</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <h3 className="font-display text-lg text-foreground mb-1">Mit Charakter-Stimme sprechen</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Nimm auf, was du sagen willst — gesendet wird es mit der Stimme des gewählten Charakters.
        </p>

        {ready.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keinem Charakter ist eine Stimme zugeordnet. Das machst du in der Stimmbank.
          </p>
        ) : (
          <>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Wessen Stimme?</p>
            <div className="flex flex-wrap gap-2 mb-4 max-h-[38vh] overflow-y-auto">
              {ready.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setTargetId(c.id)}
                  className={cn(
                    "inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-xs font-semibold transition-colors",
                    targetId === c.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.avatar ? (
                    <Image src={c.avatar} fittingType="fill" className="w-6 h-6 rounded-full flex-shrink-0" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-elevated flex items-center justify-center font-display text-[10px] text-primary flex-shrink-0">{c.stageName?.[0]}</span>
                  )}
                  {c.stageName}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => record.toggle("meine-stimme.webm")}
              disabled={working || !target}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-colors disabled:opacity-50",
                record.recording ? "bg-red-500 text-white animate-pulse" : "bg-primary text-primary-foreground"
              )}
            >
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : record.recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {record.busy ? "Wird hochgeladen …" : busy ? "Wird umgewandelt …" : record.recording ? "Stopp — fertig" : "Aufnehmen"}
            </button>

            <p className="text-[11px] text-muted-foreground mt-3">
              Sprich ein paar Sätze — je klarer du sprichst, desto ähnlicher klingt es hinterher.
            </p>
          </>
        )}

        {error && <p className="text-xs font-semibold text-destructive mt-3">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}