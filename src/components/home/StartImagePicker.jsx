import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, X, Sparkles, Save, Image as ImageIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// Jeder Nutzer sucht sich seine eigenen Startbilder aus — aus der Galerie oder
// per KI generiert. Gespeichert wird in seiner UserPreference.

const GALLERY = [
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/6549e1153_Screenshot2026-09-28053726.png", title: "Privater Chat" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/dd71409ec_generated_image.png", title: "Tania" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/83f1549c6_Screenshot2026-09-091854361.png", title: "Artanis" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/9795fbefc_generated_image.png", title: "Artanis x Tania" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/99c4b7146_Screenshot2026-09-28084637.png", title: "Storys" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/78af4f762_Screenshot2026-09-28034357.png", title: "Live / Online" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/b80095c82_generated_image.png", title: "Teaser 1" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/4aa1b2f57_generated_image.png", title: "Teaser 2" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/0097a75a2_generated_image.png", title: "Teaser 3" },
];

// Schneidet ein hochgeladenes Bild mittig auf 3:4 zu, damit es verzerrungsfrei
// in die Hero-Kacheln und den Hintergrund passt.
async function cropToAspect(file, aspect = 3 / 4) {
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = URL.createObjectURL(file);
  });
  const { width: w, height: h } = img;
  let sw = w, sh = h, sx = 0, sy = 0;
  if (w / h > aspect) { sw = h * aspect; sx = (w - sw) / 2; }
  else { sh = w / aspect; sy = (h - sh) / 2; }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(img.src);
  return new Promise((res) =>
    canvas.toBlob((b) => res(new File([b], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" })), "image/jpeg", 0.92)
  );
}

export default function StartImagePicker({ userId, prefId, current = [], onSaved, onClose }) {
  const [images, setImages] = useState(current || []);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(null);
  const [tab, setTab] = useState("auswahl");
  const [query, setQuery] = useState("");
  const fileRef = useRef(null);

  const add = (src, title) => {
    if (images.length >= 7) return;
    setImages((prev) => [...prev, { src, title }]);
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    setBusy("up");
    try {
      const cropped = await cropToAspect(file).catch(() => file);
      const res = await base44.integrations.Core.UploadPrivateFile({ file: cropped });
      add(res.file_uri, file.name.slice(0, 30));
    } finally {
      setBusy(null);
    }
  };
  const removeAt = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const generate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy("gen");
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt: prompt.trim() });
      add(res.url, prompt.trim().slice(0, 30));
      setPrompt("");
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy("save");
    try {
      if (prefId) {
        await base44.entities.UserPreference.update(prefId, { startImages: images });
      } else {
        await base44.entities.UserPreference.create({ userId, startImages: images });
      }
      onSaved(images);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-strong rounded-3xl border-2 border-primary/40 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <p className="text-[15px] font-bold text-foreground">Meine Startbilder</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Deine Auswahl · {images.length}/7</p>
          {images.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-3 text-center rounded-xl bg-background border border-border">Noch keine Bilder — such unten welche aus oder generiere eigene.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {images.map((img, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden aspect-[3/4] group">
                  <Image src={img.src} fittingType="fill" className="w-full h-full" />
                  <button
                    onClick={() => removeAt(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setTab("auswahl")} className={cn("px-3 py-1 rounded-full text-[12px] font-bold", tab === "auswahl" ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground")}>Aus Galerie wählen</button>
          <button onClick={() => setTab("upload")} className={cn("px-3 py-1 rounded-full text-[12px] font-bold", tab === "upload" ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground")}>Eigenes hochladen</button>
          <button onClick={() => setTab("generieren")} className={cn("px-3 py-1 rounded-full text-[12px] font-bold", tab === "generieren" ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground")}>Per KI erstellen</button>
        </div>

        {tab === "auswahl" ? (
          <div className="flex flex-col gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen — z. B. Tania, Live, Storys, Chat …"
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            {(() => {
              const q = query.trim().toLowerCase();
              const hits = q ? GALLERY.filter((g) => g.title.toLowerCase().includes(q)) : GALLERY;
              if (!hits.length) {
                return <p className="text-[12px] text-muted-foreground py-3 text-center">Nichts gefunden für „{query}“. Versuch es mit einem anderen Wort oder generiere eigenes.</p>;
              }
              return (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {hits.map((g) => {
                    const taken = images.some((i) => i.src === g.src);
                    return (
                      <button
                        key={g.src}
                        onClick={() => !taken && add(g.src, g.title)}
                        disabled={taken || images.length >= 7}
                        className={cn("relative rounded-lg overflow-hidden aspect-[3/4] border-2 transition-colors", taken ? "border-primary opacity-50" : "border-border hover:border-primary/50")}
                      >
                        <Image src={g.src} fittingType="fill" className="w-full h-full" />
                        <span className="absolute bottom-0 left-0 right-0 bg-background/70 text-[9px] font-bold text-foreground px-1 py-0.5 truncate">{taken ? "✓ " : ""}{g.title}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : tab === "upload" ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-8 px-4 text-center">
            <Upload className="w-7 h-7 text-primary" />
            <p className="text-[12px] text-muted-foreground">Eigenes Bild hochladen (stored privately)</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={upload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy === "up" || images.length >= 7}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
            >
              {busy === "up" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Datei wählen
            </button>
            {images.length >= 7 && <p className="text-[11px] text-muted-foreground">Maximum erreicht — entferne erst ein Bild.</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="Beschreib dein Wunsch-Bild, z.B. verträumte Frau im warmen Kerzenlicht, cinematisch, dunkle Töne"
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
            />
            <button
              onClick={generate}
              disabled={!prompt.trim() || busy === "gen" || images.length >= 7}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50 self-start"
            >
              {busy === "gen" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Bild generieren
            </button>
            {images.length >= 7 && <p className="text-[11px] text-muted-foreground">Maximum erreicht — entferne erst ein Bild.</p>}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground">Abbrechen</button>
          <button
            onClick={save}
            disabled={busy === "save"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
          >
            {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}