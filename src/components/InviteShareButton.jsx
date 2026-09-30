import React, { useState } from "react";
import { UserPlus, Copy, Check, Share2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { buildShareUrl, telegramShareUrl } from "@/lib/share";
import { cn } from "@/lib/utils";

export default function InviteShareButton({ className, label = "Einladen" }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const url = buildShareUrl();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link kopiert", description: "Schick ihn weiter — jeder bekommt darüber alles frei." });
    } catch (e) {
      toast({ title: "Kopieren nicht möglich", description: "Markiere den Link und kopiere ihn von Hand.", variant: "destructive" });
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ARTANIS × TRIANIA",
          text: "Komm rein — mit dem Link ist bei der Anmeldung alles für dich frei:",
          url,
        });
        return;
      } catch (e) { /* abgebrochen */ }
    }
    copy();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:accent-glow transition-all",
            className
          )}
        >
          <UserPlus className="w-3.5 h-3.5 flex-shrink-0" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <h3 className="font-display text-lg text-foreground mb-1">Freunde einladen</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Schick diesen Link weiter. Wer darüber kommt, hat ab der Anmeldung alles frei — ohne einen Cent.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-elevated border border-border text-xs text-foreground focus:outline-none focus:border-primary/50"
          />
          <button onClick={copy} title="Kopieren" className="px-3 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={share}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground hover:border-primary/50 transition-colors"
        >
          <Share2 className="w-4 h-4" /> Teilen
        </button>
        <button
          onClick={() => window.open(telegramShareUrl(url, "Komm rein — mit dem Link ist bei der Anmeldung alles für dich frei:"), "_blank", "noopener")}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground hover:border-primary/50 transition-colors"
        >
          <Send className="w-4 h-4" /> Per Telegram senden
        </button>
      </DialogContent>
    </Dialog>
  );
}