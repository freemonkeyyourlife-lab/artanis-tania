import React, { useState } from "react";
import { UserPlus, Copy, Check, Eye, EyeOff, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

// Einladungs-Leiste für die Sitzung: erzeugt einen Link, mit dem eine
// Freundin live dazustoßen kann — sie sieht alles und darf mitreden.
export default function TherapyInviteBar({ session, isOwner, isGuest, guestName }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!session) return null;

  const origin = window.location.origin;
  const link = `${origin}/therapy/${session.id}?g=${encodeURIComponent(
    guestName || (isGuest ? "Freundin" : "Gast")
  )}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ variant: "destructive", title: "Kopieren fehlgeschlagen" });
    }
  };

  const makePublic = async () => {
    await base44.entities.TherapySession.update(session.id, { visibility: "PUBLIC" });
    toast({ title: "Jetzt offen", description: "Deine Freundin kann den Link öffnen." });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-3 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-foreground text-[11px] font-semibold hover:bg-muted transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" /> Freundin einladen
        </button>

        {isGuest && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
            <Eye className="w-3.5 h-3.5" /> Du bist live dabei als „{guestName || "Freundin"}"
          </span>
        )}

        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          {session.visibility === "PRIVATE" ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {session.visibility === "PRIVATE" ? "vertraulich — nur du" : "offen — Freundin kann zusehen"}
        </span>

        {isOwner && session.visibility === "PRIVATE" && (
          <button
            onClick={makePublic}
            className="ml-auto text-[11px] text-primary hover:underline"
          >
            Für Freundin öffnen
          </button>
        )}
      </div>

      {open && isOwner && (
        <div className="mt-3 rounded-xl bg-elevated p-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">
                Diesen Link schickst du deiner Freundin. Sie öffnet die Sitzung live, sieht alles und kann über den Seitenchat mitreden.
              </p>
              <code className="block break-all rounded-lg bg-background px-3 py-2 text-[11px] text-foreground">{link}</code>
              <div className="mt-2 flex gap-2">
                <button onClick={copy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Kopiert" : "Link kopieren"}
                </button>
                <button onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background text-muted-foreground text-[11px]">
                  <X className="w-3.5 h-3.5" /> Schließen
                </button>
              </div>
            </div>
            <div className="hidden sm:block rounded-xl bg-white p-2">
              <QRCodeSVG value={link} size={120} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}