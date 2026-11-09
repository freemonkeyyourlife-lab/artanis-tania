import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, X, Cpu, Check, ArrowRight, Target } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";

// Verknüpft Galerie-Medien direkt mit der Trainings-Werkstatt: wähle einen
// bestehenden Trainings-Satz (Person) oder lege einen neuen an. Videos werden
// als Quelle hinterlegt — die Werkstatt extrahiert die Frames automatisch.

export default function SendToTrainingDialog({ open, media, onClose, onDone }) {
  const { toast } = useToast();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [focusUrl, setFocusUrl] = useState("");
  const navigate = useNavigate();

  const urls = (media || [])
    .map((m) => (typeof m === "string" ? m : m?.url))
    .filter(Boolean);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    // Vorschlag: der häufigste Personen-Tag unter den gewählten Medien.
    const tagCount = {};
    (media || []).forEach((m) => (m?.tags || []).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const suggested = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    setNewName(suggested);
    setSelectedId(null);
    setDone(null);
    setFocusUrl(urls[0] || "");
    base44.entities.TrainingSet
      .filter({ status: { $in: ["SAMMLUNG", "BEREIT"] } }, { sort: "order", limit: 50 })
      .then((page) => {
        if (!alive) return;
        setSets(page.items || []);
        if (page.items?.length) setSelectedId(page.items[0].id);
      })
      .catch(() => setSets([]))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open]);

  const confirm = async () => {
    if (!selectedId && !newName.trim()) {
      toast({ variant: "destructive", title: "Kein Ziel", description: "Wähle einen Satz oder gib einen neuen Namen ein." });
      return;
    }
    setBusy(true);
    try {
      let setName;
      if (newName.trim()) {
        const rec = await base44.entities.TrainingSet.create({
          personName: newName.trim(),
          status: "SAMMLUNG",
          sourceMedia: urls,
          focusImage: focusUrl || undefined,
        });
        setName = rec.personName;
      } else {
        const set = sets.find((s) => s.id === selectedId);
        const next = Array.isArray(set?.sourceMedia) ? [...set.sourceMedia, ...urls] : urls;
        const patch = { sourceMedia: next };
        if (focusUrl) patch.focusImage = focusUrl;
        await base44.entities.TrainingSet.update(selectedId, patch);
        setName = set?.personName || "Satz";
      }
      toast({ title: "Ins Training übernommen", description: `${urls.length} Medium(ien) → ${setName}.` });
      onDone?.();
      setDone({ name: setName });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  if (done) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15"><Check className="h-6 w-6 text-primary" /></div>
          <h2 className="font-display text-xl text-foreground">Ins Training übernommen</h2>
          <p className="mt-1 text-xs text-muted-foreground">{urls.length} Medium(ien) → {done.name}. Die Werkstatt extrahiert Video-Frames automatisch zu Bildern.</p>
          <div className="mt-5 flex flex-col gap-2">
            <button onClick={() => navigate("/trainingsset")} className="glass-btn glass-btn-accent inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-sm">
              <Cpu className="h-4 w-4" /> Zur Trainings-Werkstatt <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-full bg-elevated px-5 py-2 text-sm text-muted-foreground hover:text-foreground">Weiter in der Galerie</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground flex items-center gap-1.5"><Cpu className="h-5 w-5 text-primary" /> Ins Training übernehmen</h2>
          <button onClick={onClose} className="rounded-full bg-elevated p-1.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{urls.length} Medium(ien) werden einem Trainings-Satz hinzugefügt — Videos extrahiert die Werkstatt automatisch zu Frames.</p>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <h3 className="mt-4 font-heading text-sm text-foreground">Bestehenden Satz wählen</h3>
            <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto">
              {sets.length === 0 && <p className="text-xs text-muted-foreground">Noch keine offenen Sätze.</p>}
              {sets.map((s) => (
                <button key={s.id} onClick={() => { setSelectedId(s.id); setNewName(""); }}
                  className={"flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors " + (selectedId === s.id ? "border-primary bg-primary/10" : "border-border bg-elevated hover:border-primary/50")}>
                  <span>
                    <span className="block text-sm text-foreground">{s.personName}</span>
                    <span className="text-[11px] text-muted-foreground">{s.status} · {(s.sourceMedia || []).length} Medien</span>
                  </span>
                  {selectedId === s.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>

            <h3 className="mt-4 font-heading text-sm text-foreground">Oder neuen Satz erstellen</h3>
            <input value={newName} onChange={(e) => { setNewName(e.target.value); if (e.target.value) setSelectedId(null); }}
              placeholder="Person / Satz-Name"
              className="mt-2 w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground" />

            {urls.length > 0 && (
              <div className="mt-4">
                <h3 className="font-heading text-sm text-foreground flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-primary" /> Haupt-Charakter festlegen
                </h3>
                <p className="mt-1 text-[11px] text-muted-foreground">Klick das Bild der richtigen Person — sie wird bei Generierung und Training zuerst genommen.</p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {urls.map((u) => (
                    <button key={u} type="button" onClick={() => setFocusUrl(u)}
                      className={"relative aspect-square overflow-hidden rounded-lg border-2 " + (focusUrl === u ? "border-primary" : "border-transparent")}>
                      <Image src={u} fittingType="fill" className="h-full w-full" />
                      {focusUrl === u && (
                        <span className="absolute bottom-0 inset-x-0 bg-primary/85 text-center text-[10px] font-bold text-primary-foreground">Fokus</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-full bg-elevated px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Abbrechen</button>
              <button onClick={confirm} disabled={busy || (!selectedId && !newName.trim())}
                className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />} Übernehmen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}