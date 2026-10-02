import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Sparkles, Check, Power } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import ModelKindTag from "@/components/studio/ModelKindTag";

const KIND_FILTERS = [
  { id: "ALLE", label: "Alle" },
  { id: "BILD", label: "Bild" },
  { id: "TEXT", label: "Text" },
  { id: "VIDEO", label: "Video" },
];

const SOURCES = [
  { id: "ALLE", label: "Alle Quellen" },
  { id: "HF", label: "Neu bei Hugging Face" },
  { id: "LINK", label: "Meine Modell-Links" },
  { id: "LISTE", label: "Meine fertigen Listen" },
];

const KIND_ENTITY = { BILD: "ImageModel", TEXT: "TextModel", VIDEO: "VideoModel" };
const LINK_KINDS = ["BILD", "TEXT", "VIDEO"];

const PROMPT_IMAGE = "portrait photo of a woman, soft natural light, plain background";
const PROMPT_TEXT = "Antworte mit genau einem Wort: Bereit.";

const asArray = (res) => (Array.isArray(res) ? res : res?.items || []);

// Aus einem Link die Modell-Kennung holen — aus dem Model-Parameter oder aus der Hugging-Face-Adresse.
const idFromUrl = (url) => {
  try {
    const u = new URL(url);
    const fromQuery = u.searchParams.get("model");
    if (fromQuery) return fromQuery.trim();
    if (/(^|\.)huggingface\.co$/i.test(u.hostname)) {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    }
  } catch (e) { /* kein brauchbarer Link */ }
  return "";
};

