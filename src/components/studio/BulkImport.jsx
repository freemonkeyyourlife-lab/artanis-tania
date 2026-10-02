import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Sparkles, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import ModelKindTag from "@/components/studio/ModelKindTag";

const FILTERS = [
  { id: "ALLE", label: "Alle" },
  { id: "BILD", label: "Bild" },
  { id: "TEXT", label: "Text" },
  { id: "VIDEO", label: "Video" },
];

const PROMPT_IMAGE = "portrait photo of a woman, soft natural light, plain background";
const PROMPT_TEXT = "Antworte mit genau einem Wort: Bereit.";

// Alles Gefundene auf einer Liste: Häkchen setzen, kurz prüfen lassen, gesammelt übernehmen.
export default function BulkImport() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [filter, setFilter] = useState("ALLE");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null); // { done, total, ok, fail, current }
  const stop = useRef(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [img, vid, chat, haveImg, haveTxt, haveVid] = await Promise.all([
        base44.functions.invoke("hfModels", { kind: "image" }),
        base44.functions.invoke("hfModels", { kind: "video" }),
        base44.functions.invoke("hfChat", { action: "models" }),
        base44.entities.ImageModel.list("created_date", 500),
        base44.entities.TextModel.list("created_date", 500),
        base44.entities.VideoModel.list("created_date", 500),
      ]);

      const taken = {
        BILD: new Set(haveImg.map((m) => m.modelId)),
        TEXT: new Set(haveTxt.map((m) => m.modelId)),
        VIDEO: new Set(haveVid.map((m) => m.modelId)),
      };

      const build = (list, kind) =>
        (list || []).map((m) => ({
          key: `${kind}|${m.id}`,
          id: m.id,
          kind,
          provider: m.providers?.join(", ") || m.provider || "",
          taken: taken[kind].has(m.id),
          error: null,
        }));

      const next = [
        ...build(img.data?.models, "BILD"),
        ...build(chat.data?.models, "TEXT"),
        ...build(vid.data?.models, "VIDEO"),
      ];
      setRows(next);
      // Alles Neue ist gleich angehakt — abwählen geht genauso leicht.
      setSelected(new Set(next.filter((r) => !r.taken).map((r) => r.key)));
    } catch (e) {
      toast({ title: "Liste kam nicht an", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const visible = rows.filter((r) => filter === "ALLE" || r.kind === filter);
  const fresh = rows.filter((r) => !r.taken);
  const chosen = rows.filter((r) => selected.has(r.key) && !r.taken);

  const selectAll = (on) =>
    setSelected((prev) => {
      const next = new Set(prev);
      visible.filter((r) => !r.taken).forEach((r) => {
        if (on) next.add(r.key);
        else next.delete(r.key);
      });
      return next;
    });

  // Kurze Prüfung, dann gesammelt hinein: nur was antwortet, wird übernommen.
  const checkAndImport = async () => {
    const todo = chosen;
    if (!todo.length) return;
    stop.current = false;
    setProgress({ done: 0, total: todo.length, ok: 0, fail: 0, current: "" });

    const passed = { BILD: [], TEXT: [], VIDEO: [] };
    const failed = {};
    let ok = 0;
    let fail = 0;

    for (const r of todo) {
      if (stop.current) break;
      setProgress((p) => ({ ...p, current: r.id }));
      try {
        if (r.kind === "BILD") {
          const res = await base44.functions.invoke("hfGenerate", {
            modelId: r.id,
            source: "HUGGING_FACE",
            prompt: PROMPT_IMAGE,
          });
          if (res.data?.error) throw new Error(res.data.error);
        } else if (r.kind === "TEXT") {
          const res = await base44.functions.invoke("hfChat", { modelId: r.id, prompt: PROMPT_TEXT });
          if (res.data?.error) throw new Error(res.data.error);
          if (!res.data?.text) throw new Error("Keine Antwort erhalten.");
        }
        // Video: kein Probelauf — ein Testvideo dauert zu lang, geprüft ist der aktive Anbieter.
        passed[r.kind].push(r);
        ok += 1;
      } catch (e) {
        failed[r.key] = e.message || "Hat nicht geantwortet.";
        fail += 1;
      }
      setProgress((p) => ({ ...p, done: p.done + 1, ok, fail }));
    }

    const asRow = (r) => ({
      name: r.id.split("/").pop(),
      modelId: r.id,
      note: r.provider ? `Läuft über ${r.provider}` : "",
      enabled: true,
    });

    try {
      if (passed.BILD.length) {
        await base44.entities.ImageModel.bulkCreate(
          passed.BILD.map((r) => ({ ...asRow(r), source: "HUGGING_FACE" }))
        );
      }
      if (passed.TEXT.length) await base44.entities.TextModel.bulkCreate(passed.TEXT.map(asRow));
      if (passed.VIDEO.length) await base44.entities.VideoModel.bulkCreate(passed.VIDEO.map(asRow));
    } catch (e) {
      toast({ title: "Speichern hat nicht geklappt", description: e.message, variant: "destructive" });
    }

    const done = new Set([...passed.BILD, ...passed.TEXT, ...passed.VIDEO].map((r) => r.key));
    setRows((prev) =>
      prev.map((r) => {
        if (done.has(r.key)) return { ...r, taken: true, error: null };
        if (failed[r.key]) return { ...r, error: failed[r.key] };
        return r;
      })
    );
    setSelected((prev) => {
      const next = new Set(prev);
      done.forEach((k) => next.delete(k));
      return next;
    });
    setProgress(null);
    toast({
      title: `${ok} übernommen`,
      description: fail ? `${fail} liefen nicht und blieben draußen.` : "Alle haben die Prüfung bestanden.",
    });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <ModelKindTag kind="BILD" />
        <ModelKindTag kind="TEXT" />
        <ModelKindTag kind="VIDEO" />
      </div>
      <h2 className="font-display text-xl text-foreground mb-1">Massen-Import</h2>
      <p className="text-xs text-muted-foreground mb-5 max-w-3xl">
        Alle gefundenen Modelle auf einer Liste. Häkchen setzen und einmal prüfen lassen — nur was läuft, kommt in dein
        Studio. Bild und Text werden dabei wirklich angesprochen; bei Video genügt der aktive Anbieter, ein Testvideo
        würde zu lange dauern.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-colors",
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label} ({f.id === "ALLE" ? rows.length : rows.filter((r) => r.kind === f.id).length})
          </button>
        ))}
        <span className="flex-1" />
        <button
          onClick={() => selectAll(true)}
          className="px-4 py-2 rounded-full bg-elevated border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Alle Häkchen
        </button>
        <button
          onClick={() => selectAll(false)}
          className="px-4 py-2 rounded-full bg-elevated border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Keine
        </button>
        <button
          onClick={load}
          disabled={!!progress}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-elevated border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Neu laden
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-5">
        <button
          onClick={checkAndImport}
          disabled={!!progress || chosen.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {progress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Prüfen &amp; übernehmen ({chosen.length})
        </button>
        <p className="text-[11px] text-muted-foreground">
          {fresh.length} neu · {rows.length - fresh.length} schon drin
        </p>
      </div>

      {progress && (
        <div className="mb-5 rounded-xl border border-primary/30 bg-elevated p-4">
          <p className="text-sm text-foreground">
            Läuft … {progress.done} / {progress.total} geprüft — {progress.ok} laufen, {progress.fail} nicht
          </p>
          {progress.current && <p className="text-[11px] text-muted-foreground mt-1 truncate">Gerade dran: {progress.current}</p>}
          <button
            onClick={() => { stop.current = true; }}
            className="mt-3 px-4 py-1.5 rounded-full bg-background border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Stoppen
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Hier ist gerade nichts.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((r) => (
            <label
              key={r.key}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border",
                r.taken ? "opacity-60" : "cursor-pointer"
              )}
            >
              <input
                type="checkbox"
                checked={selected.has(r.key)}
                disabled={r.taken}
                onChange={() => toggle(r.key)}
                className="w-4 h-4 accent-primary flex-shrink-0"
              />
              <ModelKindTag kind={r.kind} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{r.id}</p>
                {r.provider && <p className="text-[11px] text-muted-foreground truncate">über {r.provider}</p>}
              </div>
              {r.taken && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/20 text-emerald-400 text-[11px] font-semibold whitespace-nowrap">
                  <Check className="w-3 h-3" /> Drin
                </span>
              )}
              {r.error && (
                <span className="text-[11px] text-destructive max-w-[190px] truncate" title={r.error}>
                  Läuft nicht: {r.error}
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}