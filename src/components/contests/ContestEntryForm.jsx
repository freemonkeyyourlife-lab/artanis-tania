import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ImagePlus, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

export default function ContestEntryForm({ contest, user, onSaved }) {
  const { toast } = useToast();
  const allowsText = contest.mediaType === "TEXT" || contest.mediaType === "ANY";
  const allowsImage = contest.mediaType === "IMAGE" || contest.mediaType === "ANY";
  const allowsVideo = contest.mediaType === "VIDEO" || contest.mediaType === "ANY";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [mediaType, setMediaType] = useState(allowsImage ? "IMAGE" : allowsVideo ? "VIDEO" : "TEXT");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const accept = mediaType === "VIDEO" ? "video/*" : "image/*";

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setMediaUrl(res.file_url);
    } catch (err) {
      toast({ title: "Upload fehlgeschlagen", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async () => {
    if (!user) {
      toast({ title: "Bitte anmelden", description: "Zum Mitmachen brauchst du ein Konto.", variant: "destructive" });
      return;
    }
    if (mediaType !== "TEXT" && !mediaUrl) {
      toast({ title: "Datei fehlt", description: "Lade zuerst deinen Beitrag hoch.", variant: "destructive" });
      return;
    }
    if (mediaType === "TEXT" && !description.trim()) {
      toast({ title: "Text fehlt", description: "Schreib deinen Beitrag.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.ContestEntry.create({
        contestId: contest.id,
        userId: user.id,
        userName: user.full_name || user.email,
        anonymous,
        title: title.trim(),
        description: description.trim(),
        mediaType,
        mediaUrl,
        round: contest.round || 1,
        status: contest.autoApproveEntries === false ? "PENDING" : "APPROVED",
      });
      toast({ title: "Beitrag eingereicht", description: contest.autoApproveEntries === false ? "Er wird erst geprüft." : "Viel Glück!" });
      setTitle("");
      setDescription("");
      setMediaUrl("");
      setAnonymous(false);
      onSaved?.();
    } catch (e) {
      toast({ title: "Fehler", description: "Beitrag konnte nicht gesendet werden.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-5">
      <h3 className="font-display text-lg text-foreground mb-4">Mitmachen</h3>

      <div className="space-y-3">
        {allowsImage && allowsVideo && (
          <div className="flex gap-2">
            {["IMAGE", "VIDEO"].map((t) => (
              <button
                key={t}
                onClick={() => { setMediaType(t); setMediaUrl(""); }}
                className={cn("px-4 py-2 rounded-full text-xs font-semibold transition-colors", mediaType === t ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground")}
              >
                {t === "IMAGE" ? "Bild" : "Video"}
              </button>
            ))}
          </div>
        )}

        {mediaType !== "TEXT" && (
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ImagePlus className="w-4 h-4" /> {uploading ? "Lädt …" : "Datei wählen"}
              <input type="file" accept={accept} onChange={upload} className="hidden" />
            </label>
            {mediaUrl && mediaType === "IMAGE" && <Image src={mediaUrl} fittingType="fill" className="w-16 h-16 rounded-lg" />}
            {mediaUrl && mediaType === "VIDEO" && <video src={mediaUrl} className="w-24 rounded-lg" muted />}
          </div>
        )}

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel (optional)" className={inputCls} />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={allowsText ? 4 : 2}
          placeholder={mediaType === "TEXT" ? "Dein Beitrag …" : "Beschreibung (optional)"}
          className={cn(inputCls, "resize-none")}
        />

        {contest.allowAnonymousEntries && (
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm text-muted-foreground">Anonym teilnehmen</span>
          </label>
        )}

        <button onClick={submit} disabled={saving || uploading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          <Send className="w-4 h-4" /> {saving ? "Sendet …" : "Beitrag einreichen"}
        </button>
      </div>
    </div>
  );
}