import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import UploadZone from "@/components/trainingsset/UploadZone";
import VideoFrameGrabber from "@/components/trainingsset/VideoFrameGrabber";
import LinkGrabber from "@/components/trainingsset/LinkGrabber";
import ArchivePicker from "@/components/trainingsset/ArchivePicker";
import { useToast } from "@/components/ui/use-toast";
import JSZip from "jszip";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
  Check,
  Upload,
  Users,
  Sparkles,
  Wand2,
  Trash2,
  Archive,
  PartyPopper,
  RefreshCw,
} from "lucide-react";
import {
  signUri,
  loadSets,
  ensureSet,
  fillToTarget,
  extractCore,
  archiveTrain,
  ingestBatch,
  autoSortPool,
  personFromName,
  setTotal,
  setMissing,
} from "@/lib/trainingFlow";

const STEPS = [
  { n: 1, title: "Sammeln", icon: Upload, hint: "Bilder, Video, Ordner oder Archiv" },
  { n: 2, title: "Zuordnen", icon: Users, hint: "Pool → Person" },
  { n: 3, title: "Auffüllen", icon: Sparkles, hint: "bis 12 pro Person" },
  { n: 4, title: "Charakter", icon: Wand2, hint: "ziehen & übernehmen" },
  { n: 5, title: "Fertig", icon: PartyPopper, hint: "ZIP & Charakter" },
];

