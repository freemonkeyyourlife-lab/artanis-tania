import React, { useState } from "react";
import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Kameras und Mikrofone durchschalten — auch eine externe Kamera oder das
// Handy, das als Webcam am Rechner hängt.
export default function DevicePicker({ devices, activeDevice, onPick, onOpen, className }) {
  const [open, setOpen] = useState(false);

  const list = (items, kind) => (
    <div className="space-y-1.5">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nichts gefunden — erst Kamera erlauben, dann neu öffnen.</p>
      ) : (
        items.map((d) => (
          <button
            key={d.id}
            onClick={() => onPick?.(kind, d.id)}
            className={cn(
              "w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition-colors",
              activeDevice?.[kind] === d.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {d.label}
          </button>
        ))
      )}
    </div>
  );

  return (
    <>
      <button
        onClick={() => { onOpen?.(); setOpen(true); }}
        title="Kamera und Mikrofon wählen — auch eine externe Kamera"
        className={cn("w-12 h-12 rounded-full bg-elevated text-foreground flex items-center justify-center transition-colors", className)}
      >
        <Camera className="w-5 h-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="font-display text-lg">Kamera & Mikrofon</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Alles, was am Gerät hängt — auch eine externe Kamera oder das Handy als Webcam. Umschalten wirkt sofort für alle im Call.
          </DialogDescription>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Kamera</p>
            {list(devices?.video || [], "video")}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mikrofon</p>
            {list(devices?.audio || [], "audio")}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}