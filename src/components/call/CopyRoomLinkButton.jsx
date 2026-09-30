import React, { useMemo, useState } from "react";
import { Link2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { getCallToken, callInviteUrl } from "@/lib/callLink";

// Immer sichtbar im Chat: ein Klick legt den Raum-Link in die Zwischenablage —
// fertig zum Einfügen bei Telegram. Ohne Link wird der feste Chatraum 1 genommen.
export default function CopyRoomLinkButton({ url, className }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const fallback = useMemo(() => callInviteUrl(getCallToken(), 1), []);
  const roomUrl = url || fallback;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Raum-Link kopiert", description: "Jetzt bei Telegram einfügen." });
    } catch (e) {
      toast({ title: "Kopieren nicht möglich", description: "Markiere den Link und kopiere ihn von Hand.", variant: "destructive" });
    }
  };

  return (
    <button
      onClick={copy}
      title="Raum-Link kopieren — direkt bei Telegram einfügen"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors flex-shrink-0",
        copied ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
      {copied ? "Kopiert" : "Link kopieren"}
    </button>
  );
}