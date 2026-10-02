import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Trash2, Film, Image as ImageIcon, Music, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const KINDS = [
  { id: "PHOTO", label: "Foto", icon: ImageIcon },
  { id: "PHOTO_SET", label: "Fotoserie", icon: ImageIcon },
  { id: "VIDEO", label: "Video", icon: Film },
  { id: "TEASER", label: "Teaser", icon: Film },
  { id: "AUDIO", label: "Audio", icon: Music },
];

const VISIBILITIES = ["PUBLIC", "REGISTERED", "FREE_MEMBER", "VIP", "PPV", "PRIVATE", "UNLISTED"];

// Die Kategorie kommt aus der Datei selbst — ein Clip wird als Clip erkannt,
// ein Bild als Bild. Von Hand korrigieren geht trotzdem.
const kindOf = (file) => {
  const type = file.type || "";
  if (type.startsWith("video/")) return "VIDEO";
  if (type.startsWith("audio/")) return "AUDIO";
  if (type.startsWith("image/")) return "PHOTO";
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (["mp4", "mov", "webm", "mkv", "avi"].includes(ext)) return "VIDEO";
  if (["mp3", "wav", "m4a", "ogg", "flac"].includes(ext)) return "AUDIO";
  return "PHOTO";
};

const sizeLabel = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// Viele Dateien auf einmal: Bilder und Clips werden nach Typ einsortiert und
// landen als Inhalte im Studio.
export default function BulkMediaImport({ creators = [] }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [creatorId, setCreatorId] = useState("");
  const [price, setPrice] = useState(0);
  const [visibility, setVisibility] = useState("REGISTERED");
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);

  const add = (event) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";
    if (!picked.length) return;
    setRows((prev) => [
      ...prev,
      ...picked.map((file) => ({
        file,
        kind: kindOf(file),
        title: file.name.replace(/\.[^.]+$/, ""),
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      })),
    ]);
  };

  const patch = (i, key, value) => setRows((prev) => prev.map((r, n) => (n === i ? { ...r, [key]: value } : r)));

  const drop = (i) =>
    setRows((prev) => {
      const row = prev[i];
      if (row?.preview) URL.revokeObjectURL(row.preview);
      return prev.filter((_, n) => n !== i);
    });

  const upload = async () => {
    if (!rows.length) return;
    setBusy(true);
    setProgress({ done: 0, total: rows.length });
    const creator = creators.find((c) => c.id === creatorId);
    try {
      const records = [];
      for (const r of rows) {
        const up = await base44.integrations.Core.UploadPublicFile({ file: r.file });
        const url = up.file_url;
        records.push({
          title: r.title.trim() || r.file.name,
          contentType: r.kind,
          creatorId: creatorId || undefined,
          creatorName: creator?.stageName || undefined,
          fullAsset: url,
          previewAsset: url,
          thumbnail: url,
          price: Number(price) || 0,
          currency: "EUR",
          isFree: (Number(price) || 0) === 0,
          visibility,
          published,
          publishedAt: published ? new Date().toISOString() : undefined,
        });
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      await base44.entities.Content.bulkCreate(records);
      toast({
        title: `${records.length} Dateien drin`,
        description: "Jede steht in der Kategorie, die zu ihrer Datei passt.",
      });
      rows.forEach((r) => r.preview && URL.revokeObjectURL(r.preview));
      setRows([]);
    } catch (e) {
      console.error(e);
      toast({ title: "Hat nicht geklappt", description: "Versuch es noch einmal.", variant: "destructive" });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const counts = KINDS.map((k) => ({ ...k, n: rows.filter((r) => r.kind === k.id).length })).filter((k) => k.n);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-5">
      <h2 className="font-display text-xl text-foreground mb-1">Dateien im Paket</h2>
      <p className="text-xs text-muted-foreground mb-4 max-w-3xl">
        Bilder und Clips auf einmal hineinlegen — jede Datei wird an ihrem Typ erkannt und landet sofort in der richtigen
        Kategorie: Foto, Video oder Ton. Anschließend sind alle als Inhalt im Studio, mit Preis und Sichtbarkeit.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          <Upload className="w-4 h-4" /> Dateien wählen (mehrere)
          <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" multiple onChange={add} className="hidden" />
        </label>
        {counts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {counts.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border text-[11px] font-semibold text-muted-foreground">
                <c.icon className="w-3.5 h-3.5" /> {c.n} {c.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <select value={creatorId} onChange={(e) => setCreatorId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-semibold text-foreground focus:outline-none focus:border-primary/50">
              <option value="">Keinem Charakter zuordnen</option>
              {creators.map((c) => (
                <option key={c.id} value={c.id}>{c.stageName}</option>
              ))}
            </select>
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preis in € — 0 heißt gratis" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-semibold text-foreground focus:outline-none focus:border-primary/50" />
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-semibold text-foreground focus:outline-none focus:border-primary/50">
              {VISIBILITIES.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
            {rows.map((r, i) => {
              const kind = KINDS.find((k) => k.id === r.kind) || KINDS[0];
              const Icon = kind.icon;
              return (
                <div key={`${r.file.name}-${i}`} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-elevated border border-border">
                  <div className="w-11 h-11 rounded-xl bg-card overflow-hidden flex items-center justify-center flex-shrink-0">
                    {r.preview ? (
                      <img src={r.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    value={r.title}
                    onChange={(e) => patch(i, "title", e.target.value)}
                    className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-background border border-border text-sm font-semibold text-foreground focus:outline-none focus:border-primary/50"
                  />
                  <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">{sizeLabel(r.file.size)}</span>
                  <select
                    value={r.kind}
                    onChange={(e) => patch(i, "kind", e.target.value)}
                    className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground focus:outline-none focus:border-primary/50"
                  >
                    {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                  </select>
                  <button onClick={() => drop(i)} className="w-8 h-8 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={upload}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {busy ? `Lädt … ${progress?.done || 0} / ${progress?.total || rows.length}` : `Alle ${rows.length} hochladen`}
            </button>
            <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 accent-primary" /> Sofort live
            </label>
            <button onClick={() => setRows([])} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-elevated border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" /> Liste leeren
            </button>
          </div>
        </>
      )}
    </div>
  );
}