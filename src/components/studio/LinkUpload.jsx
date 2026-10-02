import React, { useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Loader2, Radar, ArrowDownToLine, X } from "lucide-react";
import { cn } from "@/lib/utils";
import LinkEnrichRow from "@/components/studio/LinkEnrichRow";
import { parseLinks, enrichLinks, saveEnriched } from "@/lib/linkEnrich";

// Link-Listen hochladen oder einfügen: jede Adresse wird gelesen und mit
// Titel, Bild und Modell-Angaben in die Sammlung übernommen.
export default function LinkUpload() {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [text, setText] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const urls = useMemo(() => parseLinks(text), [text]);
  const chosen = rows.filter((r) => selected.has(r.url));

  const onFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setText((prev) => `${prev ? `${prev}\n` : ""}${String(reader.result || "")}`);
      toast({ title: "Datei gelesen", description: "Die Adressen stehen jetzt im Feld darunter." });
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const analyze = async () => {
    if (!urls.length || busy) return;
    setBusy(true);
    setRows([]);
    setSelected(new Set());
    setProgress({ done: 0, total: urls.length });
    try {
      const found = await enrichLinks(urls, (done, total) => setProgress({ done, total }));
      setRows(found);
      setSelected(new Set(found.filter((r) => r.ok).map((r) => r.url)));
      const failed = found.filter((r) => !r.ok).length;
      toast({
        title: `${found.length} Adressen analysiert`,
        description: failed ? `${failed} ließen sich nicht lesen.` : "Alle wurden gelesen.",
      });
    } catch (e) {
      toast({ title: "Analyse hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      setProgress({ done: 0, total: 0 });
    }
  };

  const toggle = (key) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const save = async () => {
    if (!chosen.length || saving) return;
    setSaving(true);
    try {
      const { saved, skipped, library } = await saveEnriched(chosen);
      const parts = [];
      if (saved.MODELL) parts.push(`${saved.MODELL} Modell-Links`);
      if (saved.DIENST) parts.push(`${saved.DIENST} Dienste`);
      const usable = library ? library.BILD + library.TEXT + library.VIDEO + library.AUDIO : 0;
      if (usable) parts.push(`${usable} davon sofort nutzbar in der Generierung`);
      const dupes = skipped.MODELL + skipped.DIENST;
      toast({
        title: parts.length ? `Übernommen: ${parts.join(", ")}` : "Nichts übernommen",
        description: dupes ? `${dupes} standen schon drin.` : undefined,
      });
      const doneKeys = new Set(chosen.map((r) => r.url));
      setRows((prev) => prev.filter((r) => !doneKeys.has(r.url)));
      setSelected(new Set());
    } catch (e) {
      toast({ title: "Speichern hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <p className="font-display text-2xl text-foreground mb-1">Link-Upload</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-3xl">
        Adressen einfügen — eine pro Zeile — oder eine Liste als Datei hochladen. Jede Adresse wird gelesen und mit
        Titel, Vorschaubild und Modell-Angaben übernommen: Modelle in die Modell-Links, alles andere in die
        Dienste-Liste. Wird dabei ein Modell erkannt, steht es danach auch in der Modell-Bibliothek zur Auswahl —
        bei Bildern, Videos, Texten und Stimmen.
      </p>

      <div className="rounded-2xl border border-border bg-card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
          >
            <Upload className="w-4 h-4" /> Datei wählen
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv,.json,.md"
            onChange={onFile}
            className="hidden"
          />
          <span className="text-[13px] font-bold text-muted-foreground">
            {urls.length} {urls.length === 1 ? "Adresse" : "Adressen"} erkannt
          </span>
          {text && (
            <button
              onClick={() => {
                setText("");
                setRows([]);
                setSelected(new Set());
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" /> Leeren
            </button>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={"https://huggingface.co/black-forest-labs/FLUX.1-dev\nhttps://civitai.com/models/…"}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-[14px] font-semibold text-foreground placeholder:text-muted-foreground resize-y"
        />

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button
            onClick={analyze}
            disabled={busy || !urls.length}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-[15px] font-bold disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            Adressen analysieren
          </button>
          {busy && progress.total > 0 && (
            <span className="text-[13px] font-bold text-muted-foreground">
              {progress.done} von {progress.total} gelesen …
            </span>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-[13px] font-bold text-foreground">
              {rows.length} analysiert · {chosen.length} gewählt
            </span>
            <span className="flex-1" />
            <button
              onClick={() => setSelected(new Set(rows.map((r) => r.url)))}
              className="px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-muted-foreground"
            >
              Alle Häkchen
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-muted-foreground"
            >
              Keine
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {rows.map((r) => (
              <LinkEnrichRow key={r.url} row={r} checked={selected.has(r.url)} onToggle={toggle} />
            ))}
          </div>

          <button
            onClick={save}
            disabled={saving || chosen.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
            Übernehmen ({chosen.length})
          </button>
        </>
      )}
    </div>
  );
}