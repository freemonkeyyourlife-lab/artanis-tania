import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, Lock, Play, Download, Sparkles } from "lucide-react";

// Spielbar — die kleine Klappe für fertige Charaktere.
// Ganz simpel: Liste, Spielen, Exportieren. Nichts weiter.

const norm = (n) => String(n || "").trim().toLowerCase();

export default function Spielbar() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!me) return;
    (async () => {
      try {
        const [s, c] = await Promise.all([
          base44.entities.TrainingSet.filter({}, { sort: "-created_date", limit: 200 }),
          base44.entities.Character.filter({}, { sort: "-created_date", limit: 200 }),
        ]);
        const sets = (s.items || []).filter((x) => x.trainStatus === "FERTIG" || x.status === "TRAINIERT" || x.modelUrl);
        const chars = c.items || [];
        setRows(sets.map((set) => ({
          id: set.id,
          name: set.personName || set.name || "Ohne Name",
          img: set.avatar || set.generatedImages?.[0] || set.focusImage || set.images?.[0] || "",
          char: chars.find((ch) => norm(ch.name) === norm(set.personName)),
        })));
      } catch {
        setRows([]);
      }
    })();
  }, [me]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!me) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Bitte anmelden.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-3xl text-foreground text-gloss flex items-center gap-2">
        <Play className="h-7 w-7 text-primary" /> Spielbar
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Fertige Charaktere. Anklicken, spielen, exportieren.</p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Noch keine fertigen Charaktere.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="aspect-[3/4] bg-elevated">
                {r.img
                  ? <Image src={r.img} fittingType="fill" className="h-full w-full" />
                  : <div className="flex h-full items-center justify-center"><Sparkles className="h-8 w-8 text-muted-foreground" /></div>}
              </div>
              <div className="p-2">
                <p className="truncate text-sm font-heading text-foreground">{r.name}</p>
                <div className="mt-2 flex gap-1.5">
                  <Link to={r.char ? `/charakter/${r.char.id}` : "/messages"} className="flex-1 inline-flex items-center justify-center gap-1 rounded-full bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground">
                    <Play className="h-3 w-3" /> Spielen
                  </Link>
                  <Link to="/resultate" className="inline-flex items-center justify-center rounded-full bg-elevated px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground" title="Exportieren">
                    <Download className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}