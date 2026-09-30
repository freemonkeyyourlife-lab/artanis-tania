import React, { useState } from "react";
import { FileDown, Loader2, Music, FileText, FileJson, Download } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { downloadMedia } from "@/lib/download";
import { MOODS } from "@/lib/moodStyle";
import { PLAY_LEVELS } from "@/lib/playStyle";
import { buildStoryText, buildTemplate, collectVoiceNotes, downloadEverything, storyFileName, templateFileName, downloadText } from "@/lib/storyExport";

// Die ganze Story sichern: Verlauf mit Transkripten, Besetzung, Stimmung und
// Tempo — dazu die Vorlage und alle Sprachnachrichten als Audiodatei.
export default function StoryExportButton({
  messages = [],
  title = "Story",
  meName = "Ich",
  cast = [],
  moods = [],
  playLevel,
  scenario = null,
  setupAnswers = {},
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const payload = { title, meName, messages, cast, moods, playLevel, scenarioTitle: scenario?.title || "", setupAnswers, scenario };
  const audio = collectVoiceNotes(messages, meName);
  const lines = messages.filter((m) => m.senderType !== "SYSTEM" && ((m.text || "").trim() || (m.attachments || []).some((a) => a?.type === "audio"))).length;
  const moodText = moods.map((id) => MOODS.find((m) => m.id === id)?.label).filter(Boolean).join(", ");
  const tempoText = PLAY_LEVELS.find((p) => p.id === playLevel)?.label || "";

  const exportAll = async () => {
    if (!lines) {
      toast({ title: "Noch nichts da", description: "Sobald geschrieben oder gesprochen wurde, kannst du die Story exportieren." });
      return;
    }
    setBusy(true);
    try {
      const story = buildStoryText(payload);
      try { await navigator.clipboard.writeText(story); } catch (e) { /* Download reicht */ }
      const audioCount = await downloadEverything(payload);
      toast({
        title: "Story exportiert",
        description: `Story-Datei, Vorlage${audioCount ? ` und ${audioCount} Sprachnachricht${audioCount === 1 ? "" : "en"}` : ""} gespeichert.`,
      });
      setOpen(false);
    } catch (e) {
      toast({ title: "Export nicht komplett", description: "Ein Teil kam nicht durch — bitte noch einmal versuchen.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const exportStoryOnly = () => {
    downloadText(storyFileName(title), buildStoryText(payload));
    toast({ title: "Story gespeichert", description: "Der Verlauf mit allen Transkripten liegt als Textdatei bereit." });
  };

  const exportTemplateOnly = () => {
    downloadText(templateFileName(title), buildTemplate(payload));
    toast({ title: "Vorlage gespeichert", description: "Besetzung, Stimmung, Tempo und Grundlagen sind in der Vorlage." });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Ganze Story sichern — mit Transkripten, Audio und Vorlage"
          className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors"
        >
          <FileDown className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <h3 className="font-display text-lg text-foreground">Story sichern</h3>
        <p className="text-xs text-muted-foreground">
          {lines} Zeile{lines === 1 ? "" : "n"} im Verlauf
          {moodText ? ` · Stimmung: ${moodText}` : ""}
          {tempoText ? ` · Tempo: ${tempoText}` : ""}
        </p>

        <div className="space-y-2 mt-4">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-elevated">
            <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Story-Datei</p>
              <p className="text-[11px] text-muted-foreground">Kompletter Verlauf mit allen Sprechern, Sprachnachrichten als Transkript, dazu Besetzung, Stimmung und Tempo.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-elevated">
            <FileJson className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Vorlage</p>
              <p className="text-[11px] text-muted-foreground">Szenario, Grundlagen, Besetzung mit Rollen und Stimmen, Stimmung und Tempo — zum späteren Wiederladen.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-elevated">
            <Music className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Sprachnachrichten</p>
              <p className="text-[11px] text-muted-foreground">{audio.length ? `${audio.length} Audiodatei${audio.length === 1 ? "" : "en"} werden mitgespeichert.` : "In diesem Verlauf gibt es noch keine Sprachnachricht."}</p>
            </div>
          </div>
        </div>

        <button
          onClick={exportAll}
          disabled={busy}
          className="w-full mt-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {busy ? "Wird gespeichert …" : "Alles exportieren"}
        </button>

        <div className="flex gap-2">
          <button onClick={exportStoryOnly} className="flex-1 py-2 rounded-full bg-elevated text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Nur Story</button>
          <button onClick={exportTemplateOnly} className="flex-1 py-2 rounded-full bg-elevated text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Nur Vorlage</button>
        </div>

        {audio.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Sprachnachrichten einzeln</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {audio.map((v, i) => (
                <div key={`${v.url}-${i}`} className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{v.speaker}</p>
                    <p className="text-[10px] text-muted-foreground">{v.at}</p>
                  </div>
                  <button
                    onClick={() => downloadMedia(v.url, v.filename)}
                    title="Diese Sprachnachricht herunterladen"
                    className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}