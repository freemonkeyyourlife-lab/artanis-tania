import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import JSZip from "jszip";
import { Loader2, Search, Archive, CheckCircle2, AlertTriangle, Package, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { signMedia } from "@/lib/mediaSign";

// Ein fertig geschnürtes Trainingspaket: die Medienbibliothek wird durchsucht,
// pro Charakter gezählt was fehlt, und mit einem Klick liegt ein ZIP bereit —
// ein Ordner pro Charakter, alle verfügbaren Bilder darin, plus eine Liste,
// was noch fehlt. So nimmt man das Paket direkt mit zum Trainingsserver.

const norm = (n) => String(n || "").trim().toLowerCase();
const TARGET = 12;

export default function GodTrainPaket() {
  const [chars, setChars] = useState([]);
  const [sets, setSets] = useState([]);
  const [quellen, setQuellen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState({});
  const [log, setLog] = useState([]);
  const [progress, setProgress] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [c, s, q] = await Promise.all([
        base44.entities.Character.filter({}, { sort: "-created_date", limit: 200 }),
        base44.entities.TrainingSet.filter({}, { sort: "-created_date", limit: 200 }),
        base44.entities.Quelle.filter({ kind: "BILD" }, { sort: "-created_date", limit: 400 }),
      ]);
      setChars(c.items || []);
      setSets(s.items || []);
      setQuellen(q.items || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  // Pro Charakter alle verfügbaren Bilder sammeln — aus dem Trainingsset, dem
  // Quellen-Archiv (zugeordnet) und den Charakterbildern selbst. Doppelte raus.
  const rows = useMemo(() => {
    return chars.map((ch) => {
      const set = sets.find((s) => norm(s.personName) === norm(ch.name));
      const pool = new Set();
      const push = (u) => { if (u) pool.add(u); };
      (set?.images || []).forEach(push);
      (set?.generatedImages || []).forEach(push);
      (ch.images || []).forEach(push);
      quellen.forEach((q) => {
        if ((q.characterId && q.characterId === ch.id) || norm(q.characterName) === norm(ch.name)) {
          (q.url ? [q.url] : []).forEach(push);
          if (q.fileUri) push(q.fileUri);
        }
      });
      const have = pool.size;
      const target = set?.targetCount || TARGET;
      const missing = Math.max(0, target - have);
      return { ch, set, have, target, missing, urls: Array.from(pool) };
    });
  }, [chars, sets, quellen]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => r.ch.name.toLowerCase().includes(q));
  }, [rows, query]);

  const note = (m) => setLog((l) => [...l.slice(-14), m]);

  const selectMissing = () => {
    const next = {};
    rows.forEach((r) => { if (r.missing > 0 || !r.have) next[r.ch.id] = true; });
    setPicked(next);
    note(`${Object.keys(next).length} Charaktere mit fehlenden Bildern ausgewählt.`);
  };

  const selectAll = () => {
    const next = {};
    rows.forEach((r) => { next[r.ch.id] = true; });
    setPicked(next);
  };

  const toggle = (id) => setPicked((p) => ({ ...p, [id]: !p[id] }));

  const chosen = rows.filter((r) => picked[r.ch.id]);
  const totalImages = chosen.reduce((a, r) => a + r.have, 0);
  const totalMissing = chosen.reduce((a, r) => a + r.missing, 0);

  const buildPackage = async () => {
    if (!chosen.length || busy) return;
    setBusy(true);
    setLog([]);
    try {
      const zip = new JSZip();
      const manifest = { created: new Date().toISOString(), target: TARGET, characters: [] };
      let packed = 0;
      for (let i = 0; i < chosen.length; i++) {
        const r = chosen[i];
        const folder = zip.folder(safeName(r.ch.name));
        let n = 0;
        for (const u of r.urls) {
          const url = await signMedia(u);
          if (!url) continue;
          try {
            const blob = await (await fetch(url)).blob();
            const ext = guessExt(blob, u);
            folder.file(`${String(n + 1).padStart(2, "0")}.${ext}`, blob);
            n += 1;
            packed += 1;
          } catch { /* einzelnes Bild überspringen */ }
        }
        manifest.characters.push({
          name: r.ch.name,
          available: r.have,
          packed: n,
          target: r.target,
          missing: Math.max(0, r.target - n),
        });
        setProgress(`${r.ch.name}: ${n} Bilder gepackt`);
        note(`${r.ch.name} — ${n} Bilder${n < r.target ? `, ${r.target - n} fehlen` : ""}.`);
      }
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file("README.txt", readme(manifest));
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = `trainingspaket-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      setProgress("");
      note(`Fertig — ${packed} Bilder, ${chosen.length} Charaktere, 1 Paket.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-elevated border border-border p-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ausgewählt</p><p className="text-2xl font-bold text-primary">{chosen.length}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bilder im Paket</p><p className="text-2xl font-bold text-foreground">{totalImages}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fehlend</p><p className="text-2xl font-bold text-destructive">{totalMissing}</p></div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={buildPackage} disabled={busy || !chosen.length} className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />} Paket schnüren
        </button>
        <button onClick={selectMissing} disabled={busy} className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold">
          <Wand2 className="w-4 h-4" /> Fehlende auswählen
        </button>
        <button onClick={selectAll} disabled={busy} className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold">
          Alle
        </button>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-elevated border border-border flex-1 min-w-[140px] max-w-[220px]">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bibliothek durchsuchen …"
            className="bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
          />
        </div>
      </div>

      {progress && <p className="text-[12px] text-primary font-bold">{progress}</p>}

      <div className="space-y-2">
        {loading ? <p className="text-[13px] text-muted-foreground">Bibliothek wird durchsucht …</p>
          : filtered.length === 0 ? <p className="text-[13px] text-muted-foreground">Keine Charaktere.</p>
          : filtered.map((r) => (
            <button
              key={r.ch.id}
              onClick={() => toggle(r.ch.id)}
              className={cn(
                "w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                picked[r.ch.id] ? "border-primary bg-primary/10" : "border-border bg-elevated"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0", picked[r.ch.id] ? "bg-primary border-primary" : "border-border")}>
                  {picked[r.ch.id] && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-foreground truncate">{r.ch.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.have} Bilder · Ziel {r.target}</p>
                </div>
              </div>
              {r.missing > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-primary" /> {r.missing} fehlen
                </span>
              ) : (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              )}
            </button>
          ))}
      </div>

      {log.length > 0 && (
        <div className="rounded-xl bg-background border border-border p-3 max-h-40 overflow-y-auto">
          {log.map((l, i) => <p key={i} className="text-[12px] text-foreground whitespace-pre-wrap">{l}</p>)}
        </div>
      )}
    </div>
  );
}

const safeName = (n) => String(n || "charakter").replace(/[^a-z0-9äöüß\-_ ]/gi, "_").trim() || "charakter";

function guessExt(blob, url) {
  const t = blob?.type || "";
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("gif")) return "gif";
  if (url && url.match(/\.(png|webp|gif)$/i)) return url.match(/\.(png|webp|gif)$/i)[1].toLowerCase();
  return "jpg";
}

function readme(m) {
  return [
    "Trainingspaket — Artanis × Tania",
    `Erstellt: ${m.created}`,
    `Ziel pro Charakter: ${m.target} Bilder`,
    "",
    "Inhalt:",
    ...m.characters.map((c) => `  ${c.name}: ${c.packed} gepackt, ${c.missing} fehlen (Ziel ${c.target})`),
    "",
    "Ordner pro Charakter enthalten alle verfügbaren Bilder.",
    "manifest.json listet pro Charakter, was gepackt und was noch fehlt.",
  ].join("\n");
}