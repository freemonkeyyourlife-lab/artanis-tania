import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, Check, X, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { createCreatorFromDock, DOCK_STATUS, BLEND_OPTIONS, PERSONA_TYPES } from "@/lib/dock";

const label = (list, id) => list.find((x) => x.id === id)?.label || id || "—";

// Was hereinkommt, landet hier zur Freigabe.
export default function DockManager() {
  const { toast } = useToast();
  const [docks, setDocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await base44.entities.Dock.list("-created_date", 100);
      setDocks(data.sort((a, b) => (a.status === "PENDING" ? 0 : 1) - (b.status === "PENDING" ? 0 : 1)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (d) => {
    setBusy(d.id);
    try {
      await createCreatorFromDock(d);
      toast({ title: "Freigegeben", description: `${d.name} ist ab jetzt im Chat wählbar.` });
      load();
    } catch (e) {
      toast({ title: "Nicht freigegeben", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const reject = async (d) => {
    await base44.entities.Dock.update(d.id, { status: "REJECTED" });
    load();
  };

  const remove = async (d) => {
    if (!window.confirm(`"${d.name}" wirklich löschen?`)) return;
    await base44.entities.Dock.delete(d.id);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const pending = docks.filter((d) => d.status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl text-foreground mb-1">Dockingstation</h2>
        <p className="text-xs text-muted-foreground">
          Alles, was Nutzer mitbringen. Freigegeben wird es zu einem echten Charakter — mit unserer Persönlichkeit darin.
        </p>
        <p className="text-xs text-amber-400 mt-2">{pending.length} warten auf Freigabe.</p>
      </div>

      {docks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Noch nichts angedockt.</p>
      ) : (
        docks.map((d) => (
          <div key={d.id} className={cn("rounded-2xl border bg-card p-5", d.status === "PENDING" ? "border-amber-500/40" : "border-border")}>
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl bg-elevated flex-shrink-0 overflow-hidden">
                {d.avatar ? (
                  <Image src={d.avatar} fittingType="fill" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display text-2xl text-primary">{(d.name || "?")[0]}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg text-foreground truncate">{d.name}</p>
                    {d.tagline && <p className="text-xs text-muted-foreground">{d.tagline}</p>}
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap",
                    d.status === "APPROVED" ? "bg-emerald-600/20 text-emerald-400" : d.status === "REJECTED" ? "bg-destructive/20 text-destructive" : "bg-amber-500/20 text-amber-400")}>
                    {DOCK_STATUS[d.status]}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {label(PERSONA_TYPES, d.personaType)} · gemischt mit {label(BLEND_OPTIONS, d.blendWith)} ({d.blendStrength ?? 60} %)
                  {d.submittedByName ? ` · von ${d.submittedByName}` : ""}
                </p>
                {d.personality && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{d.personality}</p>}
                {d.greeting && <p className="text-sm text-foreground/80 mt-2 italic">„{d.greeting}"</p>}
                {d.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {d.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-elevated border border-border text-[10px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
                {d.sourceUrl && (
                  <a href={d.sourceUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline mt-2 inline-block break-all">{d.sourceUrl}</a>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {d.status !== "APPROVED" && (
                    <button onClick={() => approve(d)} disabled={busy === d.id} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
                      {busy === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Freigeben
                    </button>
                  )}
                  {d.status !== "REJECTED" && (
                    <button onClick={() => reject(d)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-elevated border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" /> Ablehnen
                    </button>
                  )}
                  <button onClick={() => remove(d)} className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}