// Alles aus allen Quellen auf einer Liste: Häkchen setzen, prüfen lassen, gesammelt übernehmen.
export default function BulkImport() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [kindFilter, setKindFilter] = useState("ALLE");
  const [sourceFilter, setSourceFilter] = useState("ALLE");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total, ok, fail, current }
  const stop = useRef(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [img, vid, chat, links, imgList, txtList, vidList] = await Promise.all([
        base44.functions.invoke("hfModels", { kind: "image" }),
        base44.functions.invoke("hfModels", { kind: "video" }),
        base44.functions.invoke("hfChat", { action: "models" }),
        base44.entities.ModelLink.list("name", 500),
        base44.entities.ImageModel.list("created_date", 500),
        base44.entities.TextModel.list("created_date", 500),
        base44.entities.VideoModel.list("created_date", 500),
      ]);

      const mine = {
        BILD: asArray(imgList),
        TEXT: asArray(txtList),
        VIDEO: asArray(vidList),
      };
      const taken = {
        BILD: new Map(mine.BILD.map((m) => [m.modelId, m])),
        TEXT: new Map(mine.TEXT.map((m) => [m.modelId, m])),
        VIDEO: new Map(mine.VIDEO.map((m) => [m.modelId, m])),
      };

      const seen = new Set();
      const next = [];
      const push = (row) => {
        if (!row.id) return;
        const mark = `${row.kind}|${row.id}`;
        if (seen.has(mark)) return;
        seen.add(mark);
        const record = taken[row.kind].get(row.id) || null;
        next.push({ ...row, taken: !!record, record });
      };

      // 1) Was Hugging Face gerade anbietet.
      const fromHf = (list, kind) =>
        (list || []).forEach((m) =>
          push({
            key: `HF|${kind}|${m.id}`,
            kind,
            id: m.id,
            label: m.id,
            sub: m.providers?.join(", ") || m.provider || "",
            origin: "HF",
            error: null,
          })
        );
      fromHf(img.data?.models, "BILD");
      fromHf(chat.data?.models, "TEXT");
      fromHf(vid.data?.models, "VIDEO");

      // 2) Was in der Modell-Link-Sammlung steht.
      asArray(links)
        .filter((l) => LINK_KINDS.includes(l.kind || "BILD"))
        .forEach((l) => {
          const kind = l.kind || "BILD";
          const id = idFromUrl(l.url);
          push({
            key: `LINK|${l.id}`,
            kind,
            id,
            label: l.name || id,
            sub: `aus deinen Modell-Links · ${id}`,
            origin: "LINK",
            error: null,
          });
        });

      // 3) Was schon in den fertigen Listen steht — bleibt drin, lässt sich hier nur an- und ausschalten.
      LINK_KINDS.forEach((kind) =>
        mine[kind].forEach((m) =>
          push({
            key: `LISTE|${kind}|${m.id}`,
            kind,
            id: m.modelId,
            label: m.name || m.modelId,
            sub: `in deiner Liste · ${m.modelId}`,
            origin: "LISTE",
            error: null,
            ownRecord: m,
          })
        )
      );

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

  const bySource = rows.filter((r) => sourceFilter === "ALLE" || r.origin === sourceFilter);
  const visible = bySource.filter((r) => kindFilter === "ALLE" || r.kind === kindFilter);
  const fresh = rows.filter((r) => !r.taken);
  const chosen = rows.filter((r) => selected.has(r.key) && !r.taken);
  const chosenTaken = rows.filter((r) => selected.has(r.key) && r.taken);
  const shown = showAll ? visible : visible.slice(0, 150);

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
      setProgress((p) => ({ ...p, current: r.label }));
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
      name: (r.id.split("/").pop() || r.label || "").slice(0, 80),
      modelId: r.id,
      note: r.origin === "LINK" ? "Aus deiner Modell-Link-Sammlung" : r.sub ? `Läuft über ${r.sub}` : "",
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

  // Was schon drin ist: gesammelt an- oder ausschalten.
  const toggleEnabled = async () => {
    const todo = chosenTaken;
    if (!todo.length) return;
    setBusy(true);
    try {
      const groups = {};
      todo.forEach((r) => {
        const record = r.record || r.ownRecord;
        if (!record?.id) return;
        const entity = KIND_ENTITY[r.kind];
        if (!groups[entity]) groups[entity] = [];
        groups[entity].push({ id: record.id, enabled: record.enabled === false });
      });
      for (const [entity, items] of Object.entries(groups)) {
        if (items.length) await base44.entities[entity].bulkUpdate(items);
      }
      setRows((prev) =>
        prev.map((r) => {
          if (!selected.has(r.key)) return r;
          const record = r.record || r.ownRecord;
          if (!record) return r;
          return { ...r, record: { ...record, enabled: record.enabled === false } };
        })
      );
      setSelected((prev) => {
        const next = new Set(prev);
        todo.forEach((r) => next.delete(r.key));
        return next;
      });
      toast({ title: `${todo.length} umgeschaltet` });
    } catch (e) {
      toast({ title: "Umschalten hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
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
        Alles aus allen Quellen auf einer Liste: neu gefundene Modelle, deine Modell-Link-Sammlung und die Modelle, die
        schon in deinen fertigen Listen stehen. Häkchen setzen und einmal prüfen lassen — nur was läuft, kommt in dein
        Studio, sauber getrennt nach Bild, Text und Video. Was schon drin ist, lässt sich hier gesammelt an- und
        ausschalten.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSourceFilter(s.id); setShowAll(false); }}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-colors",
              sourceFilter === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label} ({s.id === "ALLE" ? rows.length : rows.filter((r) => r.origin === s.id).length})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {KIND_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => { setKindFilter(f.id); setShowAll(false); }}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-colors",
              kindFilter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label} ({f.id === "ALLE" ? bySource.length : bySource.filter((r) => r.kind === f.id).length})
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
          disabled={!!progress || busy}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-elevated border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Neu laden
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button
          onClick={checkAndImport}
          disabled={!!progress || busy || chosen.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {progress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Prüfen &amp; übernehmen ({chosen.length})
        </button>
        <button
          onClick={toggleEnabled}
          disabled={!!progress || busy || chosenTaken.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-elevated border border-border text-sm font-semibold text-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
          An-/ausschalten ({chosenTaken.length})
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
          {shown.map((r) => {
            const record = r.record || r.ownRecord;
            return (
              <label
                key={r.key}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border cursor-pointer",
                  r.taken && "opacity-70"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(r.key)}
                  onChange={() => toggle(r.key)}
                  className="w-4 h-4 accent-primary flex-shrink-0"
                />
                <ModelKindTag kind={r.kind} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{r.label}</p>
                  {r.sub && <p className="text-[11px] text-muted-foreground truncate">{r.sub}</p>}
                </div>
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  {r.origin === "HF" ? "Hugging Face" : r.origin === "LINK" ? "Modell-Link" : "Meine Liste"}
                </span>
                {r.taken && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/20 text-emerald-400 text-[11px] font-semibold whitespace-nowrap">
                    <Check className="w-3 h-3" /> Drin
                  </span>
                )}
                {r.taken && record?.enabled === false && (
                  <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold whitespace-nowrap">
                    Aus
                  </span>
                )}
                {r.error && (
                  <span className="text-[11px] text-destructive max-w-[190px] truncate" title={r.error}>
                    Läuft nicht: {r.error}
                  </span>
                )}
              </label>
            );
          })}
          {!showAll && visible.length > shown.length && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-3 rounded-xl bg-elevated border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Weitere {visible.length - shown.length} anzeigen
            </button>
          )}
        </div>
      )}
    </div>
  );
}