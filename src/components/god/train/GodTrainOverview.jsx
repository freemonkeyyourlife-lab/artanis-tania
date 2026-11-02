import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import JSZip from "jszip";
import { Loader2, Archive, FolderPlus, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { signMedia } from "@/lib/mediaSign";

const norm = (n) => String(n || "").trim().toLowerCase();

export default function GodTrainOverview() {
  const [sets, setSets] = useState([]);
  const [chars, setChars] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        base44.entities.TrainingSet.filter({}, { sort: "-created_date", limit: 100 }),
        base44.entities.Character.filter({}, { sort: "-created_date", limit: 100 }),
      ]);
      setSets(s.items || []);
      setChars(c.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  const rows = chars.map((ch) => {
    const set = sets.find((s) => norm(s.personName) === norm(ch.name));
    const have = set ? (set.images?.length || 0) + (set.generatedImages?.length || 0) : 0;
    const target = set?.targetCount || 12;
    return { ch, set, have, target, missing: set ? Math.max(0, target - have) : target, state: !set ? "none" : have >= target ? "ready" : "missing" };
  });

  const ready = rows.filter((r) => r.state === "ready").length;
  const missing = rows.filter((r) => r.state === "missing");
  const none = rows.filter((r) => r.state === "none");
  const totalMissing = missing.reduce((a, r) => a + r.missing, 0) + none.reduce((a, r) => a + r.missing, 0);

  const note = (m) => setLog((l) => [...l.slice(-12), m]);

  const createMissing = async () => {
    if (!none.length || busy) return;
    setBusy(true);
    try {
      await base44.entities.TrainingSet.bulkCreate(
        none.map((r) => ({ name: r.ch.name, personName: r.ch.name, targetCount: 12, status: "SAMMLUNG", order: 0 }))
      );
      note(`${none.length} Sets angelegt.`);
      await load();
    } catch (e) {
      note("Anlegen fehlgeschlagen: " + (e?.message || "?"));
    } finally {
      setBusy(false);
    }
  };

  const prepareZips = async () => {
    if (!sets.length || busy) return;
    setBusy(true);
    setLog([]);
    let done = 0;
    try {
      for (const s of sets) {
        const all = [...(s.images || []), ...(s.generatedImages || [])];
        if (!all.length) {
          note(`Übersprungen: ${s.personName} (keine Bilder)`);
          continue;
        }
        const zip = new JSZip();
        let i = 0;
        for (const u of all) {
          const url = await signMedia(u);
          if (!url) continue;
          try {
            const blob = await (await fetch(url)).blob();
            zip.file(`${s.personName || "bild"}_${String(i + 1).padStart(2, "0")}.jpg`, blob);
            i += 1;
          } catch { /* einzelnes Bild überspringen */ }
        }
        if (!i) continue;
        const out = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(out);
        a.download = `${s.personName}-trainingsset.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
        done += 1;
        note(`ZIP bereit: ${s.personName} (${i} Bilder)`);
      }
      note(`Fertig — ${done} ZIP-Pakete.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-elevated border border-border p-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bereit</p><p className="text-2xl font-bold text-primary">{ready}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Zu wenig</p><p className="text-2xl font-bold text-foreground">{missing.length}</p></div>
          <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Kein Set</p><p className="text-2xl font-bold text-destructive">{none.length}</p></div>
        </div>
        {totalMissing > 0 && <p className="mt-2 text-center text-[12px] text-muted-foreground">Insgesamt fehlen <b className="text-foreground">{totalMissing}</b> Bilder.</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={prepareZips} disabled={busy || !sets.length} className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />} Alle ZIPs
        </button>
        <button onClick={createMissing} disabled={busy || !none.length} className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold disabled:opacity-50">
          <FolderPlus className="w-4 h-4" /> Sets anlegen ({none.length})
        </button>
      </div>

      <div className="space-y-2">
        {loading ? <p className="text-[13px] text-muted-foreground">Lädt …</p> : rows.length === 0 ? <p className="text-[13px] text-muted-foreground">Keine Charaktere.</p> : rows.map((r) => (
          <div key={r.ch.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 bg-elevated">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-foreground truncate">{r.ch.name}</p>
              <p className="text-[11px] text-muted-foreground">{r.set ? `${r.have}/${r.target} Bilder` : "kein Set"}</p>
            </div>
            {r.state === "ready" ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              : r.state === "missing" ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground shrink-0"><AlertTriangle className="w-3.5 h-3.5 text-primary" /> {r.missing} fehlen</span>
              : <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive shrink-0"><Plus className="w-3.5 h-3.5" /> Set fehlt</span>}
          </div>
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