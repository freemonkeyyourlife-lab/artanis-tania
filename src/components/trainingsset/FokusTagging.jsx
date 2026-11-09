import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Target, Check, X, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

// Fokus-Tagging für einen Trainings-Satz: das Referenzbild der Fokus-Person
// markieren und Bilder, auf denen eine ANDERE Person zu sehen ist, auf "raus"
// stellen. "Neu trainieren" speichert beides und schickt das Set wieder auf
// die GPU — trainiert wird nur mit den "rein"-Bildern, das Fokus-Bild zuerst.
// (Vollautomatische Gesichtserkennung über Tausende Bilder baut die Plattform
// nicht — das schnelle Abhaken führt aber zum selben Ergebnis.)

const signOne = async (uri) => {
  if (!uri) return "";
  if (uri.startsWith("http")) return uri;
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 3600 });
    return r?.signed_url || "";
  } catch {
    return "";
  }
};

export default function FokusTagging({ set, onSaved }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(set.focusImage || "");
  const [exclude, setExclude] = useState(() => new Set(set.excludeImages || []));
  const [urls, setUrls] = useState({});
  const [cap, setCap] = useState(120);
  const [saving, setSaving] = useState(false);

  const all = useMemo(
    () => [...(set.images || []), ...(set.generatedImages || [])].filter(Boolean),
    [set.images, set.generatedImages]
  );
  const effective = all.filter((u) => !exclude.has(u)).length;

  // Nur die sichtbaren Thumbnails signieren — sonst wird es bei Tausenden zu viel.
  const shown = all.slice(0, cap);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map = {};
      for (const u of shown) {
        if (urls[u]) continue;
        const s = await signOne(u);
        if (s) map[u] = s;
      }
      if (!cancelled && Object.keys(map).length) setUrls((m) => ({ ...m, ...map }));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown.join("|")]);

  const toggle = (u) =>
    setExclude((prev) => {
      const n = new Set(prev);
      if (n.has(u)) n.delete(u);
      else n.add(u);
      return n;
    });

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.TrainingSet.update(set.id, {
        focusImage: focus || null,
        excludeImages: [...exclude],
      });
      toast({ title: "Gespeichert", description: `${effective} Bild(er) kommen ins Training.` });
      onSaved?.();
    } catch (e) {
      toast({ variant: "destructive", title: "Nicht gespeichert", description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const retrain = async () => {
    setSaving(true);
    try {
      await base44.entities.TrainingSet.update(set.id, {
        focusImage: focus || null,
        excludeImages: [...exclude],
        trainStatus: "OFFEN",
        trainError: "",
      });
      const res = await base44.functions.invoke("runpodTrain", { setId: set.id });
      if (res?.data?.error) throw new Error(res.data.error);
      toast({ title: "Neu trainiert", description: "Läuft auf der GPU — nur die Fokus-Person." });
      onSaved?.();
    } catch (e) {
      toast({ variant: "destructive", title: "Nicht gestartet", description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-border bg-background/60 p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-sm font-heading text-foreground"
      >
        <span className="inline-flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Fokus & neu trainieren
          <span className="text-[11px] font-normal text-muted-foreground">
            {effective} rein · {exclude.size} raus{focus ? " · Fokus gesetzt" : ""}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">
            Klick das <b>Fokus-Bild</b> der richtigen Person (kommt zuerst ins Training). Stell Bilder
            mit der falschen Person auf <b>raus</b>. Dann „Neu trainieren".
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2 max-h-80 overflow-y-auto pr-1">
            {shown.map((u) => {
              const isFocus = focus === u;
              const out = exclude.has(u);
              return (
                <div key={u} className="relative aspect-square overflow-hidden rounded-lg bg-elevated">
                  {urls[u] ? (
                    <Image src={urls[u]} fittingType="fill" className="h-full w-full" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">…</div>
                  )}
                  <button
                    onClick={() => setFocus(isFocus ? "" : u)}
                    title="Als Fokus-Bild markieren"
                    className={"absolute left-1 top-1 rounded-full p-1 " + (isFocus ? "bg-primary text-primary-foreground" : "bg-black/60 text-white hover:bg-primary")}
                  >
                    <Target className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => toggle(u)}
                    title={out ? "Wieder rein" : "Auf raus stellen"}
                    className={"absolute right-1 top-1 rounded-full p-1 " + (out ? "bg-destructive text-white" : "bg-black/60 text-white hover:bg-destructive")}
                  >
                    {out ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  </button>
                  {out && <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-[10px] font-bold text-white">raus</div>}
                  {isFocus && <div className="absolute bottom-0 inset-x-0 bg-primary/85 text-center text-[10px] font-bold text-primary-foreground">Fokus</div>}
                </div>
              );
            })}
          </div>
          {all.length > cap && (
            <button onClick={() => setCap((c) => c + 120)} className="mt-2 text-xs text-primary hover:underline">
              Mehr anzeigen ({all.length - cap} weitere)
            </button>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={save} disabled={saving} className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Nur speichern
            </button>
            <button onClick={retrain} disabled={saving || effective < 1} className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Neu trainieren
            </button>
            <span className="text-[11px] text-muted-foreground">Trainiert mit {effective} Bild(er) — nur die Fokus-Person.</span>
          </div>
        </div>
      )}
    </div>
  );
}