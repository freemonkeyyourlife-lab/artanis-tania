import React, { useState, useRef, useEffect } from "react";
import { Loader2, Upload, Images, X, Send, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { therapistName } from "@/lib/therapyPrompts";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Aus eigenem Text und hochgeladenen Bildern eine mehrseitige Bildergeschichte
// machen: die Erzählung wird in Szenen geteilt, jede Szene bekommt ein Bild —
// die hochgeladenen Bilder gehen als Vorlage mit rein. Ergebnis landet als
// AI-Nachricht mit allen Bildern im Verlauf.

export default function BildergeschichteGenerator({ session, sceneText, open, onClose, onPosted }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [text, setText] = useState("");
  const [refs, setRefs] = useState([]);
  const [pages, setPages] = useState(4);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (open) { setText(sceneText || ""); setRefs([]); setResult(null); }
  }, [open, sceneText]);

  const upload = async (file) => {
    if (!file) return;
    try {
      const r = await base44.integrations.Core.UploadPublicFile({ file });
      if (r?.file_url) setRefs((prev) => [...prev, r.file_url]);
    } catch (e) {
      toast({ variant: "destructive", title: "Upload fehlgeschlagen", description: e?.message });
    }
  };

  const gen = async () => {
    if (busy || !text.trim()) return;
    setBusy(true);
    setStage("Geschichte wird in Szenen geteilt …");
    setResult(null);
    try {
      const split = await base44.integrations.Core.InvokeLLM({
        prompt:
          `Teile die folgende Erzählung in genau ${pages} aufeinanderfolgende Szenen für eine Bildergeschichte.\n\n` +
          `Erzählung:\n${text.trim()}\n\n` +
          `Gib für jede Szene einen deutschen Untertitel (caption, ein kurzer Satz) und einen detaillierten Bild-Prompt (bild, auf Deutsch, mit Figuren, Kleidung, Pose, Mimik, Ort, Licht, Stimmung). ` +
          `Halte die Personen über alle Szenen gleich.`,
        response_json_schema: {
          type: "object",
          properties: {
            pages: {
              type: "array",
              items: {
                type: "object",
                properties: { caption: { type: "string" }, bild: { type: "string" } },
              },
            },
          },
        },
      });
      const list = split?.pages || [];
      if (!list.length) throw new Error("Konnte die Geschichte nicht teilen.");
      setStage("Bilder werden gemalt …");
      const out = [];
      for (let i = 0; i < list.length; i++) {
        setStage(`Bild ${i + 1}/${list.length} …`);
        const r = await base44.integrations.Core.GenerateImage({
          prompt: list[i].bild,
          existing_image_urls: refs.length ? refs : undefined,
        });
        out.push({ caption: list[i].caption, image: r?.url || "" });
      }
      setResult(out);
    } catch (e) {
      toast({ variant: "destructive", title: "Erzeugung fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
      setStage("");
    }
  };

  const post = async () => {
    if (!result || posting) return;
    setPosting(true);
    try {
      const imgs = result.map((p) => p.image).filter(Boolean);
      const caps = result.map((p, i) => `Seite ${i + 1}: ${p.caption}`).join("\n\n");
      await base44.entities.TherapyMessage.create({
        sessionId: session.id,
        senderType: "AI",
        senderName: therapistName(session),
        text: `Bildergeschichte:\n\n${caps}`,
        images: imgs,
      });
      toast({ title: "Ins Verlauf gelegt", description: `${result.length} Seiten als Bildergeschichte.` });
      onPosted?.();
      onClose?.();
    } catch (e) {
      toast({ variant: "destructive", title: "Speichern fehlgeschlagen", description: e?.message });
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-lg text-foreground mb-1">Bildergeschichte erzeugen</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Text dazu schreiben, eigene Bilder als Vorlage hochladen — daraus entsteht eine mehrseitige Bildergeschichte.
          Die Bilder werden (stored publicly — anyone with the link can open them) abgelegt, damit der Generator sie liest.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Die Erzählung oder Szene, die zu Bildern werden soll …"
          className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-3"
        />

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-xs font-semibold text-muted-foreground">Seiten:</span>
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPages(n)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                pages === n ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Upload className="w-3.5 h-3.5" /> Bild als Vorlage
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }}
            className="hidden"
          />
        </div>

        {refs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {refs.map((url, i) => (
              <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setRefs((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={gen}
            disabled={busy || !text.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Images className="w-4 h-4" />}
            {busy ? stage || "Erzeugt …" : "Bildergeschichte erzeugen"}
          </button>
          {result && (
            <button
              onClick={post}
              disabled={posting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-elevated border border-border text-sm font-semibold text-foreground hover:border-primary/50 disabled:opacity-50"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {posting ? "Legt ab …" : "Ins Verlauf legen"}
            </button>
          )}
        </div>

        {result && (
          <div className="space-y-3">
            {result.map((p, i) => (
              <div key={i} className="rounded-2xl border border-border bg-elevated overflow-hidden">
                {p.image ? (
                  <img src={p.image} alt={p.caption} className="w-full max-h-72 object-cover" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center text-xs text-muted-foreground">Kein Bild</div>
                )}
                <p className="px-4 py-3 text-sm text-foreground">
                  <span className="text-[11px] font-bold text-primary mr-1.5">Seite {i + 1}</span>
                  {p.caption}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}