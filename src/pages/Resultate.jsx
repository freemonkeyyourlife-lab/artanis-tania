import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { Loader2, Lock, Sparkles, Download, Wand2, Package, Images, Cpu } from "lucide-react";
import JSZip from "jszip";
import FokusTagging from "@/components/trainingsset/FokusTagging";
import ResultSetGenerator from "@/components/resultate/ResultSetGenerator";

// Resultate & Vorschau: alle fertig trainierten KI-Charaktere an einem Ort.
// Pro Charakter die generierten Bilder sehen, ein neues Bild in Aktion
// erzeugen und alles (Einzelbild oder als ZIP) auf die Festplatte laden.

const norm = (n) => String(n || "").trim().toLowerCase();

export default function Resultate() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [zipping, setZipping] = useState(null);
  const [prompt, setPrompt] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        base44.entities.TrainingSet.filter({}, { sort: "-created_date", limit: 200 }),
        base44.entities.Character.filter({}, { sort: "-created_date", limit: 200 }),
      ]);
      const sets = s.items || [];
      const chars = c.items || [];
      const done = sets.filter(
        (x) => x.status === "TRAINIERT" || x.trainStatus === "FERTIG" || (x.generatedImages?.length > 0) || x.modelUrl
      );
      setRows(done.map((set) => ({ set, char: chars.find((ch) => norm(ch.name) === norm(set.personName)) })));
    } catch (e) {
      toast({ variant: "destructive", title: "Nicht geladen", description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null)).finally(() => setMeLoading(false));
    load();
  }, []);

  const ctx = (r) => {
    const c = r.char;
    return [
      `Charakter: ${r.set.personName || c?.name || ""}.`,
      c?.appearance ? `Aussehen: ${c.appearance}.` : "",
      c?.personality ? `Persönlichkeit: ${c.personality}.` : "",
      c?.description ? `Beschreibung: ${c.description}.` : "",
    ].filter(Boolean).join(" ");
  };

  const generate = async (r) => {
    if (busy === r.set.id) return;
    setBusy(r.set.id);
    try {
      const p = (prompt[r.set.id] || "").trim();
      const full = `${ctx(r)}${p ? `\n\nSzene: ${p}` : ""}. Bildstil: fotorealistisch, stimmungsvoll.`;
      const res = await base44.integrations.Core.GenerateImage({ prompt: full });
      const next = [...(r.set.generatedImages || []), res?.url].filter(Boolean);
      await base44.entities.TrainingSet.update(r.set.id, { generatedImages: next });
      setRows((xs) => xs.map((x) => (x.set.id === r.set.id ? { ...x, set: { ...x.set, generatedImages: next } } : x)));
      toast({ title: "Bild erzeugt" });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(null);
    }
  };

  // Übernimmt die nach einem Set-Lauf aufgefüllten Bilder in die Ansicht,
  // ohne neu laden zu müssen.
  const onSetUpdated = (next) => setRows((xs) => xs.map((x) => (x.set.id === next.set.id ? next : x)));

  const downloadImage = (url, name) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "bild.png";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const zipAll = async (r) => {
    if (zipping === r.set.id) return;
    setZipping(r.set.id);
    try {
      const zip = new JSZip();
      const imgs = r.set.generatedImages || [];
      let added = 0;
      for (let i = 0; i < imgs.length; i++) {
        try {
          const res = await fetch(imgs[i]);
          if (!res.ok) continue;
          const blob = await res.blob();
          const ext = (imgs[i].split(".").pop() || "png").split(/[?#]/)[0].slice(0, 4);
          zip.file(`bild-${String(i + 1).padStart(2, "0")}.${ext}`, blob);
          added++;
        } catch { /* skip */ }
      }
      zip.file("liesmich.txt", `Charakter: ${r.set.personName || r.set.name || ""}\nBilder: ${added}\nErzeugt: ${new Date().toLocaleString("de-DE")}`);
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `charakter-${(r.set.personName || r.set.name || "resultat").replace(/[^a-z0-9_-]+/gi, "_")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast({ title: "ZIP gespeichert", description: `${added} Bild(er) auf die Platte.` });
    } catch (e) {
      toast({ variant: "destructive", title: "ZIP fehlgeschlagen", description: e?.message });
    } finally {
      setZipping(null);
    }
  };

  if (meLoading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!me || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-2xl text-foreground">Nur für dich</h1>
        <p className="mt-2 text-sm text-muted-foreground">Resultate sind privat — melde dich als Besitzerin an.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" /> Resultate & Vorschau
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Deine fertig trainierten Charaktere in Aktion: Bilder ansehen, neues Bild erzeugen und alles auf die Festplatte laden.
          </p>
        </div>
        <Link to="/studio-uebersicht" className="glass-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm"><Cpu className="h-4 w-4" /> Studio-Übersicht</Link>
      </div>

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lade Resultate …</div>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <Images className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-foreground font-heading">Noch keine fertigen Resultate</p>
          <p className="text-xs text-muted-foreground">Trainiere einen Satz oder erzeuge Bilder in der Werkstatt.</p>
          <Link to="/trainingsset" className="glass-btn glass-btn-accent mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm"><Cpu className="h-4 w-4" /> Zur Werkstatt</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((r) => {
            const imgs = r.set.generatedImages || [];
            return (
              <div key={r.set.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-elevated">
                    {r.set.avatar ? <Image src={r.set.avatar} fittingType="fill" className="h-full w-full" /> :
                      imgs[0] ? <Image src={imgs[0]} fittingType="fill" className="h-full w-full" /> :
                      <div className="flex h-full w-full items-center justify-center"><Cpu className="h-5 w-5 text-muted-foreground" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-foreground">{r.set.personName || r.set.name || "Ohne Name"}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-primary px-2 py-0.5 font-bold text-primary-foreground">{r.set.status}</span>
                      <span className="inline-flex items-center gap-1"><Images className="h-3 w-3" /> {imgs.length} Bilder</span>
                      {r.set.modelUrl && <span className="inline-flex items-center gap-1 text-primary"><Package className="h-3 w-3" /> Modell vorhanden</span>}
                      {r.char && <Link to={`/charakter/${r.char.id}`} className="text-primary hover:underline">Charakter öffnen</Link>}
                    </div>
                  </div>
                  <button onClick={() => zipAll(r)} disabled={zipping === r.set.id || !imgs.length} title="Alle Bilder dieses Charakters als ZIP auf die Festplatte speichern"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                    {zipping === r.set.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />} Alles als ZIP
                  </button>
                </div>

                {imgs.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {imgs.map((u, i) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-elevated">
                        <Image src={u} fittingType="fill" className="h-full w-full" />
                        <button onClick={() => downloadImage(u, `${(r.set.personName || "bild").replace(/[^a-z0-9_-]+/gi, "_")}-${i + 1}.png`)} title="Dieses Bild auf die Festplatte speichern"
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-primary group-hover:opacity-100">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Noch keine Bilder — gleich eines erzeugen.</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input value={prompt[r.set.id] || ""} onChange={(e) => setPrompt((p) => ({ ...p, [r.set.id]: e.target.value }))}
                    placeholder="Szene für neues Bild, z. B. im Mondschein am Fenster"
                    className="flex-1 min-w-[14rem] rounded-full bg-elevated px-3 py-2 text-sm text-foreground" />
                  <button onClick={() => generate(r)} disabled={busy === r.set.id} title="Neues Bild aus diesem Charakter erzeugen"
                    className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm disabled:opacity-50">
                    {busy === r.set.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Neues Bild
                  </button>
                </div>

                <ResultSetGenerator row={r} onUpdated={onSetUpdated} />

                <FokusTagging set={r.set} onSaved={load} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}