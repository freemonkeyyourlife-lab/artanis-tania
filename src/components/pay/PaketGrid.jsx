import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import {
  Loader2, Copy, Check, CreditCard, Crown, BookOpen, QrCode, MessageSquare, ChevronDown, ChevronUp,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Öffentliche Ansicht aller aktiven VIP-Stufen und PPV-Kapitel: jeder Packen
// zeigt den offenen Stripe-Link (Karte mit/ohne 3D Secure), QR-Code und SMS-Versand.
const INTERVALL = { WEEK: "Woche", MONTH: "Monat", YEAR: "Jahr" };
const eur = (c) => (Number(c || 0) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function PaketGrid() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(null);
  const [qrOpen, setQrOpen] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await base44.functions.invoke("stripePaket", { action: "publicList" });
      setItems(res.items || []);
    } catch (e) {
      setErr(e?.message || "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const copy = async (url, id) => {
    try { await navigator.clipboard.writeText(url); setCopied(id); setTimeout(() => setCopied(null), 1500); } catch {}
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" /> Pakete werden geladen …</div>;
  }
  if (err) {
    return <p className="text-xs text-destructive">{err}</p>;
  }
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">Aktuell sind keine Pakete freigeschaltet.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((p) => {
        const Icon = p.art === "KAPITEL" ? BookOpen : Crown;
        const url = p.stripeLinkUrl;
        const smsBody = encodeURIComponent(`${p.name} — ${eur(p.betragCents)}${p.wiederkehrend ? " / " + (INTERVALL[p.intervall] || "Monat") : ""}\n${url}`);
        return (
          <div key={p.id} className="rounded-2xl border-2 border-border bg-card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-[15px] font-bold text-foreground flex-1 min-w-0 truncate">{p.name}</p>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-elevated border border-border text-muted-foreground">
                {p.art === "KAPITEL" ? "PPV" : "VIP"}
              </span>
            </div>

            <p className="text-[18px] font-bold text-primary">
              {eur(p.betragCents)}{p.wiederkehrend ? ` / ${INTERVALL[p.intervall] || "Monat"}` : " einmalig"}
            </p>

            {p.beschreibung && <p className="text-xs text-muted-foreground leading-relaxed">{p.beschreibung}</p>}

            {url ? (
            <>
              <div className="flex items-center gap-2">
                <input readOnly value={url} className="flex-1 px-2 py-1 rounded-lg bg-background border border-border text-[11px] text-muted-foreground truncate focus:outline-none" />
                <button onClick={() => copy(url, p.id)} className="px-2 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground inline-flex items-center gap-1">
                  {copied === p.id ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                  {copied === p.id ? "Kopiert" : "Kopieren"}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-btn glass-btn-accent text-[12px] font-bold text-gloss">
                  <CreditCard className="w-3.5 h-3.5" /> Mit Karte zahlen
                </a>
                <button onClick={() => setQrOpen(qrOpen === p.id ? null : p.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn text-[11px] font-bold text-foreground">
                  <QrCode className="w-3.5 h-3.5" /> QR
                  {qrOpen === p.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <a href={`sms:?&body=${smsBody}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn text-[11px] font-bold text-foreground">
                  <MessageSquare className="w-3.5 h-3.5" /> SMS
                </a>
              </div>

              {qrOpen === p.id && (
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-background border border-border p-3">
                  <div className="rounded-xl bg-white p-3">
                    <QRCodeSVG value={url} size={156} level="M" />
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center leading-snug">
                    Scannen öffnet die Zahlungsseite — Kreditkarte mit und ohne 3D Secure, mobiles Bezahlen.
                  </p>
                </div>
              )}
            </>
            ) : (
              <p className="text-[11px] text-muted-foreground">Zahlungslink wird gerade vorbereitet.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}