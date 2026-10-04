import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Upload, X, Star, Loader2, Archive } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { addGalleryItems } from "@/lib/gallery";
import { uploadToArchive } from "@/lib/imageArchive";
import ArchivePicker from "@/components/images/ArchivePicker";

// Bilder direkt am Charakter: hochladen, zuweisen, fertig — ohne Umweg übers Formular.
export default function CharacterQuickImages({ creator, onClose, onChanged }) {
  const { toast } = useToast();
  const [avatar, setAvatar] = useState(creator.avatar || "");
  const [refs, setRefs] = useState(creator.referenceImages || []);
  const [busy, setBusy] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const persist = async (nextAvatar, nextRefs) => {
    const data = { avatar: nextAvatar, referenceImages: nextRefs };
    if (!creator.banner && nextAvatar) data.banner = nextAvatar;
    await base44.entities.Creator.update(creator.id, data);
    onChanged?.();
  };

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const urls = await uploadToArchive(files, { kind: "CHARAKTER" });
      await addGalleryItems({ urls, creatorId: creator.id, creatorName: creator.stageName });
      const rest = [...urls];
      let nextAvatar = avatar;
      if (!nextAvatar && rest.length) nextAvatar = rest.shift();
      const nextRefs = [...refs, ...rest];
      setAvatar(nextAvatar);
      setRefs(nextRefs);
      await persist(nextAvatar, nextRefs);
      toast({ title: "Zugewiesen", description: `${urls.length} Bild(er) bei „${creator.stageName}" gespeichert — sie stehen jetzt auch in der Galerie des Profils.` });
    } catch (err) {
      toast({ title: "Upload fehlgeschlagen", variant: "destructive" });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const makeMain = async (url) => {
    const nextAvatar = url;
    const nextRefs = [avatar, ...refs.filter((u) => u !== url)].filter(Boolean);
    setAvatar(nextAvatar);
    setRefs(nextRefs);
    await persist(nextAvatar, nextRefs);
  };

  const removeRef = async (url) => {
    const nextRefs = refs.filter((u) => u !== url);
    setRefs(nextRefs);
    await persist(avatar, nextRefs);
  };

  // Ein Bild, das schon im Archiv liegt, direkt an den Charakter hängen.
  const addFromArchive = async (url) => {
    if (avatar === url || refs.includes(url)) return;
    const nextRefs = [...refs, url];
    setRefs(nextRefs);
    await persist(avatar, nextRefs);
  };

  return (
    <div className="mb-6 rounded-2xl border border-primary/30 bg-card p-5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="font-display text-lg text-foreground">Bilder von „{creator.stageName}"</p>
        <button onClick={onClose} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          Schließen
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Mehrere Bilder auf einmal wählen: Das erste wird das Hauptbild, alle weiteren sind Referenzen, damit sie in jedem Chat-Bild gleich aussieht. Alles ist sofort gespeichert.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? "Lädt …" : "Bilder hochladen (mehrere)"}
          <input type="file" accept="image/*" multiple onChange={pick} className="hidden" />
        </label>
        <button
          type="button"
          onClick={() => setArchiveOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold"
        >
          <Archive className="w-4 h-4" /> {archiveOpen ? "Archiv schließen" : "Aus dem Archiv"}
        </button>
      </div>

      {archiveOpen && (
        <div className="mt-3">
          <ArchivePicker
            kind="CHARAKTER"
            onPick={addFromArchive}
            selected={[...(avatar ? [avatar] : []), ...refs]}
          />
        </div>
      )}

      {(avatar || refs.length > 0) && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Hauptbild {refs.length > 0 && `· ${refs.length} Referenz${refs.length === 1 ? "" : "en"}`}
          </p>
          <div className="flex flex-wrap gap-3">
            {avatar && (
              <div className="relative">
                <Image src={avatar} fittingType="fill" className="w-28 h-28 rounded-2xl" />
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">Hauptbild</span>
              </div>
            )}
            {refs.map((url) => (
              <div key={url} className="relative group">
                <Image src={url} fittingType="fill" className="w-28 h-28 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => makeMain(url)}
                    title="Als Hauptbild"
                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeRef(url)}
                    title="Entfernen"
                    className="w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}