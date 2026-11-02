import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import {
  Loader2, Upload, FolderUp, Wand2, User, Check, Package, Sparkles,
  Images, Film, Mic, AlertCircle, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TARGET = 12;

const sign = async (uri) => {
  if (!uri) return null;
  if (String(uri).startsWith("http")) return uri;
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 3600 });
    return r.signed_url;
  } catch { return null; }
};

const kindForFile = (f) => {
  const t = (f.type || "").toLowerCase();
  const n = (f.name || "").toLowerCase();
  if (t.startsWith("video")) return "VIDEO";
  if (t.startsWith("audio")) return "AUDIO";
  if (t.startsWith("image/gif") || n.endsWith(".gif")) return "GIF";
  return "IMAGE";
};

// Der Massen-Import: ein ganzer Medienordner rein → die KI schaut sich jedes
// Bild an, erkennt den Charakter (gegen die vorhandenen Figuren), sortiert
// alles ein und bietet es pro Charakter zur Übernahme ins Training an.
export default function GodTrainMassImport() {
  const [characters, setCharacters] = useState([]);
  const [items, setItems] = useState([]); // { fileUri, url?, kind, name, match, conf }
  const [stage, setStage] = useState("leer"); // leer | hoch | analyse | fertig
  const [progress, setProgress] = useState("");
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [adopting, setAdopting] = useState(null);
  const [analyze, setAnalyze] = useState(true);
  const fileRef = useRef(null);
  const folderRef = useRef(null);

  const note = (m) => setLog((l) => [...l.slice(-30), m]);

  useEffect(() => {
    base44.entities.Character.filter({}, { sort: "-created_date", limit: 200 })
      .then((r) => setCharacters(r.items || []))
      .catch(() => setCharacters([]));
  }, []);

  // Referenz-URLs der Charakter-Avatare einmal signieren — für den visuellen Abgleich.
  const [charRefs, setCharRefs] = useState([]);
  useEffect(() => {
    (async () => {
      const withAv = characters.filter((c) => c.avatar);
      const refs = [];
      for (const c of withAv.slice(0, 12)) {
        const u = await sign(c.avatar);
        if (u) refs.push({ id: c.id, name: c.name, avatar: u });
      }
      setCharRefs(refs);
    })();
  }, [characters]);

  const onPick = async (list) => {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    setStage("hoch");
    setBusy(true);
    setLog([]);
    note(`${arr.length} Dateien übernommen — lade hoch …`);
    const uploaded = [];
    for (let i = 0; i < arr.length; i++) {
      const f = arr[i];
      setProgress(`Hochladen ${i + 1}/${arr.length}: ${f.name}`);
      try {
        const up = await base44.integrations.Core.UploadPrivateFile({ file: f });
        uploaded.push({ fileUri: up.file_uri, kind: kindForFile(f), name: f.name, match: "", conf: 0 });
      } catch { note(`Fehlgeschlagen: ${f.name}`); }
    }
    setItems(uploaded);
    note(`${uploaded.length} Dateien gespeichert (stored privately).`);
    setBusy(false);
    setProgress("");
    setStage("analyse");
    if (analyze && uploaded.filter((u) => u.kind === "IMAGE" || u.kind === "GIF").length) {
      runAnalysis(uploaded);
    } else {
      // Ohne visuelle Analyse: nach Dateiname zuordnen (Treffer auf Charakternamen).
      const byName = uploaded.map((u) => {
        const low = u.name.toLowerCase();
        const hit = characters.find((c) => c.name && low.includes(c.name.toLowerCase()));
        return { ...u, match: hit?.name || "NEU" };
      });
      setItems(byName);
      setStage("fertig");
      note("Sortiert nach Dateiname.");
    }
  };

  // Visueller Abgleich: jedes Bild gegen die Charakter-Referenzen halten.
  const runAnalysis = async (pool) => {
    setBusy(true);
    const imgs = pool.filter((u) => u.kind === "IMAGE" || u.kind === "GIF");
    note(`Analysiere ${imgs.length} Bilder gegen ${charRefs.length} Charaktere …`);
    const refsNames = charRefs.map((c, i) => `${i + 1}) ${c.name}`).join(", ");
    const out = [];
    for (let i = 0; i < imgs.length; i++) {
      const it = imgs[i];
      setProgress(`Analysiere ${i + 1}/${imgs.length}: ${it.name}`);
      try {
        const img = await sign(it.fileUri);
        if (!img) { out.push(it); continue; }
        const file_urls = [img, ...charRefs.map((c) => c.avatar)];
        const res = await base44.integrations.Core.InvokeLLM({
          prompt:
            "Das ERSTE Bild ist eine neue Aufnahme einer Person. Die folgenden Bilder sind Referenzporträts vorhandener Charaktere, in dieser Reihenfolge: " +
            refsNames + ". " +
            "Zu welchem dieser Charaktere passt die Person auf dem ersten Bild am besten — gleiches Gesicht, gleiche Haarfarbe, gleicher Typ? " +
            "Antworte mit dem exakten Charakternamen aus der Liste. Wenn keiner passt, antworte genau 'NEU'.",
          file_urls,
          response_json_schema: { type: "object", properties: { match: { type: "string" }, confidence: { type: "number" } } },
        });
        const match = (res?.match || "NEU").trim();
        const known = charRefs.find((c) => c.name.toLowerCase() === match.toLowerCase());
        out.push({ ...it, match: known ? known.name : "NEU", conf: res?.confidence || 0 });
      } catch {
        out.push(it);
      }
    }
    // Nicht-Bilder übernehmen, Match leer.
    const rest = pool.filter((u) => u.kind !== "IMAGE" && u.kind !== "GIF");
    const merged = [...out, ...rest];
    setItems(merged);
    setBusy(false);
    setProgress("");
    setStage("fertig");
    const groups = new Set(merged.map((m) => m.match || "NEU"));
    note(`Fertig — ${groups.size} Gruppen erkannt.`);
  };

  const reassign = (fileUri, name) => setItems((xs) => xs.map((x) => (x.fileUri === fileUri ? { ...x, match: name } : x)));
  const reassignGroup = (from, to) => setItems((xs) => xs.map((x) => (x.match === from ? { ...x, match: to } : x)));

  // Vorschaubilder signieren (nur Bilder).
  const [urls, setUrls] = useState({});
  useEffect(() => {
    (async () => {
      const map = {};
      for (const it of items) {
        if ((it.kind === "IMAGE" || it.kind === "GIF") && !map[it.fileUri]) map[it.fileUri] = await sign(it.fileUri);
      }
      setUrls(map);
    })();
  }, [items]);

  const groups = useMemo(() => {
    const g = {};
    items.forEach((it) => {
      const k = it.match || "NEU";
      (g[k] ||= []).push(it);
    });
    return Object.entries(g).sort((a, b) => (a[0] === "NEU" ? 1 : a[0].localeCompare(b[0])));
  }, [items]);

  // Eine Gruppe ins Training übernehmen — legt das Set nötigenfalls an.
  const adopt = async (name) => {
    if (busy) return;
    setAdopting(name);
    setBusy(true);
    try {
      const group = items.filter((it) => (it.match || "NEU") === name && (it.kind === "IMAGE" || it.kind === "GIF"));
      const imgUris = group.map((g) => g.fileUri);
      if (!imgUris.length) { note(`Keine Bilder für „${name}“.`); return; }
      const existing = await base44.entities.TrainingSet.filter({ personName: name });
      let set = existing[0];
      if (set) {
        const merged = Array.from(new Set([...(set.images || []), ...imgUris]));
        const total = merged.length + (set.generatedImages?.length || 0);
        await base44.entities.TrainingSet.update(set.id, {
          images: merged,
          avatar: set.avatar || imgUris[0],
          status: total >= TARGET ? "BEREIT" : "SAMMLUNG",
        });
        note(`„${name}“: +${imgUris.length} Bilder → Set aktualisiert (${merged.length}).`);
      } else {
        set = await base44.entities.TrainingSet.create({
          personName: name,
          name: `Auto-Set ${name}`,
          images: imgUris,
          generatedImages: [],
          sourceMedia: [],
          avatar: imgUris[0],
          targetCount: TARGET,
          status: imgUris.length >= TARGET ? "BEREIT" : "SAMMLUNG",
        });
        note(`„${name}“: Set angelegt mit ${imgUris.length} Bildern.`);
      }
      // Übernommene aus der Ansicht nehmen — was bleibt, will noch jemand.
      setItems((xs) => xs.filter((it) => !imgUris.includes(it.fileUri)));
    } finally {
      setBusy(false);
      setAdopting(null);
    }
  };

  const adoptAll = async () => {
    for (const [name] of groups) { if (name !== "NEU" || groups.length === 1) await adopt(name); }
  };

  const reset = () => { setItems([]); setStage("leer"); setLog([]); setUrls({}); };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border-2 border-primary/30 bg-background/40 p-3">
        <p className="text-[12px] font-bold text-primary mb-1">Massen-Import — ganzen Ordner analysieren & sortieren</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Ein ganzer Medienordner rein — die KI erkennt pro Bild, welcher Charakter es ist (gegen die
          vorhandenen Figuren), sortiert alles ein und bietet es pro Charakter zur Übernahme ins Training.
          Videos und Audio kommen als Quellen dazu.
        </p>
      </div>

      {stage === "leer" && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => fileRef.current?.click()} className="rounded-2xl border-2 border-dashed border-border bg-elevated/50 p-5 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
              <Upload className="w-5 h-5 text-primary" />
              <span className="text-[12px] font-bold text-foreground">Dateien wählen</span>
              <span className="text-[10px] text-muted-foreground">Bilder, Video, Audio</span>
            </button>
            <button onClick={() => folderRef.current?.click()} className="rounded-2xl border-2 border-dashed border-border bg-elevated/50 p-5 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
              <FolderUp className="w-5 h-5 text-primary" />
              <span className="text-[12px] font-bold text-foreground">Ganzen Ordner</span>
              <span className="text-[10px] text-muted-foreground">inkl. Unterordner</span>
            </button>
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => onPick(e.target.files)} />
          <input ref={folderRef} type="file" multiple className="hidden"
            onChange={(e) => onPick(e.target.files)}
            // Ordnung hochladen — beide Attribute setzen.
            {...({ webkitdirectory: "", directory: "", mozdirectory: "" })} />
          <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <input type="checkbox" checked={analyze} onChange={(e) => setAnalyze(e.target.checked)} className="accent-primary" />
            Visuell analysieren (KI erkennt den Charakter auf jedem Bild)
          </label>
          {characters.length === 0 && (
            <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Noch keine Charaktere angelegt — ohne Analyse wird nach Dateiname sortiert.
            </p>
          )}
        </div>
      )}

      {(stage === "hoch" || stage === "analyse") && busy && (
        <div className="rounded-2xl border border-border bg-elevated p-4 flex flex-col gap-2">
          <p className="text-[13px] font-bold text-primary flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> {progress || "Arbeite …"}
          </p>
          <div className="max-h-40 overflow-y-auto rounded-xl bg-background border border-border p-3">
            {log.map((l, i) => <p key={i} className="text-[12px] text-foreground whitespace-pre-wrap">{l}</p>)}
          </div>
        </div>
      )}

      {stage === "fertig" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={adoptAll} disabled={busy || !items.length} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50">
              <Package className="w-4 h-4" /> Alle ins Training übernehmen
            </button>
            <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[13px] font-bold text-foreground">
              <RefreshCw className="w-4 h-4" /> Neuer Ordner
            </button>
            <span className="text-[11px] text-muted-foreground">{items.length} offen · {groups.length} Gruppen</span>
          </div>

          {groups.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">Alles übernommen — der Ordner ist leer.</p>
          ) : groups.map(([name, list]) => (
            <div key={name} className="rounded-2xl border border-border bg-elevated p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <select
                    value={name}
                    onChange={(e) => reassignGroup(name, e.target.value)}
                    className="bg-background border border-border rounded-full px-2 py-1 text-[12px] font-bold text-foreground focus:outline-none max-w-[180px]"
                  >
                    <option value="NEU">NEU / ohne Zuordnung</option>
                    {characters.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <span className="text-[11px] text-muted-foreground">{list.length}</span>
                </div>
                <button
                  onClick={() => adopt(name)}
                  disabled={busy || adopting === name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn glass-btn-accent text-[12px] font-bold text-gloss disabled:opacity-50"
                >
                  {adopting === name ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Ins Training
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {list.map((it, i) => {
                  const key = it.fileUri;
                  const isImg = it.kind === "IMAGE" || it.kind === "GIF";
                  return (
                    <div key={key + i} className="relative h-20 rounded-xl bg-background overflow-hidden">
                      {isImg ? (
                        urls[key] ? <Image src={urls[key]} fittingType="fill" className="h-full w-full" /> : <div className="h-full w-full animate-pulse" />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                          {it.kind === "VIDEO" ? <Film className="w-4 h-4" /> : it.kind === "AUDIO" ? <Mic className="w-4 h-4" /> : <Images className="w-4 h-4" />}
                          <span className="text-[9px] uppercase">{it.kind}</span>
                        </div>
                      )}
                      <select
                        value={it.match || "NEU"}
                        onChange={(e) => reassign(it.fileUri, e.target.value)}
                        className="absolute bottom-0 left-0 right-0 bg-black/65 text-white text-[9px] px-1 py-0.5 focus:outline-none"
                        title="Dieses Bild einzeln umordnen"
                      >
                        <option value="NEU">NEU</option>
                        {characters.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}