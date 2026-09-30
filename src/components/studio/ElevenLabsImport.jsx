import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Download, Plus, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Stimmen, die im ElevenLabs-Konto liegen, mit einem Klick in die Stimmbank holen.
export default function ElevenLabsImport({ existingIds = [], onImported }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(null);

  const load = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("elevenLabs", { action: "voices" });
      if (res.data?.error) throw new Error(res.data.error);
      setList(res.data.voices || []);
    } catch (e) {
      toast({ title: "Stimmen kamen nicht an", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && list.length === 0) load();
  };

  const take = async (v) => {
    setAdding(v.id);
    try {
      await base44.entities.Voice.create({
        name: v.name,
        provider: "ELEVENLABS",
        externalVoiceId: v.id,
        baseVoice: "honey",
        source: "HOCHGELADEN",
        originNote: "Von ElevenLabs",
        description: v.description || "",
        tags: v.labels || [],
        active: true,
      });
      onImported?.();
    } catch (e) {
      toast({ title: "Konnte nicht übernehmen", description: e.message, variant: "destructive" });
    } finally {
      setAdding(null);
    }
  };

  const takeAll = async () => {
    const missing = list.filter((v) => !existingIds.includes(v.id));
    for (const v of missing) await take(v);
    toast({ title: `${missing.length} Stimmen übernommen` });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <p className="font-display text-lg text-foreground">Aus ElevenLabs holen</p>
          <p className="text-xs text-muted-foreground">
            Die Stimmen aus deinem dortigen Konto — eigene, geklonte und fertige. Danach sind sie hier wie jede andere Stimme nutzbar.
          </p>
        </div>
        <button
          onClick={toggle}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
            open ? "bg-elevated border border-border text-muted-foreground" : "bg-primary text-primary-foreground"
          )}
        >
          <Download className="w-4 h-4" /> {open ? "Zuklappen" : "Stimmen anzeigen"}
        </button>
      </div>

      {open && (
        <div className="mt-4">
          {busy ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Keine Stimmen gemeldet. Leg bei ElevenLabs eine an oder lade eine hoch, dann hier neu laden.
            </p>
          ) : (
            <>
              {list.some((v) => !existingIds.includes(v.id)) && (
                <button
                  onClick={takeAll}
                  className="mb-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-elevated border border-border text-xs font-semibold text-foreground hover:border-primary/50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Alle noch fehlenden übernehmen
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {list.map((v) => {
                  const have = existingIds.includes(v.id);
                  return (
                    <div key={v.id} className="p-3 rounded-xl bg-elevated border border-border flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">{v.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {v.category || "Stimme"}{v.labels?.length ? ` · ${v.labels.join(", ")}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => take(v)}
                        disabled={have || adding === v.id}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors",
                          have ? "bg-emerald-600/20 text-emerald-400" : "bg-primary text-primary-foreground disabled:opacity-50"
                        )}
                      >
                        {adding === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : have ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {adding === v.id ? "Holt …" : have ? "Drin" : "Übernehmen"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}