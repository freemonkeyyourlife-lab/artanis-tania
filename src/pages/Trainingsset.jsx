import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import UploadZone from "@/components/trainingsset/UploadZone";
import SetCard from "@/components/trainingsset/SetCard";
import {
  ArrowRight,
  Loader2,
  Wand2,
  AlertTriangle,
  Sparkles,
  Archive,
  Trash2,
  Lock,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import JSZip from "jszip";

const sign = async (uri) => {
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: uri,
      expires_in: 3600,
    });
    return r.signed_url;
  } catch {
    return null;
  }
};

// Trainingsset: Upload von überall → pro Person sortieren → bei zu wenig
// Bildern Set auffüllen → daraus einen Charakter ziehen. Keine Sackgasse:
// Pool-Einträge lassen sich entfernen, leere Sets löschen, Auffüllen braucht
// ein Referenzbild (sonst entstehen sinnlose Bilder), Charaktere werden nicht
// doppelt angelegt.
export default function Trainingsset() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [pool, setPool] = useState([]);
  const [poolUrls, setPoolUrls] = useState({});
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPerson, setNewPerson] = useState({});
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState([]);
  const [bulkPerson, setBulkPerson] = useState("");

  const load = async () => {
    const page = await base44.entities.TrainingSet.filter(
      {},
      { sort: "-created_date", limit: 100 }
    );
    setSets(page.items || []);
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
          map[p.uri] = await sign(p.uri);
        }
      }
      if (Object.keys(map).length) setPoolUrls((m) => ({ ...m, ...map }));
    })();
  }, [pool]);

  if (meLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Trainingssets sind admin-only (RLS) — ohne Admin-Rechte geht hier nichts.
  if (!me || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-2xl text-foreground">Nur für Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trainingssets lassen sich nur mit Admin-Rechten ansehen und bearbeiten.
          Melde dich als Admin an.
        </p>
      </div>
    );
  }

  const onUploaded = (uri, type, name) => {
    setPool((p) => [...p, { uri, type, name }]);
  };

  // Pool-Eintrag verwerfen — war versehentlich hochgeladen.
  const removePool = (uri) => {
    setPool((p) => p.filter((x) => x.uri !== uri));
    setSelected((s) => s.filter((x) => x !== uri));
    setNewPerson((m) => {
      const n = { ...m };
      delete n[uri];
      return n;
    });
  };

  const ensureSet = async (person) =>
    sets.find((s) => s.personName === person) ||
    (await base44.entities.TrainingSet.create({
      personName: person,
      name: `Set ${person}`,
      images: [],
      generatedImages: [],
      sourceMedia: [],
      targetCount: 12,
    }));

  const assignOne = async (uri) => {
    const person = (newPerson[uri] || "").trim();
    if (!person) return;
    const item = pool.find((p) => p.uri === uri);
    setBusy(true);
    try {
      const target = await ensureSet(person);
      const images =
        item.type === "IMAGE" ? [...(target.images || []), uri] : target.images || [];
      const sourceMedia =
        item.type === "VIDEO" ? [...(target.sourceMedia || []), uri] : target.sourceMedia || [];
      await base44.entities.TrainingSet.update(target.id, {
        images,
        sourceMedia,
        avatar: target.avatar || (item.type === "IMAGE" ? uri : target.avatar),
      });
      removePool(uri);
      await load();
      toast({ title: "Zugeordnet", description: `${item.name || "Datei"} → ${person}` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Zuordnen fehlgeschlagen",
        description: e?.message || "Keine Rechte oder Verbindung — Admin-Login nötig.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Aus einem Set einen Charakter ziehen — vorhandenen aktualisieren statt
  // doppelt anzulegen.
  const extract = async (set) => {
    setBusy(true);
    try {
      const refUri = (set.images || [])[0];
      const refUrl = refUri ? await sign(refUri) : null;
      let appearance = "";
      if (refUrl) {
        const r = await base44.integrations.Core.InvokeLLM({
          prompt:
            "Beschreibe das Aussehen der Person auf diesem Bild in 2-3 Sätzen, auf Deutsch. Erwachsene Person.",
          file_urls: [refUrl],
        });
        appearance = typeof r === "string" ? r : String(r || "");
      }
      const page = await base44.entities.Character.filter(
        { name: set.personName },
        { limit: 1 }
      );
      const existing = (page.items || [])[0];
      if (existing) {
        await base44.entities.Character.update(existing.id, {
          appearance: appearance || existing.appearance,
          avatar: refUri || existing.avatar,
          images: Array.from(
            new Set([...(existing.images || []), ...(set.images || [])])
          ),
        });
        toast({ title: "Charakter aktualisiert", description: set.personName });
      } else {
        await base44.entities.Character.create({
          name: set.personName,
          adultAge: 25,
          appearance,
          avatar: refUri || "",
          images: set.images || [],
          fictional: true,
          createdByRole: "DAVID",
        });
        toast({ title: "Charakter angelegt", description: set.personName });
      }
      await base44.entities.TrainingSet.update(set.id, { status: "BEREIT" });
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Fehlgeschlagen",
        description: e?.message || "Charakter konnte nicht gezogen werden.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Kern des Auffüllens — erzeugt ein passendes Bild derselben Person.
  // Ohne Referenzbild wird nichts erzeugt (sonst entstehen sinnlose Bilder).
  const fillSetCore = async (set) => {
    const ref = (set.images || [])[0] || (set.generatedImages || [])[0];
    if (!ref) return false;
    const refUrls = [ref.startsWith("http") ? ref : await sign(ref)];
    const res = await base44.integrations.Core.GenerateImage({
      prompt:
        `Porträt einer Person namens ${set.personName}. ` +
        "Neue Pose, gleiche Person, fotorealistisch, neutraler Hintergrund, gleiches Licht. Erwachsene Person, keine realen Personen.",
      existing_image_urls: refUrls,
    });
    if (res?.url) {
      const generatedImages = [...(set.generatedImages || []), res.url];
      const total = (set.images?.length || 0) + generatedImages.length;
      await base44.entities.TrainingSet.update(set.id, {
        generatedImages,
        status: total >= (set.targetCount || 12) ? "BEREIT" : "SAMMLUNG",
      });
      return true;
    }
    return false;
  };

  const fillSet = async (set) => {
    const have = (set.images?.length || 0) + (set.generatedImages?.length || 0);
    if (have === 0) {
      toast({
        variant: "destructive",
        title: "Kein Referenzbild",
        description: "Ordne erst mindestens ein echtes Bild zu — sonst entstehen sinnlose Bilder.",
      });
      return;
    }
    setBusy(true);
    try {
      await fillSetCore(set);
      await load();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Auffüllen fehlgeschlagen",
        description: e?.message || "Bild-Generierung nicht verfügbar.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Alle unterfüllten Sets auf einmal auffüllen — aber nur die mit Referenzbild.
  const fillAll = async () => {
    const fillable = underTarget.filter(
      (s) => (s.images?.length || 0) + (s.generatedImages?.length || 0) > 0
    );
    if (!fillable.length) {
      toast({
        variant: "destructive",
        title: "Nichts aufzufüllen",
        description: "Jedes Set braucht erst ein echtes Bild als Referenz.",
      });
      return;
    }
    setBusy(true);
    try {
      for (const s of fillable) await fillSetCore(s);
      await load();
      toast({ title: "Aufgefüllt", description: `${fillable.length} Sets ergänzt.` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Auffüllen fehlgeschlagen",
        description: e?.message || "Abgebrochen.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Mehrere Pool-Einträge auf einmal derselben Person zuweisen.
  const assignMany = async () => {
    const person = (bulkPerson || "").trim();
    const items = pool.filter((p) => selected.includes(p.uri));
    if (!person || !items.length) return;
    setBusy(true);
    try {
      const target = await ensureSet(person);
      const images = [...(target.images || [])];
      const sourceMedia = [...(target.sourceMedia || [])];
      let avatar = target.avatar;
      for (const p of items) {
        if (p.type === "IMAGE") {
          images.push(p.uri);
          if (!avatar) avatar = p.uri;
        } else if (p.type === "VIDEO") {
          sourceMedia.push(p.uri);
        }
      }
      await base44.entities.TrainingSet.update(target.id, { images, sourceMedia, avatar });
      setPool((cur) => cur.filter((p) => !selected.includes(p.uri)));
      setSelected([]);
      setBulkPerson("");
      await load();
      toast({ title: "Zugeordnet", description: `${items.length} Dateien → ${person}` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Zuordnen fehlgeschlagen",
        description: e?.message || "Keine Rechte oder Verbindung — Admin-Login nötig.",
      });
    } finally {
      setBusy(false);
    }
  };

  const toggle = (uri) =>
    setSelected((s) => (s.includes(uri) ? s.filter((x) => x !== uri) : [...s, uri]));

  const allSelected = pool.length > 0 && selected.length === pool.length;

  // Automatisch zuordnen: trifft der Dateiname den Namen einer vorhandenen
  // Person, landet das Medium direkt in deren Set — der Rest bleibt im Pool.
  const autoSort = async () => {
    const byName = {};
    pool.forEach((p) => {
      const fn = (p.name || "").toLowerCase();
      const s = sets.find((x) => fn.includes(x.personName.toLowerCase()));
      if (s) (byName[s.id] = byName[s.id] || { set: s, items: [] }).items.push(p);
    });
    const matched = Object.values(byName).flatMap((g) => g.items);
    if (!matched.length) {
      toast({
        title: "Kein Treffer",
        description: "Kein Dateiname passt zu einer vorhandenen Person — manuell zuordnen.",
      });
      return;
    }
    setBusy(true);
    try {
      for (const id of Object.keys(byName)) {
        const g = byName[id];
        const images = [...(g.set.images || [])];
        const sourceMedia = [...(g.set.sourceMedia || [])];
        let avatar = g.set.avatar;
        for (const p of g.items) {
          if (p.type === "IMAGE") {
            images.push(p.uri);
            if (!avatar) avatar = p.uri;
          } else if (p.type === "VIDEO") {
            sourceMedia.push(p.uri);
          }
        }
        await base44.entities.TrainingSet.update(id, { images, sourceMedia, avatar });
      }
      setPool((cur) => cur.filter((p) => !matched.includes(p)));
      await load();
      toast({ title: "Zugeordnet", description: `${matched.length} Dateien automatisch zugeordnet` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Auto-Sortieren fehlgeschlagen",
        description: e?.message || "Abgebrochen.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Alle Sets auf einmal als Trainings-ZIPs packen — eins pro Person.
  const downloadAllZips = async () => {
    if (!sets.length || busy) return;
    setBusy(true);
    try {
      for (const s of sets) {
        const all = [...(s.images || []), ...(s.generatedImages || [])];
        if (!all.length) continue;
        const zip = new JSZip();
        let i = 0;
        for (const u of all) {
          const url = u.startsWith("http") ? u : await sign(u);
          if (!url) continue;
          try {
            const blob = await (await fetch(url)).blob();
            zip.file(`bild_${String(i + 1).padStart(2, "0")}.jpg`, blob);
            i += 1;
          } catch {
            /* einzelnes Bild überspringen */
          }
        }
        if (!i) continue;
        const out = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(out);
        a.download = `${s.personName}-trainingsset.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } finally {
      setBusy(false);
    }
  };

  // Set samt Eintrag löschen — aus einer falschen Person wird keine Sackgasse.
  const deleteSet = async (set) => {
    if (!set?.id) return;
    if (!window.confirm(`Set „${set.personName}" wirklich löschen? Bilder bleiben im Archiv.`)) return;
    setBusy(true);
    try {
      await base44.entities.TrainingSet.delete(set.id);
      await load();
      toast({ title: "Gelöscht", description: `Set ${set.personName} entfernt.` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Löschen fehlgeschlagen",
        description: e?.message || "Abgebrochen.",
      });
    } finally {
      setBusy(false);
    }
  };

  const underTarget = sets.filter(
    (s) => (s.images?.length || 0) + (s.generatedImages?.length || 0) < (s.targetCount || 12)
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-4xl text-foreground text-gloss">Trainingsset</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Bilder und Videos von überall hochladen, pro Person sortieren, bei zu wenig Bildern ein
        Set auffüllen und daraus einen Charakter ziehen.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <UploadZone onUploaded={onUploaded} />

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-foreground">Pool — noch nicht zugeordnet</h2>
            {pool.length > 0 && (
              <button
                onClick={autoSort}
                disabled={busy}
                className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                Auto-Sortieren
              </button>
            )}
          </div>
          {pool.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Lade Bilder hoch, dann ordne sie hier einer Person zu.
            </p>
          ) : (
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto scrollbar-hide">
              <div className="sticky top-0 z-10 flex items-center gap-2 rounded-xl bg-card/95 p-2 backdrop-blur">
                <button
                  onClick={() => setSelected(allSelected ? [] : pool.map((p) => p.uri))}
                  className="glass-btn rounded-full px-2 py-1 text-xs"
                >
                  {allSelected ? "Keine" : "Alle"}
                </button>
                <span className="text-xs text-muted-foreground">{selected.length} gewählt</span>
                <div className="flex flex-1 items-center gap-2">
                  <input
                    list="persons"
                    value={bulkPerson}
                    onChange={(e) => setBulkPerson(e.target.value)}
                    placeholder="Person für alle Gewählten"
                    className="flex-1 rounded-lg bg-background px-3 py-1.5 text-sm text-foreground"
                  />
                  <button
                    onClick={assignMany}
                    disabled={busy || !selected.length || !bulkPerson.trim()}
                    className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                    Alle zuweisen
                  </button>
                </div>
              </div>
              {pool.map((p) => (
                <div key={p.uri} className="flex items-center gap-3 rounded-xl bg-elevated p-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(p.uri)}
                    onChange={() => toggle(p.uri)}
                    className="h-4 w-4 accent-primary"
                  />
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                    {p.type === "IMAGE" && poolUrls[p.uri] ? (
                      <Image src={poolUrls[p.uri]} fittingType="fill" className="h-full w-full" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        {p.type}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      list="persons"
                      value={newPerson[p.uri] ?? ""}
                      onChange={(e) =>
                        setNewPerson((m) => ({ ...m, [p.uri]: e.target.value }))
                      }
                      placeholder="Person eintippen oder wählen"
                      className="w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground"
                    />
                    <datalist id="persons">
                      {sets.map((s) => (
                        <option key={s.id} value={s.personName} />
                      ))}
                    </datalist>
                  </div>
                  <button
                    onClick={() => assignOne(p.uri)}
                    disabled={busy || !(newPerson[p.uri] || "").trim()}
                    className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                    Zu
                  </button>
                  <button
                    onClick={() => removePool(p.uri)}
                    title="Aus dem Pool entfernen"
                    className="rounded-full bg-black/40 p-1.5 text-white hover:bg-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {(underTarget.length > 0 || pool.length > 0) && (
        <section className="mt-6 rounded-2xl border-2 border-dashed border-primary/30 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" /> Vorschläge
            </h2>
            {underTarget.length > 0 && (
              <button
                onClick={fillAll}
                disabled={busy}
                className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Alle auffüllen
              </button>
            )}
          </div>
          <ul className="mt-3 space-y-2">
            {underTarget.map((s) => {
              const have = (s.images?.length || 0) + (s.generatedImages?.length || 0);
              const miss = (s.targetCount || 12) - have;
              const noRef = have === 0;
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-elevated px-3 py-2"
                >
                  <span className="text-sm text-foreground">
                    <b>{s.personName}</b> — {have}/{s.targetCount || 12}, {miss} fehlen
                    {noRef && (
                      <span className="ml-1 text-amber-400">(erst Bild zuordnen)</span>
                    )}
                  </span>
                  <button
                    onClick={() => fillSet(s)}
                    disabled={busy || noRef}
                    className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Auffüllen
                  </button>
                </li>
              );
            })}
            {pool.length > 0 && (
              <li className="flex items-center justify-between gap-3 rounded-xl bg-elevated px-3 py-2">
                <span className="text-sm text-foreground">
                  {pool.length} im Pool — automatisch zuordnen?
                </span>
                <button
                  onClick={autoSort}
                  disabled={busy}
                  className="glass-btn inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  Auto-Sortieren
                </button>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-foreground">Sets pro Person</h2>
          {sets.length > 0 && (
            <button
              onClick={downloadAllZips}
              disabled={busy}
              className="glass-btn inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              Alle als ZIP
            </button>
          )}
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Lade …</p>
        ) : sets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Sets — ordne Bilder aus dem Pool einer Person zu.
          </p>
        ) : (
          sets.map((s) => (
            <SetCard
              key={s.id}
              set={s}
              onChanged={load}
              onExtract={extract}
              onDelete={deleteSet}
            />
          ))
        )}
      </section>
    </div>
  );
}