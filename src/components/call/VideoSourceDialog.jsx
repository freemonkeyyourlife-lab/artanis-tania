import React, { useState, useEffect } from "react";
import { Camera, Check, Copy, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import CallQr from "@/components/call/CallQr";

// Beim Start einer Video-Session einmal fragen: welche Kamera — und soll das
// Handy als zweite Kamera mit ins Bild? Die Wahl bleibt für den nächsten Call gemerkt.
export default function VideoSourceDialog({ open, onOpenChange, devices, activeId, onPick, onListDevices, phoneUrl, roomNumber }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Erst mit erlaubtem Zugriff tragen die Kameras richtige Namen.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setBusy(true);
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        s.getTracks().forEach((t) => t.stop());
      } catch (e) {
        // Ohne Freigabe bleibt die Liste eben leer.
      }
      if (!alive) return;
      await onListDevices?.();
      if (alive) setBusy(false);
    })();
    return () => { alive = false; };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phoneUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Dann eben von Hand kopieren.
    }
  };

  const cams = devices?.video || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogTitle className="font-display text-lg">Videoquelle wählen</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Welche Kamera die Sitzung zeigt — und ob das Handy als zweite Kamera mitläuft. Die Wahl gilt für den nächsten Start.
        </DialogDescription>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Kamera am Gerät</p>
          {busy && cams.length === 0 ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : cams.length === 0 ? (
            <p className="text-xs text-muted-foreground">Keine Kamera gefunden — bitte im Browser erlauben.</p>
          ) : (
            <div className="space-y-1.5">
              {cams.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onPick?.(d.id)}
                  className={cn(
                    "w-full flex items-center gap-2 text-left px-3.5 py-2.5 rounded-xl border text-sm transition-colors",
                    activeId === d.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Camera className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 truncate">{d.label || "Kamera"}</span>
                  {activeId === d.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-3">Handy als Kamera</p>
          <p className="text-xs text-muted-foreground mb-3">
            Diesen Code mit dem Handy scannen oder den Link öffnen. Das Handy kommt mit seiner Kamera in {roomNumber ? `Chatraum ${roomNumber}` : "den Raum"} — sein Bild ist für alle sichtbar.
          </p>
          {phoneUrl && <CallQr value={phoneUrl} size={150} />}
          <button
            onClick={copy}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-elevated text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            {copied ? "Link kopiert" : "Link kopieren"}
          </button>
        </div>

        <button
          onClick={() => onOpenChange?.(false)}
          className="w-full px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
        >
          Fertig
        </button>
      </DialogContent>
    </Dialog>
  );
}