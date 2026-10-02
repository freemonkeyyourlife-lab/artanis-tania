import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Check, Loader2, Sparkles, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputCls, labelCls, chipCls, btnCls, btnAccentCls } from "@/lib/narratorUi";

// Bild-Creator: Aussehen beschreiben, entwerfen lassen, das Beste behalten.
// Sie wird als ganze Figur entworfen — später wird sie freigestellt und läuft.
export default function NarratorImageBlock({ narrator, onSaved }) {
  const [form, setForm] = useState({
    appearance: narrator?.appearance || "",
    artStyle: narrator?.artStyle || "PHOTOREAL",
    imagePrompt: narrator?.imagePrompt || "",
    avatar: narrator?.avatar || "",
    gallery: narrator?.gallery || [],
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const prompt = () =>
    form.imagePrompt.trim() ||
    `${form.artStyle === "CARTOON" ? "Gezeichnete Figur mit klaren Linien" : "Fotorealistische Aufnahme"}, ${
      form.appearance || "eine erwachsene Frau"
    }. ${narrator?.personality ? `${narrator.personality}. ` : ""}Ganzkörper von Kopf bis Fuß, freigestellt vor einfarbigem Hintergrund, weiches Licht, Blick in die Kamera.`;

  const draft = async () => {
    setBusy(true);
    setNote("");
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt: prompt() });
      if (!res?.url) throw new Error("kein Bild");
      set({ gallery: [res.url, ...form.gallery].slice(0, 8), avatar: form.avatar || res.url });
    } catch (e) {
      setNote("Das Bild kam nicht zurück — nochmal versuchen.");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      set({ avatar: res.file_url });
    } catch (err) {
      setNote("Hochladen hat nicht geklappt.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const rec = await base44.entities.Narrator.update(narrator.id, form);
      onSaved?.(rec);
      setNote("Gespeichert.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-5">
      <div>
        <div className="rounded-2xl overflow-hidden border-2 border-border bg-elevated aspect-[3/4]">
          {form.avatar ? (
            <Image src={form.avatar} fittingType="fit" className="w-full h-full" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-[12px] font-bold text-muted-foreground">
              noch kein Bild
            </span>
          )}
        </div>
        <label className={cn(btnCls, "mt-3 w-full justify-center cursor-pointer")}>
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Eigenes Bild
          <input type="file" accept="image/*" onChange={upload} className="hidden" />
        </label>

        {form.gallery.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {form.gallery.map((url) => (
              <button
                key={url}
                onClick={() => set({ avatar: url })}
                title="Dieses Bild nehmen"
                className={cn(
                  "rounded-xl overflow-hidden border-2 aspect-[3/4]",
                  form.avatar === url ? "border-primary" : "border-border"
                )}
              >
                <Image src={url} fittingType="fill" className="w-full h-full" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>Wie sieht sie aus?</label>
        <textarea
          value={form.appearance}
          onChange={(e) => set({ appearance: e.target.value })}
          rows={3}
          placeholder="Haare, Augen, Figur, was sie trägt — damit sie auch so gezeichnet wird."
          className={cn(inputCls, "resize-none")}
        />

        <label className={cn(labelCls, "mt-3")}>Art</label>
        <div className="flex flex-wrap gap-1.5">
          {["PHOTOREAL", "CARTOON"].map((a) => (
            <button key={a} onClick={() => set({ artStyle: a })} className={chipCls(form.artStyle === a)}>
              {a === "PHOTOREAL" ? "Fotoreal" : "Gezeichnet"}
            </button>
          ))}
        </div>

        <label className={cn(labelCls, "mt-3")}>
          Bild-Vorgabe <span className="font-semibold normal-case tracking-normal opacity-70">leer lassen, dann wird sie aus dem Aussehen gebaut</span>
        </label>
        <textarea
          value={form.imagePrompt}
          onChange={(e) => set({ imagePrompt: e.target.value })}
          rows={3}
          placeholder="Eigene Vorgabe für das Bild — Stimmung, Licht, Hintergrund."
          className={cn(inputCls, "resize-none")}
        />

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button onClick={draft} disabled={busy} className={btnAccentCls}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Bild entwerfen
          </button>
          <button onClick={save} disabled={busy} className={btnCls}>
            <Check className="w-4 h-4" /> Speichern
          </button>
          {note && <span className="text-[12px] font-semibold text-muted-foreground">{note}</span>}
        </div>
      </div>
    </div>
  );
}