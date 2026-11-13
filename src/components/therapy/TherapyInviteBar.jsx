import React, { useState, useEffect } from "react";
import { UserPlus, Copy, Check, Eye, EyeOff, X, KeyRound, RefreshCw, Link as LinkIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { newCallCode, normalizeCallCode } from "@/lib/callLink";

// Einladungs-Leiste für die Sitzung: teile einen Geheim-Code statt HTTPS-Link.
// Empfängerin geht auf /beitreten, tippt den Code ein und ist live dabei.
export default function TherapyInviteBar({ session, isOwner, isGuest, guestName, onUpdated }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [generating, setGenerating] = useState(false);

  const code = session?.inviteCode || "";

  // Beim ersten Öffnen als Gastgeberin: Code erzeugen, falls keiner da ist.
  useEffect(() => {
    if (!session) return;
    if (!open || !isOwner || code || generating) return;
    setGenerating(true);
    const c = newCallCode();
    base44.entities.TherapySession
      .update(session.id, { inviteCode: c })
      .then((updated) => onUpdated?.(updated))
      .catch(() => {})
      .finally(() => setGenerating(false));
  }, [open, isOwner, code, generating]);

  if (!session) return null;

  const origin = window.location.origin;
  const link = `${origin}/therapy/${session.id}?g=${encodeURIComponent(
    guestName || (isGuest ? "Freundin" : "Gast")
  )}`;

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ variant: "destructive", title: "Kopieren fehlgeschlagen" });
    }
  };

  const newCode = async () => {
    const c = newCallCode();
    setGenerating(true);
    try {
      const updated = await base44.entities.TherapySession.update(session.id, { inviteCode: c });
      onUpdated?.(updated);
      toast({ title: "Neuer Code", description: "Der alte Code gilt nicht mehr." });
    } catch {} finally {
      setGenerating(false);
    }
  };

  const makePublic = async () => {
    const updated = await base44.entities.TherapySession.update(session.id, { visibility: "PUBLIC" });
    onUpdated?.(updated);
    toast({ title: "Jetzt offen", description: "Deine Freundin kann den Code benutzen." });
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
          <div className="flex items-start gap-2 mb-2">
            <KeyRound className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">Geheim-Code zum Teilen</p>
              <p className="text-[11px] text-muted-foreground">
                Schick nur diesen Code — keine URL. Die Empfängerin geht auf die Seite, klickt „Mit Code beitreten" und tippt ihn ein. Geht auch dort, wo Links verboten sind.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <code className="px-4 py-2.5 rounded-xl bg-background border-2 border-border text-foreground text-xl font-bold tracking-[0.25em]">
              {generating ? "······" : code}
            </code>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Kopiert" : "Code kopieren"}
            </button>
            <button
              onClick={newCode}
              disabled={generating}
              title="Neuen Code erzeugen — alten ungültig machen"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-background text-muted-foreground text-[11px] hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Neu
            </button>
            <button
              onClick={() => setShowLink((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-background text-muted-foreground text-[11px] hover:text-foreground"
            >
              <LinkIcon className="w-3.5 h-3.5" /> {showLink ? "Link verbergen" : "Vollständiger Link"}
            </button>
            <button onClick={() => setOpen(false)} className="ml-auto inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-background text-muted-foreground text-[11px]">
              <X className="w-3.5 h-3.5" /> Schließen
            </button>
          </div>

          {showLink && (
            <div className="mt-3 flex flex-wrap items-start gap-3">
              <code className="flex-1 min-w-[12rem] break-all rounded-lg bg-background px-3 py-2 text-[11px] text-muted-foreground">{link}</code>
              <div className="hidden sm:block rounded-xl bg-white p-2">
                <QRCodeSVG value={link} size={96} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}