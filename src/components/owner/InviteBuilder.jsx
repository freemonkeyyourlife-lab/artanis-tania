import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Mail, MessageCircle, Plus, Smartphone, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { CHANNELS, copyText, inviteUrl, makeCode, makeToken, shareLinks } from "@/lib/invites";

const input = "w-full px-4 py-3 rounded-xl bg-background border border-border text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Anlegen und dann sofort weitergeben — auf dem Weg, der dir gerade passt.
export default function InviteBuilder({ onCreated }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ label: "", channel: "LINK", grantStatus: "GOLD", maxUses: 0 });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const create = async () => {
    setCreating(true);
    try {
      const me = await base44.auth.me();
      const invite = await base44.entities.InviteLink.create({
        token: makeToken(),
        code: makeCode(),
        creatorId: me.id,
        targetType: "VIP",
        channel: form.channel,
        active: true,
        label: form.label || "Einladung",
        grantStatus: form.grantStatus,
        maxUses: Number(form.maxUses) || 0,
        useCount: 0,
        claimedBy: [],
        clickCount: 0,
        registrationCount: 0,
        purchaseCount: 0,
        revenueAttributed: 0,
      });
      setCreated(invite);
      setForm({ label: "", channel: form.channel, grantStatus: "GOLD", maxUses: 0 });
      onCreated?.(invite);
    } catch (e) {
      toast({ title: "Nicht angelegt", description: "Versuch es nochmal.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const url = created ? inviteUrl(created.token) : "";
  const links = created ? shareLinks(created.token, created.label) : null;

  const copy = async (value, note) => {
    const ok = await copyText(value);
    toast({ title: ok ? note : "Kopieren ging nicht", description: ok ? undefined : "Markier den Text und kopier ihn von Hand." });
  };

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <p className="font-display text-xl text-foreground mb-1">Einladung anlegen</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4">
        Du brauchst keine E-Mail-Adresse. Leg die Einladung an und gib sie weiter, wie du willst.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <input value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="Für wen? z. B. Julia" className={input} />
        <select value={form.grantStatus} onChange={(e) => set("grantStatus", e.target.value)} className={input}>
          <option value="GOLD">Alles frei (Gold)</option>
          <option value="STANDARD">Normaler Zugang</option>
        </select>
        <input
          type="number"
          min="0"
          value={form.maxUses}
          onChange={(e) => set("maxUses", e.target.value)}
          placeholder="Wie oft nutzbar? 0 = unbegrenzt"
          className={input}
        />
      </div>

      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Womit gibst du sie weiter?</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => set("channel", c.id)}
            title={c.hint}
            className={cn(
              "px-4 py-2 rounded-full text-[13px] font-bold border transition-colors",
              form.channel === c.id ? "glass-btn glass-btn-accent text-gloss border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <button
        onClick={create}
        disabled={creating}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
      >
        <Plus className="w-4 h-4" /> {creating ? "Lege an …" : "Einladung anlegen"}
      </button>

      {created && (
        <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 p-5">
          <p className="font-display text-lg text-foreground mb-1">Fertig — so gibst du sie weiter</p>
          <p className="text-[13px] font-semibold text-muted-foreground mb-4">
            Alles hier führt auf dieselbe Einladung. Nimm den Weg, der dir gerade am liebsten ist.
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <code className="flex-1 min-w-[220px] px-4 py-3 rounded-xl bg-background border border-border text-[13px] font-semibold text-foreground truncate">{url}</code>
            <button onClick={() => copy(url, "Link kopiert")} className="inline-flex items-center gap-2 px-4 py-3 rounded-full glass-btn text-[13px] font-bold text-foreground">
              <Copy className="w-4 h-4" /> Link kopieren
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <a href={links.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[13px] font-bold text-foreground">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a href={links.sms} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[13px] font-bold text-foreground">
              <Smartphone className="w-4 h-4" /> SMS
            </a>
            <a href={links.email} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[13px] font-bold text-foreground">
              <Mail className="w-4 h-4" /> E-Mail
            </a>
          </div>

          <div className="flex flex-wrap items-start gap-5">
            <div className="flex-1 min-w-[220px]">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Code zum Vorlesen</p>
              <button
                onClick={() => copy(created.code, "Code kopiert")}
                className="px-5 py-3 rounded-xl bg-background border border-border font-display text-2xl tracking-[0.25em] text-primary"
              >
                {created.code}
              </button>
              <p className="text-[13px] font-semibold text-muted-foreground mt-2">
                Der Gast tippt den Code auf seiner Konto-Seite ein — kein Link nötig.
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5 justify-center">
                <QrCode className="w-3.5 h-3.5" /> QR-Code
              </p>
              <div className="bg-white p-3 rounded-xl inline-block">
                <QRCodeSVG value={url} size={128} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}