// Geführter Trainings-Assistent: Schritt für Schritt vom Upload bis zum
// fertigen Charakter — jeder Schritt zeigt, was wo landet und was als
// Nächstes kommt, damit nichts mehr im Ungewissen hängen bleibt.
export default function TrainingsAssistent() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [sets, setSets] = useState([]);
  const [pool, setPool] = useState([]);
  const [poolUrls, setPoolUrls] = useState({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPerson, setNewPerson] = useState({});
  const [selected, setSelected] = useState([]);
  const [bulkPerson, setBulkPerson] = useState("");
  const [charIds, setCharIds] = useState({});

  const load = async () => {
    const items = await loadSets();
    setSets(items);
    setLoading(false);
  };

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => setMe(u))
      .catch(() => setMe(null))
      .finally(() => setMeLoading(false));
    load().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    (async () => {
      const map = {};
      for (const p of pool) {
        if (!poolUrls[p.uri] && p.type === "IMAGE") {
          map[p.uri] = p.uri.startsWith("http") ? p.uri : await signUri(p.uri);
        }
      }
      if (Object.keys(map).length) setPoolUrls((m) => ({ ...m, ...map }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  const totals = useMemo(() => {
    const bilder = sets.reduce((a, s) => a + setTotal(s), 0);
    return { sets: sets.length, bilder, pool: pool.length };
  }, [sets, pool]);

  const reload = async () => { await load(); };

  if (meLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!me || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-2xl text-foreground">Nur für Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Melde dich als Admin an, um Trainings-Sets zu bearbeiten.
        </p>
      </div>
    );
  }

  // --- Schritt-Übergänge ---
  const underTarget = sets.filter((s) => setMissing(s) > 0);
  const needsRef = sets.filter((s) => setTotal(s) === 0);
  const readyForChar = sets.filter((s) => setTotal(s) > 0 && s.status !== "TRAINIERT");
  const allTrained = sets.length > 0 && readyForChar.length === 0 && needsRef.length === 0;

  const canNext = {
    1: totals.pool > 0 || sets.some((s) => setTotal(s) > 0),
    2: pool.length === 0 && sets.some((s) => setTotal(s) > 0),
    3: underTarget.filter((s) => setTotal(s) > 0).length === 0,
    4: readyForChar.length === 0,
    5: true,
  };

  const next = () => setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  // --- Aktionen ---
  const onBatch = async (items) => {
    if (!items?.length) return;
    setBusy(true);
    try {
      const { loose } = await ingestBatch(items, sets);
      if (loose.length) setPool((p) => [...p, ...loose]);
      await load();
      toast({
        title: "Eingesammelt",
        description: loose.length
          ? `${items.length - loose.length} zugeordnet, ${loose.length} im Pool (ohne Ordnernamen).`
          : `${items.length} Datei(en) zugeschnitten, entdoppelt und aufgefüllt.`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Abgebrochen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const onFrames = async (uris, suggestedName) => {
    const name = (suggestedName || "Video").trim();
    if (!uris?.length) return;
    setBusy(true);
    try {
      const target = await ensureSet(name, sets);
      const existing = new Set(target.images || []);
      const images = [...(target.images || [])];
      let avatar = target.avatar;
      for (const u of uris) {
        if (!existing.has(u)) {
          images.push(u);
          existing.add(u);
          if (!avatar) avatar = u;
        }
      }
      await base44.entities.TrainingSet.update(target.id, { images, avatar });
      await fillToTarget(target.id).catch(() => {});
      await load();
      toast({ title: "Video übernommen", description: `${uris.length} Frames → ${name}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const onLinks = (items) => {
    if (!items?.length) return;
    setPool((p) => [
      ...p,
      ...items.map((it) => ({ uri: it.url, type: it.type || "IMAGE", name: it.name || it.url })),
    ]);
    toast({ title: "Links im Pool", description: `${items.length} Medienlink(s).` });
  };

  const onArchiveTrain = async (selectedArch, personRaw) => {
    const person = (personRaw || "").trim();
    if (!selectedArch?.length || !person) return;
    setBusy(true);
    try {
      const { target, taken } = await archiveTrain(selectedArch, person, sets);
      await load();
      if (!taken) {
        toast({ variant: "destructive", title: "Nichts übernommen", description: "Bilder ließen sich nicht zuschneiden." });
        return;
      }
      toast({
        title: "Durchgelaufen",
        description: `${taken} aus Archiv → ${person}: zugeschnitten, aufgefüllt, Charakter gezogen.`,
      });
      setStep(5);
    } catch (e) {
      toast({ variant: "destructive", title: "Pipeline abgebrochen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const assignOne = async (uri) => {
    const person = (newPerson[uri] || "").trim();
    if (!person) return;
    const item = pool.find((p) => p.uri === uri);
    setBusy(true);
    try {
      const target = await ensureSet(person, sets);
      const images = item.type === "IMAGE" ? [...(target.images || []), uri] : target.images || [];
      const sourceMedia = item.type === "VIDEO" ? [...(target.sourceMedia || []), uri] : target.sourceMedia || [];
      await base44.entities.TrainingSet.update(target.id, {
        images,
        sourceMedia,
        avatar: target.avatar || (item.type === "IMAGE" ? uri : target.avatar),
      });
      setPool((p) => p.filter((x) => x.uri !== uri));
      setNewPerson((m) => { const n = { ...m }; delete n[uri]; return n; });
      await load();
      toast({ title: "Zugeordnet", description: `${item.name || "Datei"} → ${person}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const assignMany = async () => {
    const person = (bulkPerson || "").trim();
    const items = pool.filter((p) => selected.includes(p.uri));
    if (!person || !items.length) return;
    setBusy(true);
    try {
      const target = await ensureSet(person, sets);
      const images = [...(target.images || [])];
      const sourceMedia = [...(target.sourceMedia || [])];
      let avatar = target.avatar;
      for (const p of items) {
        if (p.type === "IMAGE") { images.push(p.uri); if (!avatar) avatar = p.uri; }
        else if (p.type === "VIDEO") sourceMedia.push(p.uri);
      }
      await base44.entities.TrainingSet.update(target.id, { images, sourceMedia, avatar });
      setPool((cur) => cur.filter((p) => !selected.includes(p.uri)));
      setSelected([]);
      setBulkPerson("");
      await load();
      toast({ title: "Zugeordnet", description: `${items.length} → ${person}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const autoSort = async () => {
    setBusy(true);
    try {
      const res = await autoSortPool(pool, sets);
      if (!res.matched) {
        toast({ title: "Kein Treffer", description: "Ordnernamen prüfen oder Person manuell wählen." });
      } else {
        setPool((cur) => cur.filter((p) => !personFromName(p.name)));
        await load();
        toast({ title: "Zugeordnet", description: `${res.matched} → ${res.persons} Person(en).` });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const fillOne = async (s) => {
    setBusy(true);
    try {
      await fillToTarget(s.id);
      await load();
      toast({ title: "Aufgefüllt", description: s.personName });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const fillAll = async () => {
    const fillable = underTarget.filter((s) => setTotal(s) > 0);
    if (!fillable.length) {
      toast({ variant: "destructive", title: "Nichts", description: "Jedes Set braucht erst ein echtes Bild." });
      return;
    }
    setBusy(true);
    try {
      for (const s of fillable) await fillToTarget(s.id);
      await load();
      toast({ title: "Aufgefüllt", description: `${fillable.length} Set(s).` });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const extractOne = async (s) => {
    setBusy(true);
    try {
      const charId = await extractCore(s);
      if (charId) setCharIds((m) => ({ ...m, [s.id]: charId }));
      await load();
      toast({ title: "Charakter gezogen", description: s.personName });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const extractAll = async () => {
    const todo = readyForChar;
    if (!todo.length) return;
    setBusy(true);
    try {
      for (const s of todo) {
        const charId = await extractCore(s).catch(() => null);
        if (charId) setCharIds((m) => ({ ...m, [s.id]: charId }));
      }
      await load();
      toast({ title: "Alle übernommen", description: `${todo.length} Charakter(e).` });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const downloadZip = async (s) => {
    const all = [...(s.images || []), ...(s.generatedImages || [])];
    if (!all.length) return;
    setBusy(true);
    try {
      const zip = new JSZip();
      let i = 0;
      for (const u of all) {
        const url = u.startsWith("http") ? u : await signUri(u);
        if (!url) continue;
        try {
          const blob = await (await fetch(url)).blob();
          zip.file(`bild_${String(i + 1).padStart(2, "0")}.jpg`, blob);
          i += 1;
        } catch { /* überspringen */ }
      }
      if (!i) return;
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = `${s.personName}-trainingsset.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(false);
    }
  };

  const removePool = (uri) => {
    setPool((p) => p.filter((x) => x.uri !== uri));
    setSelected((s) => s.filter((x) => x !== uri));
  };

  const toggle = (uri) =>
    setSelected((s) => (s.includes(uri) ? s.filter((x) => x !== uri) : [...s, uri]));

  const reset = () => {
    setStep(1);
    setPool([]);
    setSelected([]);
    setBulkPerson("");
    setNewPerson({});
    setCharIds({});
  };

  const allSelected = pool.length > 0 && selected.length === pool.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-4xl text-foreground text-gloss">Trainings-Assistent</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Schritt für Schritt zum fertigen Charakter. Jeder Schritt zeigt, was wo landet.
      </p>

      {/* Stepper */}
      <ol className="mt-6 flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
        {STEPS.map((s, idx) => {
          const active = step === s.n;
          const done = step > s.n;
          const Icon = s.icon;
          return (
            <li key={s.n} className="flex items-center gap-1">
              <button
                onClick={() => setStep(s.n)}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
                  active ? "glass-btn glass-btn-accent" : done ? "glass-btn text-foreground" : "glass-btn text-muted-foreground"
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${active || done ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : s.n}
                </span>
                <span className="hidden sm:inline font-heading">{s.title}</span>
                <Icon className="h-4 w-4 sm:hidden" />
              </button>
              {idx < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        {STEPS[step - 1].icon && (
          <b className="text-foreground">{STEPS[step - 1].title}:</b>
        )} {STEPS[step - 1].hint}
        <span className="ml-3 text-muted-foreground/70">
          • {totals.pool} im Pool • {totals.sets} Sets • {totals.bilder} Bilder
        </span>
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-card/60 p-4 min-h-[18rem]">
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Lade hier hoch — Bilder, Videos, ein ZIP oder einen ganzen Ordner per Drag-and-Drop.
              Alles wird auf 3:4 zugeschnitten, entdoppelt und <b>automatisch pro Ordnername einer Person zugeordnet</b> (stored privately).
              Dateien ohne Ordnernamen landen im Pool für Schritt 2.
            </p>
            <UploadZone onBatch={onBatch} />
            <div className="grid gap-3 md:grid-cols-2">
              <VideoFrameGrabber onFrames={onFrames} />
              <LinkGrabber onLinks={onLinks} />
            </div>
            <details className="rounded-xl bg-elevated p-3">
              <summary className="cursor-pointer text-sm font-heading text-foreground">
                Oder aus dem Archiv wählen (komplett durchlaufen bis Charakter)
              </summary>
              <div className="mt-3">
                <ArchivePicker onTrain={onArchiveTrain} sets={sets} />
              </div>
            </details>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Pool — noch keiner Person zugeordnet. Ordnername fehlt? Wähle eine Person oder „Auto-Sortieren".
              </p>
              {pool.length > 0 && (
                <button onClick={autoSort} disabled={busy}
                  className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50">
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Auto-Sortieren
                </button>
              )}
            </div>
            {pool.length === 0 ? (
              <p className="rounded-xl bg-elevated p-4 text-sm text-muted-foreground">
                Pool ist leer — alles zugeordnet. Weiter zu Schritt 3.
              </p>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto scrollbar-hide">
                <div className="sticky top-0 z-10 flex items-center gap-2 rounded-xl bg-card/95 p-2 backdrop-blur">
                  <button onClick={() => setSelected(allSelected ? [] : pool.map((p) => p.uri))}
                    className="glass-btn rounded-full px-2 py-1 text-xs">
                    {allSelected ? "Keine" : "Alle"}
                  </button>
                  <span className="text-xs text-muted-foreground">{selected.length} gewählt</span>
                  <input list="persons" value={bulkPerson} onChange={(e) => setBulkPerson(e.target.value)}
                    placeholder="Person für alle Gewählten"
                    className="flex-1 rounded-lg bg-background px-3 py-1.5 text-sm text-foreground" />
                  <button onClick={assignMany} disabled={busy || !selected.length || !bulkPerson.trim()}
                    className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />} Alle zuweisen
                  </button>
                </div>
                {pool.map((p) => (
                  <div key={p.uri} className="flex items-center gap-3 rounded-xl bg-elevated p-2">
                    <input type="checkbox" checked={selected.includes(p.uri)} onChange={() => toggle(p.uri)} className="h-4 w-4 accent-primary" />
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                      {p.type === "IMAGE" && poolUrls[p.uri] ? (
                        <Image src={poolUrls[p.uri]} fittingType="fill" className="h-full w-full" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">{p.type}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <input list="persons" value={newPerson[p.uri] ?? ""}
                        onChange={(e) => setNewPerson((m) => ({ ...m, [p.uri]: e.target.value }))}
                        placeholder="Person eintippen oder wählen"
                        className="w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground" />
                    </div>
                    <button onClick={() => assignOne(p.uri)} disabled={busy || !(newPerson[p.uri] || "").trim()}
                      className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs disabled:opacity-50">
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />} Zu
                    </button>
                    <button onClick={() => removePool(p.uri)} title="Entfernen"
                      className="rounded-full bg-black/40 p-1.5 text-white hover:bg-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <datalist id="persons">
                  {sets.map((s) => <option key={s.id} value={s.personName} />)}
                </datalist>
              </div>
            )}
            {needsRef.length > 0 && (
              <p className="text-xs text-amber-400">
                {needsRef.length} Set(s) noch ohne Bild — erst zuordnen, sonst kann nicht aufgefüllt werden.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Sets unter Ziel — auffüllen mit passenden Bildern derselben Person. Braucht je ein Referenzbild.
              </p>
              <button onClick={fillAll} disabled={busy}
                className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Alle auffüllen
              </button>
            </div>
            {underTarget.length === 0 ? (
              <p className="rounded-xl bg-elevated p-4 text-sm text-muted-foreground">
                Alle Sets voll — weiter zu Schritt 4.
              </p>
            ) : (
              <ul className="space-y-2">
                {underTarget.map((s) => {
                  const have = setTotal(s);
                  const miss = setMissing(s);
                  const noRef = have === 0;
                  const pct = Math.round((have / (s.targetCount || 12)) * 100);
                  return (
                    <li key={s.id} className="rounded-xl bg-elevated p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-foreground">
                          <b>{s.personName}</b> — {have}/{s.targetCount || 12}, {miss} fehlen
                          {noRef && <span className="ml-1 text-amber-400">(erst Bild zuordnen → Schritt 2)</span>}
                        </span>
                        <button onClick={() => fillOne(s)} disabled={busy || noRef}
                          className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50">
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Auffüllen
                        </button>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Aus jedem Set einen Charakter ziehen — wird angelegt oder aktualisiert, nicht doppelt.
              </p>
              <button onClick={extractAll} disabled={busy || !readyForChar.length}
                className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Alle ziehen
              </button>
            </div>
            {sets.length === 0 ? (
              <p className="rounded-xl bg-elevated p-4 text-sm text-muted-foreground">
                Noch keine Sets — zurück zu Schritt 1.
              </p>
            ) : (
              <ul className="space-y-2">
                {sets.map((s) => {
                  const trained = s.status === "TRAINIERT";
                  const cid = charIds[s.id];
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-elevated p-3">
                      <span className="text-sm text-foreground">
                        <b>{s.personName}</b> — {setTotal(s)} Bilder — {trained ? "✓ trainiert" : "offen"}
                      </span>
                      <div className="flex items-center gap-2">
                        {trained && cid && (
                          <button onClick={() => navigate(`/charakter/${cid}`)}
                            className="glass-btn rounded-full px-3 py-1.5 text-xs">Ansehen</button>
                        )}
                        <button onClick={() => extractOne(s)} disabled={busy || trained || setTotal(s) === 0}
                          className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50">
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                          {trained ? "Fertig" : "Ziehen"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Fertig — hier sind alle Trainings-Sets. ZIP pro Person laden oder direkt zum Charakter.
              {allTrained && " 🎉 Alle trainiert."}
            </p>
            {sets.length === 0 ? (
              <p className="rounded-xl bg-elevated p-4 text-sm text-muted-foreground">Nichts fertig.</p>
            ) : (
              <ul className="space-y-2">
                {sets.map((s) => {
                  const trained = s.status === "TRAINIERT";
                  const cid = charIds[s.id];
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-elevated p-3">
                      <span className="text-sm text-foreground">
                        <b>{s.personName}</b> — {setTotal(s)} Bilder — {trained ? "trainiert" : s.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => downloadZip(s)} disabled={busy}
                          className="glass-btn inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50">
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />} ZIP
                        </button>
                        {cid && (
                          <button onClick={() => navigate(`/charakter/${cid}`)}
                            className="glass-btn glass-btn-accent rounded-full px-3 py-1.5 text-xs">Zum Charakter</button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <button onClick={reset}
              className="glass-btn inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Neues Training starten
            </button>
            <p className="text-xs text-muted-foreground">
              Tipp: Sobald ein Set „trainiert" ist, bekommst du automatisch eine Telegram-Meldung ans Handy.
            </p>
          </div>
        )}
      </section>

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between">
        <button onClick={back} disabled={step === 1}
          className="glass-btn inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm disabled:opacity-40">
          <ArrowLeft className="h-4 w-4" /> Zurück
        </button>
        {step < 5 ? (
          <button onClick={next} disabled={busy || !canNext[step]}
            className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm disabled:opacity-40">
            Weiter <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={() => navigate("/charakter")}
            className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm">
            Zu den Charakteren <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}