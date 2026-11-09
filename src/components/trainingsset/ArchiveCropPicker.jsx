import React, { useEffect, useState } from "react";
import { Image } from "@/components/ui/image";
import { Loader2, FolderSearch, Crop, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { loadArchiveQuellen, signQuelleUrl } from "@/lib/quelleArchive";
import { cropIntoSet, ensureSet } from "@/lib/trainingFlow";

// Archiv → nur zuschneiden & übernehmen: wähle Bilder aus dem Archiv, wähle
// den aktuellen Trainingslauf (Set) und nimm sie zugeschnitten auf 3:4 direkt
// dorthin. Kein Auffüllen, kein Charakter — nur die Bilder für diesen Lauf.
export default function ArchiveCropPicker({ sets, onDone }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [thumbs, setThumbs] = useState({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [targetId, setTargetId] = useState("");
  const [newPerson, setNewPerson] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await loadArchiveQuellen(200);
      const imgs = list.filter((q) => q.kind === "BILD" || q.kind === "GIF");
      setItems(imgs);
      const map = {};
      for (const q of imgs) {
        map[q.id] = await signQuelleUrl(q).catch(() => "");
      }
      setThumbs(map);
    } catch (e) {
      toast({ variant: "destructive", title: "Archiv laden fehlgeschlagen", description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const go = async () => {
    const chosen = items.filter((q) => selected.includes(q.id));
    if (!chosen.length) return;
    let setId = targetId;
    let person = "";
    if (!setId) {
      person = newPerson.trim();
      if (!person) {
        toast({ variant: "destructive", title: "Ziel fehlt", description: "Wähle einen Trainingslauf oder gib eine neue Person ein." });
        return;
      }
    }
    setBusy(true);
    try {
      if (!setId) {
        const target = await ensureSet(person, sets);
        setId = target.id;
      }
      const { taken } = await cropIntoSet(setId, chosen);
      setSelected([]);
      onDone?.();
      if (!taken) {
        toast({ variant: "destructive", title: "Nichts übernommen", description: "Bilder ließen sich nicht zuschneiden." });
      } else {
        toast({ title: "Zugeschnitten & übernommen", description: `${taken} Bild(er) in den Trainingslauf übernommen.` });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="rounded-xl bg-elevated p-3" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer flex items-center gap-2 text-sm font-heading text-foreground">
        <Crop className="h-4 w-4 text-primary" /> Bilder aus Archiv für diesen Trainingslauf zuschneiden
      </summary>
      <p className="mt-2 text-xs text-muted-foreground">
        Archiv-Bilder ankreuzen, Trainingslauf wählen, übernehmen — sie werden auf 3:4 zugeschnitten (stored privately) und landen direkt im Set. Kein Auffüllen, kein Charakter.
      </p>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Noch keine Bilder im Archiv.</p>
      ) : (
        <>
          <div className="mt-3 max-h-64 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 overflow-y-auto scrollbar-hide">
            {items.map((q) => (
              <button
                key={q.id}
                onClick={() => toggle(q.id)}
                className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition-colors ${selected.includes(q.id) ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
              >
                {thumbs[q.id] ? (
                  <Image src={thumbs[q.id]} fittingType="fill" className="h-full w-full" />
                ) : (
                  <div className="h-full w-full animate-pulse bg-background" />
                )}
                {selected.includes(q.id) && (
                  <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="rounded-lg bg-background px-3 py-2 text-sm text-foreground max-w-[14rem]"
            >
              <option value="">— Trainingslauf wählen —</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>{s.personName}</option>
              ))}
            </select>
            {!targetId && (
              <input
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                placeholder="oder neue Person"
                className="flex-1 min-w-[160px] rounded-lg bg-background px-3 py-2 text-sm text-foreground"
              />
            )}
            <button
              onClick={go}
              disabled={busy || !selected.length || (!targetId && !newPerson.trim())}
              className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crop className="h-4 w-4" />}
              Zuschneiden & übernehmen
            </button>
            {selected.length > 0 && (
              <span className="text-xs text-muted-foreground">{selected.length} gewählt</span>
            )}
          </div>
        </>
      )}
    </details>
  );
}