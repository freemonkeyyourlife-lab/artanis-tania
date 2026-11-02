import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, FolderSearch, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { loadArchiveQuellen, signQuelleUrl } from "@/lib/quelleArchive";

// Archiv-Wähler: alle archivierten Bilder (Quelle BILD/GIF) mit Vorschau,
// Mehrfachauswahl, Person wählen und dann „Übernehmen & trainieren" — die
// Seite schneidet sie zu, übernimmt sie ins Set, füllt auf, zieht den Charakter
// und meldet sich zurück. Ohne Unterbrechung, ein einziger Klick am Ende.
export default function ArchivePicker({ onTrain, sets = [] }) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [thumbs, setThumbs] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [person, setPerson] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const list = await loadArchiveQuellen(200);
        const imgs = list.filter((q) => q.kind === "BILD" || q.kind === "GIF");
        setItems(imgs);
        // Vorschauen signieren (private fileUri) oder direkt nehmen.
        const map = {};
        for (const q of imgs) {
          map[q.id] = await signQuelleUrl(q).catch(() => "");
        }
        setThumbs(map);
      } catch (e) {
        toast({ variant: "destructive", title: "Archiv laden fehlgeschlagen", description: e?.message || "Fehler." });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const go = () => {
    const chosen = items.filter((q) => selected.includes(q.id));
    if (!chosen.length) return;
    if (!person.trim()) {
      toast({ variant: "destructive", title: "Person fehlt", description: "Gib an, für wen die Bilder sind." });
      return;
    }
    onTrain?.(chosen, person.trim());
    setSelected([]);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <FolderSearch className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-foreground">Aus Archiv wählen</h2>
        {items.length > 0 && (
          <span className="text-xs text-muted-foreground">{items.length} Bilder · {selected.length} gewählt</span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Bilder ankreuzen, Person wählen, fertig — sie werden zugeschnitten, übernommen, aufgefüllt und trainiert.
      </p>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Noch keine Bilder im Archiv — lade etwas hoch.</p>
      ) : (
        <div className="mt-3 max-h-72 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 overflow-y-auto scrollbar-hide">
          {items.map((q) => (
            <button
              key={q.id}
              onClick={() => toggle(q.id)}
              className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition-colors ${selected.includes(q.id) ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
            >
              {thumbs[q.id] ? (
                <Image src={thumbs[q.id]} fittingType="fill" className="h-full w-full" />
              ) : (
                <div className="h-full w-full animate-pulse bg-elevated" />
              )}
              {selected.includes(q.id) && (
                <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            list="persons"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Person für die gewählten Bilder"
            className="flex-1 min-w-[200px] rounded-lg bg-background px-3 py-2 text-sm text-foreground"
          />
          <datalist id="persons">
            {sets.map((s) => (
              <option key={s.id} value={s.personName} />
            ))}
          </datalist>
          <button
            onClick={go}
            disabled={!selected.length || !person.trim()}
            className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm disabled:opacity-50"
          >
            <Zap className="h-4 w-4" /> Übernehmen & trainieren
          </button>
        </div>
      )}
    </section>
  );
}