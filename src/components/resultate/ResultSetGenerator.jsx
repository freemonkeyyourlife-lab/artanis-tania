import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wand2, Layers, Check, X, Cpu } from "lucide-react";
import { generateCharImage } from "@/lib/generateCharImage";

// Set-Generator für die Resultate-Seite: statt nur ein Bild erzeugt er auf
// einen Knopf ein ganzes Set — verschiedene Outfits, Posen und Stimmungen —
// damit du sofort siehst, ob der trainierte Charakter in jeder Lage hält.

// Posen-Modus: reine Haltungen im Alltags-Outfit — Sitzend, Stehend, Laufend,
// Autofahrend … — damit du sofort siehst, ob der Charakter in jeder Lage hält.
const POSES = [
  { key: "pose_sitz", label: "Sitzend", prompt: "sitzt in lässigem Alltags-Outfit auf einem Sofa, entspannt, warmes Wohnzimmerlicht" },
  { key: "pose_steh", label: "Stehend", prompt: "steht in lässigem Alltags-Outfit, natürliche Haltung, helles Tageslicht" },
  { key: "pose_lauf", label: "Laufend", prompt: "läuft in lässigem Alltags-Outfit über eine Straße, in Bewegung, dynamisches Gegenlicht" },
  { key: "pose_auto", label: "Autofahrend", prompt: "fährt Auto, hält das Lenkrad, lockeres Outfit, Straßenlicht der Nacht spiegelt im Glas" },
  { key: "pose_lieg", label: "Liegend", prompt: "liegt entspannt in Alltags-Outfit auf einer Couch, weiches Leselicht" },
  { key: "pose_lach", label: "Lachend", prompt: "lacht fröhlich in lässigem Alltags-Outfit, helles Gegenlicht, natürliche Freude" },
];

// Detaillierte Szenen — Outfit + Pose + Stimmung, für feinere Prüfungen.
const SCENES = [
  { key: "alltag_sitz", label: "sitzend, Alltag", prompt: "sitzt entspannt auf einem Sofa, lässiges Alltags-Outfit, Jeans und Shirt, warmes Wohnzimmerlicht" },
  { key: "cafe_trinkt", label: "trinkend, Café", prompt: "sitzt in einem Café und trinkt Kaffee, Sommerkleid, sanftes Tageslicht durchs Fenster, leichtes Lächeln" },
  { key: "business_tel", label: "Business, telefonierend", prompt: "steht in Business-Outfit mit Blazer am Fenster und telefoniert, kühle Bürobeleuchtung, konzentrierter Blick" },
  { key: "winter_mantel", label: "Wintermantel, spazierend", prompt: "spaziert in einem dicken Wintermantel über einen Schneeweg, Atemwölkchen, weiches winterliches Gegenlicht" },
  { key: "shirt_kueche", label: "Küche, nur Shirt", prompt: "steht in der Küche mit nur einem übergroßen Shirt und balanciert eine Tasse, ungekämmtes Haar, helles Morgenlicht" },
  { key: "auto_fahr", label: "Autofahrend, detail", prompt: "fährt Auto, hält das Lenkrad, Sonnenbrille auf, lockeres Outfit, Straßenlicht der Nacht spiegelt im Glas" },
  { key: "lachen_gehen", label: "lachend, laufend", prompt: "lacht herzhaft und läuft über eine belebte Straße, Mantel und Stiefel, dynamische Bewegung, helles Gegenlicht" },
  { key: "weinen_abend", label: "weinend, Abendkleid", prompt: "eine Träne auf der Wange, sitzt allein am Fenster, dunkles Abendkleid, gedämpftes Mondlicht, melancholische Stimmung" },
  { key: "strand_bade", label: "am Strand, Bademode", prompt: "steht am Strand in Bademode, Salztropfen auf der Haut, goldene Stunde, weht der Wind durchs Haar" },
  { key: "leder_liegt", label: "liegend, Leder", prompt: "liegt auf einem Ledersofa, enge Jeans und Top, weiche Leselampe, selbstbewusster Blick in die Kamera" },
  { key: "tanzen_abend", label: "tanzend, Abendkleid", prompt: "tanzt in einem schimmernden Abendkleid, Club-Licht, verschwommene Lichtpunkte im Hintergrund, in Bewegung" },
  { key: "unterwaesche_liegt", label: "Unterwäsche, liegend", prompt: "liegt auf weißen Laken in Unterwäsche, weiche Morgensonne fällt durch die Jalousie, intime ruhige Stimmung" },
];

