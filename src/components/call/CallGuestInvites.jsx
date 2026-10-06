import React, { useState } from "react";
import { UserPlus, Copy, Check, Share2, Lock } from "lucide-react";
import { callGuestUrl, guestInviteText } from "@/lib/callLink";
import { useToast } from "@/components/ui/use-toast";
import CallTelegramInvites from "@/components/call/CallTelegramInvites";

// Persönliche Gäste-Links: jeder bekommt seinen eigenen, und du nimmst ihn
// jederzeit wieder zurück. Wer hereinkommen darf, entscheidet der Raum selbst.
export default function CallGuestInvites({ token, roomNumber, invites = [], onCreate, onRevoke }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [copied, setCopied] = useState("");

  const add = () => {
    const value = name.trim();
    if (!value) return;
    onCreate(value);
    setName("");
  };

  const copy = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    } catch (e) {
      toast({ title: "Kopieren nicht möglich", description: "Markiere den Link und kopiere ihn von Hand.", variant: "destructive" });
    }
  };

  const share = async (invite, url) => {
    const text = guestInviteText(roomNumber, url, invite.name);
    if (navigator.share) {
      try { await navigator.share({ title: "ARTANIS × TANIA", text, url }); return; } catch (e) { /* abgebrochen */ }
    }
    copy(url, invite.token);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      <div className="rounded-2xl border border-border bg-elevated p-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Neue Einladung</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Schreib den Namen dazu — jeder bekommt seinen eigenen Link für Chatraum {roomNumber}.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            placeholder="Name des Gastes"
            className="min-w-0 flex-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <button
            type="button"
            onClick={add}
            disabled={!name.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Link
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Damit auch wirklich nur Eingeladene herein dürfen, stell den Zugang unten auf <span className="font-semibold text-foreground">Privat</span>.
        </p>
      </div>

      <CallTelegramInvites token={token} roomNumber={roomNumber} onCreate={onCreate} />

      {invites.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">
          Noch keine Einladung. Sobald du einen Namen einträgst, entsteht der Link — er bleibt gültig, bis du ihn sperrst.
        </p>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => {
            const url = callGuestUrl(token, roomNumber, invite.token);
            return (
              <div key={invite.token} className="rounded-2xl border border-border bg-elevated p-3">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{invite.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {invite.usedBy ? `War schon drin: ${invite.usedBy}` : "Noch nicht benutzt"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRevoke(invite.token)}
                    title="Link sperren — damit kommt niemand mehr herein"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-[11px] font-semibold text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5" /> Sperren
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-foreground break-all bg-background border border-border rounded-xl px-2.5 py-2">{url}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => copy(url, invite.token)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                  >
                    {copied === invite.token ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Kopieren
                  </button>
                  <button
                    type="button"
                    onClick={() => share(invite, url)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground hover:border-primary/50 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Teilen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}