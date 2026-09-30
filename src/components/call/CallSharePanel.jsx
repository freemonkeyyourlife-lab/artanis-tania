import React, { useState } from "react";
import { Copy, Check, Plus, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { callInviteUrl, callInviteText } from "@/lib/callLink";
import CallQr from "@/components/call/CallQr";
import BotInviteList from "@/components/call/BotInviteList";
import { useToast } from "@/components/ui/use-toast";

const pretty = (t) => `${t.slice(0, 4)}-${t.slice(4)}`;

// Alles zum Weitergeben liegt rechts im Call — kein Fenster, das man erst
// wieder schließen muss. Jeder Raum trägt seine Nummer, damit nichts
// verwechselt wird.
export default function CallSharePanel({ token, roomNumber, rooms = [], isHost, onOpen, onNewRoom }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState("");
  const url = callInviteUrl(token, roomNumber);
  const invitation = callInviteText(token, roomNumber);

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 2000);
    } catch (e) {
      toast({ title: "Kopieren nicht möglich", description: "Markiere den Link und kopiere ihn von Hand.", variant: "destructive" });
    }
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "ARTANIS × TRIANIA", text: invitation, url }); return; } catch (e) { /* abgebrochen */ }
    }
    copy(invitation, "text");
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      <div className="rounded-2xl border border-border bg-elevated p-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Du bist in</p>
        <p className="font-display text-xl text-foreground">Chatraum {roomNumber}</p>
        <p className="font-mono text-xs tracking-[0.25em] text-muted-foreground mt-0.5">{pretty(token)}</p>

        <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">Link zum Weitergeben</p>
        <p className="mt-1 text-xs text-foreground break-all bg-background border border-border rounded-xl px-3 py-2">{url}</p>

        <button
          onClick={() => copy(url, "link")}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          {copied === "link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Link kopieren
        </button>
        <button
          onClick={share}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground hover:border-primary/50 transition-colors"
        >
          <Share2 className="w-4 h-4" /> {copied === "text" ? "Text kopiert ✓" : "Einladung teilen"}
        </button>

        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Über den Bot einladen</p>
          <p className="mt-1 mb-2 text-[11px] text-muted-foreground">
            Die Einladung kommt als Nachricht deines Bots an — nicht aus deinem privaten Telegram.
          </p>
          <BotInviteList text={invitation} />
        </div>
      </div>

      {isHost && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Deine Chaträume</p>
          <div className="space-y-2">
            {rooms.map((r) => (
              <div
                key={r.token}
                className={cn("rounded-xl border px-3 py-2 flex items-center gap-2", r.token === token ? "border-primary/50 bg-primary/10" : "border-border bg-elevated")}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Chatraum {r.number}</p>
                  <p className="font-mono text-[11px] tracking-[0.15em] text-muted-foreground">{pretty(r.token)}</p>
                </div>
                {r.token === token ? (
                  <span className="text-[11px] font-semibold text-primary flex-shrink-0">hier</span>
                ) : (
                  <button
                    onClick={() => onOpen(r)}
                    title={`In Chatraum ${r.number} wechseln`}
                    className="px-3 py-1.5 rounded-full bg-background border border-border text-[11px] font-semibold text-foreground flex-shrink-0"
                  >
                    Öffnen
                  </button>
                )}
                <button
                  onClick={() => copy(callInviteUrl(r.token, r.number), `room-${r.number}`)}
                  title="Link dieses Raums kopieren"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  {copied === `room-${r.number}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={onNewRoom}
            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-dashed border-border text-sm text-foreground hover:border-primary/50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Live-Chat anlegen
          </button>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Legt Chatraum {rooms.length + 1} an und öffnet ihn — den Link gibst du direkt daneben weiter.</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-elevated p-3">
        <CallQr value={url} />
        <p className="text-[11px] text-muted-foreground text-center mt-2">Mit dem Handy scannen — landet in Chatraum {roomNumber}</p>
      </div>
    </div>
  );
}