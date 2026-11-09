import React, { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { uploadToArchive, loadArchive } from "@/lib/imageArchive";
import { Loader2, Lock, Upload, Link2, Trash2, Tag, X, Sparkles, Images, Cpu, Mic } from "lucide-react";

// Private Sammel-Galerie — hier landet alles, was du überall findest: Bilder
// per Drag-and-Drop, Links zum Einsaugen. Nur im privaten Bereich, nur Admin.
// Gesammeltes lässt sich später für Training und Charaktere wiederverwenden.

const KINDS = [
  { value: "ALLGEMEIN", label: "Allgemein" },
  { value: "IDEE", label: "Idee" },
  { value: "CHARAKTER", label: "Charakter" },
  { value: "BAUSATZ", label: "Bausatz" },
];

// Media-Typ anhand der Adresse erkennen — Bild, Video oder Audio.
const isVideo = (u) => /\.(mp4|mov|webm|avi|mkv|m4v|ogv)$/i.test((u || "").split(/[?#]/)[0]);
const isAudio = (u) => /\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i.test((u || "").split(/[?#]/)[0]);
const mediaType = (u) => (isVideo(u) ? "video" : isAudio(u) ? "audio" : "image");

export default function Sammelgalerie() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNote, setLinkNote] = useState("");
  const [linkKind, setLinkKind] = useState("ALLGEMEIN");
  const [filter, setFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const dropRef = useRef(null);
  const fileInput = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadArchive();
      setItems(list || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null)).finally(() => setMeLoading(false));
    load();
  }, [load]);

  const addFiles = async (files, kind = "ALLGEMEIN", note = "") => {
    const arr = Array.from(files || []).filter(
      (f) =>
        f.type?.startsWith("image/") || f.type?.startsWith("video/") || f.type?.startsWith("audio/") ||
        /\.(png|jpe?g|webp|gif|mp4|mov|webm|avi|mkv|m4v|ogv|mp3|wav|ogg|m4a|flac|aac|opus)$/i.test(f.name)
    );
    if (!arr.length) {
      toast({ variant: "destructive", title: "Nur Medien", description: "Bilder, Videos oder Audio-Clips werden unterstützt." });
      return;
    }
    setBusy(true);
    try {
      await uploadToArchive(arr, { kind, note });
      await load();
      toast({ title: "Eingesammelt", description: `${arr.length} Bild(er) in der Galerie.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    dropRef.current?.classList.remove("ring-primary");
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const addLink = async () => {
    const url = linkUrl.trim();
    if (!url) return;
    setBusy(true);
    try {
      await base44.entities.ImageArchive.create({
        name: linkNote.trim() || "Link",
        url,
        kind: linkKind,
        note: linkNote.trim(),
      });
      setLinkUrl("");
      setLinkNote("");
      await load();
      toast({ title: "Link eingesammelt", description: url });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await base44.entities.ImageArchive.delete(id);
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      toast({ variant: "destructive", title: "Nicht löschbar", description: e?.message });
    }
  };

  const setKind = async (it, kind) => {
    try {
      await base44.entities.ImageArchive.update(it.id, { kind });
      setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, kind } : x)));
    } catch (e) {
      toast({ variant: "destructive", title: "Nicht änderbar", description: e?.message });
    }
  };

  // Ein Galerie-Stück direkt in einen offenen Trainings-Satz übernehmen.
  const sendToTraining = async (it) => {
    try {
      const page = await base44.entities.TrainingSet.filter(
        { status: { $in: ["SAMMLUNG", "BEREIT"] } },
        { sort: "-created_date", limit: 1 }
      );
      let set = page.items?.[0];
      if (!set) {
        set = await base44.entities.TrainingSet.create({
          personName: "Sammel-Galerie",
          status: "SAMMLUNG",
          sourceMedia: [],
        });
      }
      const next = Array.isArray(set.sourceMedia) ? [...set.sourceMedia, it.url] : [it.url];
      await base44.entities.TrainingSet.update(set.id, { sourceMedia: next });
      toast({ title: "Ins Training übernommen", description: `${it.name || "Medien"} zu „${set.personName}" hinzugefügt.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Nicht übernommen", description: e?.message });
    }
  };

  if (meLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!me || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-2xl text-foreground">Nur für dich</h1>
        <p className="mt-2 text-sm text-muted-foreground">Die Sammel-Galerie ist privat — melde dich als Besitzerin an.</p>
      </div>
    );
  }

  const filtered = items.filter((it) => {
    if (kindFilter && it.kind !== kindFilter) return false;
    if (filter) {
      const hay = `${it.name || ""} ${it.note || ""} ${(it.tags || []).join(" ")}`.toLowerCase();
      if (!hay.includes(filter.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-4xl text-foreground text-gloss">Sammel-Galerie</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dein privater Sammel-Ort. Wirf Bilder hier rein, saug Links ein — alles landet an einer Stelle,
        bereit zum Wiederverwerten, Trainieren und Einbauen.
      </p>

      {/* Drop-Zone */}
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add("ring-primary"); }}
        onDragLeave={() => dropRef.current?.classList.remove("ring-primary")}
        onDrop={onDrop}
        onClick={() => fileInput.current?.click()}
        className="mt-6 cursor-pointer rounded-2xl border-2 border-dashed border-border bg-card/60 p-8 text-center transition-colors hover:border-primary/50"
      >
        <input ref={fileInput} type="file" accept="image/*,video/*,audio/*" multiple className="hidden"
          onChange={(e) => e.target.files?.length && addFiles(e.target.files)} />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-foreground font-heading">Medien hierher ziehen oder klicken</p>
        <p className="text-xs text-muted-foreground">Bilder, Videos, Audio-Clips — wird im Archiv abgelegt und fürs Training bereitgestellt.</p>
      </div>

      {/* Link einsinsaugen */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-foreground font-heading mb-2">
          <Link2 className="h-4 w-4" /> Link einsaugen
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://… Bild-URL"
            className="flex-1 min-w-[14rem] rounded-lg bg-background px-3 py-2 text-sm text-foreground" />
          <input value={linkNote} onChange={(e) => setLinkNote(e.target.value)} placeholder="Notiz / Name"
            className="w-40 rounded-lg bg-background px-3 py-2 text-sm text-foreground" />
          <select value={linkKind} onChange={(e) => setLinkKind(e.target.value)}
            className="rounded-lg bg-background px-3 py-2 text-sm text-foreground">
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <button onClick={addLink} disabled={busy || !linkUrl.trim()}
            className="glass-btn glass-btn-accent rounded-full px-4 py-2 text-sm disabled:opacity-50 inline-flex items-center gap-1">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Einsammeln
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtern nach Name, Notiz, Tag …"
          className="flex-1 min-w-[14rem] rounded-full bg-elevated px-4 py-2 text-sm text-foreground" />
        <button onClick={() => setKindFilter("")}
          className={"rounded-full px-3 py-2 text-xs " + (kindFilter === "" ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground")}>
          Alle
        </button>
        {KINDS.map((k) => (
          <button key={k.value} onClick={() => setKindFilter(k.value)}
            className={"rounded-full px-3 py-2 text-xs " + (kindFilter === k.value ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground")}>
            {k.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1">
          <Images className="h-3.5 w-3.5" /> {filtered.length}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lade Galerie …</div>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">Noch nichts gesammelt. Zieh Bilder hierher oder saug einen Link ein.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((it) => (
            <div key={it.id} className="group relative overflow-hidden rounded-2xl border border-border bg-elevated">
              <div className="aspect-[3/4] w-full overflow-hidden bg-background">
                {mediaType(it.url) === "video" ? (
                  <video src={it.url} className="h-full w-full object-cover" controls muted />
                ) : mediaType(it.url) === "audio" ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3">
                    <Mic className="h-8 w-8 text-primary" />
                    <audio src={it.url} controls className="w-full" />
                  </div>
                ) : (
                  <Image src={it.url} fittingType="fill" className="h-full w-full" />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => sendToTraining(it)} title="Ins Trainingsset übernehmen"
                  className="rounded-full bg-black/60 p-1.5 text-white hover:bg-primary">
                  <Cpu className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(it.id)} title="Löschen"
                  className="rounded-full bg-black/60 p-1.5 text-white hover:bg-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="truncate text-[11px] text-white/90">{it.name || "Ohne Name"}</p>
                {it.note && <p className="truncate text-[10px] text-white/60">{it.note}</p>}
                <select value={it.kind || "ALLGEMEIN"} onChange={(e) => setKind(it, e.target.value)}
                  className="mt-1 w-full rounded bg-black/60 px-1.5 py-1 text-[10px] text-white">
                  {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              </div>
              <span className="absolute top-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/90">
                {KINDS.find((k) => k.value === it.kind)?.label || "Allgemein"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}