// Vorauswahl = die Posen — so sieht man auf einen Blick, ob der Charakter hält.
const DEFAULT_SEL = POSES.map((p) => p.key);

export default function ResultSetGenerator({ row, onUpdated }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(DEFAULT_SEL);
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);

  const ctx = useMemo(() => {
    const c = row.char;
    return [
      `Charakter: ${row.set.personName || c?.name || ""}.`,
      c?.appearance ? `Aussehen: ${c.appearance}.` : "",
      c?.personality ? `Persönlichkeit: ${c.personality}.` : "",
      c?.description ? `Beschreibung: ${c.description}.` : "",
    ].filter(Boolean).join(" ");
  }, [row]);

  const toggle = (k) => setSel((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));

  const run = async () => {
    const scenes = [...POSES, ...SCENES].filter((s) => sel.includes(s.key));
    const tasks = [...scenes];
    if (extra.trim()) tasks.push({ key: "extra", label: "eigene Szene", prompt: extra.trim() });
    if (!tasks.length) {
      toast({ variant: "destructive", title: "Nichts ausgewählt", description: "Wähle mindestens eine Szene." });
      return;
    }
    const trained = row.set?.trainStatus === "FERTIG" && !!row.set?.trainJobId;
    setBusy(true);
    setDone(0);
    setTotal(tasks.length);
    let collected = [];
    let failed = 0;
    for (const t of tasks) {
      try {
        const url = await generateCharImage(row.set, ctx, t.prompt);
        if (url) collected.push(url);
        else failed++;
      } catch {
        failed++;
      }
      setDone((d) => d + 1);
    }
    if (collected.length) {
      try {
        const next = [...(row.set.generatedImages || []), ...collected];
        await base44.entities.TrainingSet.update(row.set.id, { generatedImages: next });
        onUpdated?.({ ...row, set: { ...row.set, generatedImages: next } });
        toast({
          title: trained ? "LoRA-Set erzeugt" : "Set erzeugt",
          description: `${collected.length} Bild(er) hinzugefügt${failed ? `, ${failed} fehlgeschlagen` : ""}${trained ? " (mit LoRA)" : ""}.`,
        });
      } catch (e) {
        toast({ variant: "destructive", title: "Speichern fehlgeschlagen", description: e?.message });
      }
    } else {
      toast({ variant: "destructive", title: "Nichts erzeugt", description: "Keines der Bilder konnte erzeugt werden." });
    }
    setBusy(false);
    setExtra("");
  };

  return (
    <div className="mt-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-sm text-foreground"
      >
        <span className="inline-flex items-center gap-1.5 font-heading">
          <Layers className="h-4 w-4 text-primary" /> Set auf einmal erzeugen
          {row.set?.trainStatus === "FERTIG" && row.set?.trainJobId ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
              <Cpu className="h-3 w-3" /> mit LoRA
            </span>
          ) : (
            <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] text-muted-foreground">Standard (kein LoRA)</span>
          )}
        </span>
        <span className="text-xs text-muted-foreground">
          {busy ? `${done}/${total} …` : `${sel.length} Szene(n) gewählt`}
        </span>
      </button>

      {open && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">
            Vorausgewählt sind Posen (Sitzend, Laufend, Autofahrend …) — so siehst du
            sofort, ob der Charakter in jeder Haltung hält. Wer feinere Outfits oder
            Stimmungen will, klickt die Szenen dazu. Pro Bild werden 1–2 echte Fotos
            als Referenz mitgegeben, damit keine zweite Person erfunden wird.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {POSES.map((s) => {
              const on = sel.includes(s.key);
              return (
                <button
                  key={s.key}
                  onClick={() => toggle(s.key)}
                  disabled={busy}
                  className={
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50 " +
                    (on ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")
                  }
                >
                  {on ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-40" />}
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SCENES.map((s) => {
              const on = sel.includes(s.key);
              return (
                <button
                  key={s.key}
                  onClick={() => toggle(s.key)}
                  disabled={busy}
                  className={
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50 " +
                    (on ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")
                  }
                >
                  {on ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-40" />}
                  {s.label}
                </button>
              );
            })}
          </div>
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Eigene Szene dazu (optional)"
            disabled={busy}
            className="mt-2 w-full rounded-full bg-elevated px-3 py-2 text-sm text-foreground disabled:opacity-50"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={run}
              disabled={busy || !sel.length}
              className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {busy ? `Erzeuge ${done}/${total}` : `${sel.length + (extra.trim() ? 1 : 0)} Szenen erzeugen`}
            </button>
            {busy && (
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}