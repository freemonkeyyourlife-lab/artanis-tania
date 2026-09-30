import React, { useState } from "react";
import { UserPlus, Copy, Check, Share2, Send } from "lucide-react";
import { telegramShareUrl } from "@/lib/share";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import CallLink from "@/components/call/CallLink";
import CallQr from "@/components/call/CallQr";

// Einladen mit allem, was man in der Hand hat: Link, kurzer Code, QR-Code und fertiger Text.
export default function CallInvite({ url, code, className, label = "Einladen", onNewLink }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState("");
  const pretty = code ? `${code.slice(0, 4)}-${code.slice(4)}` : "";
  const invitation = `ARTANIS × TRIANIA — Video-Call.\nKomm rein: ${url}\nOder gib im Call den Code ${pretty} ein.`;

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 2000);
    } catch (e) {
      toast({ title: "Kopieren nicht möglich", description: "Markiere den Text und kopiere ihn von Hand.", variant: "destructive" });
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "ARTANIS × TRIANIA", text: invitation, url });
        return;
      } catch (e) { /* abgebrochen */ }
    }
    copy(invitation, "text");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:accent-glow transition-all", className)}>
          <UserPlus className="w-3.5 h-3.5 flex-shrink-0" /> {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-lg text-foreground mb-1">Zum Video-Call einladen</h3>
        <p className="text-xs text-muted-foreground mb-4">Link, kurzer Code oder QR-Code — alles führt in denselben Call.</p>

        <CallLink url={url} onNewLink={onNewLink} />

        <div className="mt-4 rounded-2xl border border-border bg-elevated p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Kurzer Code</p>
          <p className="font-mono text-2xl tracking-[0.3em] text-foreground">{pretty}</p>
          <button
            onClick={() => copy(code, "code")}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background border border-border text-xs text-foreground"
          >
            {copied === "code" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Code kopieren
          </button>
        </div>

        <div className="mt-4">
          <CallQr value={url} />
          <p className="text-[11px] text-muted-foreground text-center mt-2">Mit dem Handy scannen</p>
        </div>

        <button
          onClick={share}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground hover:border-primary/50 transition-colors"
        >
          <Share2 className="w-4 h-4" /> Einladung teilen
        </button>
        <button
          onClick={() => copy(invitation, "text")}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground hover:border-primary/50 transition-colors"
        >
          {copied === "text" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Einladungstext kopieren
        </button>
        <button
          onClick={() => window.open(telegramShareUrl(url, invitation), "_blank", "noopener")}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground hover:border-primary/50 transition-colors"
        >
          <Send className="w-4 h-4" /> Per Telegram senden
        </button>
      </DialogContent>
    </Dialog>
  );
}