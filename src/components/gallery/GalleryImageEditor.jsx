import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X, RotateCw, FlipHorizontal2, Check, Send, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Bearbeitungsmodus für ein Galerie-Bild: zuschneiden, optimieren
// (Helligkeit/Kontrast/Sättigung), rotieren/spiegeln — dann in der Galerie
// speichern oder direkt in einen Trainingslauf übernehmen.

const ASPECTS = [
  { label: "Frei", value: 0 },
  { label: "1:1", value: 1 },
  { label: "3:4", value: 3 / 4 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
];
const MAX_DISPLAY = 520;
const MIN_SIZE = 24;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function GalleryImageEditor({ item, onClose, onSaved, onSendTraining }) {
  const { toast } = useToast();
  const wrapRef = useRef(null);
  const objUrlRef = useRef(null);
  const dragRef = useRef(null);
  const [img, setImg] = useState(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [aspect, setAspect] = useState(0);
  const [display, setDisplay] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState(null);
  const [busy, setBusy] = useState(false);

  const rotated = rotation % 180 === 90;
  const rnW = rotated ? natural.h : natural.w;
  const rnH = rotated ? natural.w : natural.h;

  // Bild laden — als Blob, damit die Canvas nicht tainted wird.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(item.url, { mode: "cors" });
        const blob = await res.blob();
        const u = URL.createObjectURL(blob);
        if (cancelled) { URL.revokeObjectURL(u); return; }
        objUrlRef.current = u;
        const im = new Image();
        im.onload = () => { if (!cancelled) setImg(im); };
        im.src = u;
      } catch {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => { if (!cancelled) setImg(im); };
        im.onerror = () => toast({ variant: "destructive", title: "Bild ließ sich nicht laden" });
        im.src = item.url;
      }
    })();
    return () => {
      cancelled = true;
      if (objUrlRef.current) { URL.revokeObjectURL(objUrlRef.current); objUrlRef.current = null; }
    };
  }, [item.url]);

  // Anzeigegröße + initialer Zuschnitt (voll) bei Rotations-/Größenwechsel.
  useEffect(() => {
    if (!rnW || !rnH) return;
    const scale = Math.min(MAX_DISPLAY / rnW, MAX_DISPLAY / rnH, 1);
    const w = Math.round(rnW * scale);
    const h = Math.round(rnH * scale);
    setDisplay({ w, h });
    setCrop({ x: 0, y: 0, w, h });
  }, [rnW, rnH]);

  // Aspect-Preset → zentrierter Zuschnitt im gewählten Verhältnis.
  const applyAspect = (r) => {
    setAspect(r);
    if (!display.w || !display.h) return;
    let w = display.w, h = display.h;
    if (r) {
      if (w / r <= h) { h = w / r; } else { w = h * r; }
    }
    setCrop({
      x: Math.round((display.w - w) / 2),
      y: Math.round((display.h - h) / 2),
      w: Math.round(w),
      h: Math.round(h),
    });
  };

  // --- Pointer-Interaktion: verschieben, Ecken ziehen, neu aufziehen ---
  const beginDrag = (e, mode, handle) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      mode, handle,
      startX: e.clientX, startY: e.clientY,
      crop: { ...crop },
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
  };

  const beginNew = (e) => {
    if (e.target !== wrapRef.current && !e.target.dataset.backdrop) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const px = clamp(e.clientX - rect.left, 0, display.w);
    const py = clamp(e.clientY - rect.top, 0, display.h);
    dragRef.current = { mode: "new", startX: px, startY: py, rect };
    setCrop({ x: px, y: py, w: 0, h: 0 });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
  };

  const onMove = (e) => {
    const d = dragRef.current;
    if (!d || !display.w) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const mx = clamp(e.clientX - rect.left, 0, display.w);
    const my = clamp(e.clientY - rect.top, 0, display.h);
    if (d.mode === "move") {
      const w = d.crop.w, h = d.crop.h;
      setCrop({ x: clamp(mx - (d.startX - d.crop.x), 0, display.w - w), y: clamp(my - (d.startY - d.crop.y), 0, display.h - h), w, h });
    } else if (d.mode === "new") {
      const x = Math.min(d.startX, mx), y = Math.min(d.startY, my);
      let w = Math.abs(mx - d.startX), h = Math.abs(my - d.startY);
      if (aspect) { if (w / aspect <= h) { h = w / aspect; } else { w = h * aspect; } }
      setCrop({ x, y, w: Math.max(MIN_SIZE, w), h: Math.max(MIN_SIZE, h) });
    } else if (d.mode === "resize") {
      setCrop((cur) => resizeCorner(cur, d.handle, mx, my, display, aspect));
    }
  };

  const endDrag = () => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", endDrag);
  };

  useEffect(() => () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", endDrag); }, []);

  // --- Eckenziehen mit festem Gegenüber-Eck + optionaler Seitenverhältnis-Sperre ---
  const resizeCorner = (cur, handle, mx, my, disp, r) => {
    const ox = handle.includes("w") ? cur.x + cur.w : cur.x;
    const oy = handle.includes("n") ? cur.y + cur.h : cur.y;
    let w = Math.abs(mx - ox);
    let h = Math.abs(my - oy);
    if (handle.includes("w")) w = Math.min(w, ox); else w = Math.min(w, disp.w - ox);
    if (handle.includes("n")) h = Math.min(h, oy); else h = Math.min(h, disp.h - oy);
    if (r) {
      if (w / r <= h) { h = w / r; } else { w = h * r; }
    }
    w = Math.max(MIN_SIZE, w); h = Math.max(MIN_SIZE, h);
    const x = handle.includes("w") ? ox - w : ox;
    const y = handle.includes("n") ? oy - h : oy;
    return { x, y, w, h };
  };

  const reset = () => {
    setRotation(0); setFlipH(false);
    setBrightness(100); setContrast(100); setSaturation(100); setAspect(0);
    setCrop({ x: 0, y: 0, w: display.w, h: display.h });
  };

  const apply = async (alsoTraining) => {
    if (!img || !crop || crop.w < MIN_SIZE || crop.h < MIN_SIZE) {
      toast({ variant: "destructive", title: "Zuschnitt zu klein" }); return;
    }
    setBusy(true);
    try {
      const source = document.createElement("canvas");
      source.width = rnW; source.height = rnH;
      const sctx = source.getContext("2d");
      sctx.save();
      sctx.translate(rnW / 2, rnH / 2);
      sctx.rotate((rotation * Math.PI) / 180);
      sctx.scale(flipH ? -1 : 1, 1);
      sctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      sctx.drawImage(img, -natural.w / 2, -natural.h / 2, natural.w, natural.h);
      sctx.restore();

      const scale = rnW / display.w;
      const sx = crop.x * scale, sy = crop.y * scale, sw = crop.w * scale, sh = crop.h * scale;
      const maxSide = 1280;
      let outW = sw, outH = sh;
      const longest = Math.max(sw, sh);
      if (longest > maxSide) { const f = maxSide / longest; outW = Math.round(sw * f); outH = Math.round(sh * f); }
      const out = document.createElement("canvas");
      out.width = outW; out.height = outH;
      const octx = out.getContext("2d");
      octx.imageSmoothingQuality = "high";
      octx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);

      const blob = await new Promise((res) => out.toBlob(res, "image/jpeg", 0.92));
      if (!blob) throw new Error("Export fehlgeschlagen");
      const file = new File([blob], (item.name || "bild").replace(/\.[^.]+$/, "") + "-bearbeitet.jpg", { type: "image/jpeg" });
      const up = await base44.integrations.Core.UploadPublicFile({ file });
      const newUrl = up.file_url;
      await base44.entities.ImageArchive.update(item.id, { url: newUrl });
      onSaved?.(newUrl);
      if (alsoTraining && onSendTraining) await onSendTraining(newUrl);
      toast({ title: "Gespeichert", description: alsoTraining ? "Bearbeitet und ins Training übernommen." : "Bild in der Galerie aktualisiert." });
      onClose?.();
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally { setBusy(false); }
  };

  const filterCss = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  const imgW = rotated ? display.h : display.w;
  const imgH = rotated ? display.w : display.h;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-foreground">Bild bearbeiten</h2>
          <button onClick={onClose} className="rounded-full bg-elevated p-2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {!img ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Zeichenfläche */}
              <div className="flex justify-center">
                <div
                  ref={wrapRef}
                  onPointerDown={beginNew}
                  className="relative touch-none select-none overflow-hidden rounded-xl bg-black"
                  style={{ width: display.w || 320, height: display.h || 320, cursor: "crosshair" }}
                >
                  <div data-backdrop className="absolute inset-0" />
                  <img
                    src={img.src}
                    alt=""
                    draggable={false}
                    className="absolute left-1/2 top-1/2 max-w-none"
                    style={{
                      width: imgW, height: imgH,
                      transform: `translate(-50%,-50%) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                      filter: filterCss,
                    }}
                  />
                  {crop && (
                    <div
                      onPointerDown={(e) => beginDrag(e, "move")}
                      className="absolute border-2 border-primary"
                      style={{
                        left: crop.x, top: crop.y, width: crop.w, height: crop.h,
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                        cursor: "move",
                      }}
                    >
                      {["nw", "ne", "sw", "se"].map((h) => (
                        <span
                          key={h}
                          onPointerDown={(e) => beginDrag(e, "resize", h)}
                          className="absolute h-4 w-4 rounded-full border-2 border-primary bg-white"
                          style={{
                            left: h.includes("w") ? -8 : "auto",
                            right: h.includes("e") ? -8 : "auto",
                            top: h.includes("n") ? -8 : "auto",
                            bottom: h.includes("s") ? -8 : "auto",
                            cursor: "nwse-resize",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Werkzeuge */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">Format</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ASPECTS.map((a) => (
                      <button key={a.label} onClick={() => applyAspect(a.value)}
                        className={"rounded-full px-3 py-1.5 text-xs " + (aspect === a.value ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setRotation((r) => (r + 90) % 360)} className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs">
                    <RotateCw className="h-3.5 w-3.5" /> Drehen
                  </button>
                  <button onClick={() => setFlipH((f) => !f)} className={"glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs " + (flipH ? "border-primary" : "")}>
                    <FlipHorizontal2 className="h-3.5 w-3.5" /> Spiegeln
                  </button>
                  <button onClick={reset} className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs">
                    <RefreshCw className="h-3.5 w-3.5" /> Zurück
                  </button>
                </div>

                <Slider label="Helligkeit" value={brightness} onChange={setBrightness} />
                <Slider label="Kontrast" value={contrast} onChange={setContrast} />
                <Slider label="Sättigung" value={saturation} onChange={setSaturation} />

                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => apply(false)} disabled={busy}
                    className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} In Galerie speichern
                  </button>
                  <button onClick={() => apply(true)} disabled={busy}
                    className="glass-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Speichern & ins Training
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">Zuschnitt und Optimierung werden als neues Bild gespeichert (stored publicly — anyone with the link can open them) und ersetzen dieses Galerie-Stück.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{value}%</span>
      </div>
      <input type="range" min={0} max={200} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary" />
    </div>
  );
}