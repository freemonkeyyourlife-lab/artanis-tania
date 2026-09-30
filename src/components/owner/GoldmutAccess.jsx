import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Copy, Crown, Link2, QrCode, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { copyText, inviteUrl, makeCode, makeToken } from "@/lib/invites";

const GOLD_LABEL = "Goldmut-Zugang";
const STANDARD_LABEL = "Standard-Zugang";

const input =
  "w-full px-4 py-3 rounded-xl bg-background border border-border text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Zwei Links und ein Code: der Goldmut-Link macht aus einem Gast sofort einen
// Goldnutzer, der Standard-Link einen normalen. Der Code führt auf denselben
// Goldmut-Zugang — zum Vorlesen oder Abtippen auf der Konto-Seite.
export default function GoldmutAccess() {
  const { toast } = useToast();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const all = await base44.entities.InviteLink.list("-created_date", 100);
      setLinks(all.filter((l) => l.label === GOLD_LABEL || l.label === STANDARD_LABEL));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const gold = links.find((l) => l.label === GOLD_LABEL && l.active !== false);
  const standard = links.find((l) => l.label === STANDARD_LABEL && l.active !== false);
  const ready = Boolean(gold && standard);

  const create = async () => {
    setWorking(true);
    try {
      const me = await base44.auth.me();
      const base = {
        creatorId: me.id,
        targetType: "VIP",
        channel: "LINK",
        active: true,
        maxUses: 0,
        useCount: 0,
        claimedBy: [],
        clickCount: 0,
        registrationCount: 0,
        purchaseCount: 0,
        revenueAttributed: 0,
      };
      const created = await base44.entities.InviteLink.bulkCreate([
        { ...base, token: makeToken(), code: makeCode(), label: GOLD_LABEL, grantStatus: "GOLD" },
        { ...base, token: makeToken(), code: makeCode(), label: STANDARD_LABEL, grantStatus: "STANDARD" },
      ]);
      setLinks((prev) => [...(Array.isArray(created) ? created : []), ...prev]);
      toast({ title: "Zugänge stehen", description: "Goldmut-Link, Standard-Link und der Code sind fertig." });
    } catch (e) {
      console.error(e);
      toast({ title: "Nicht angelegt", description: "Versuch es nochmal.", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  const rotate = async () => {
    if (!window.confirm("Neue Zugänge erzeugen? Die alten Links funktionieren danach nicht mehr.")) return;
    setWorking(true);
    try {
      await Promise.all(links.filter((l) => l.active !== false).map((l) => base44.entities.InviteLink.update(l.id, { active: false })));
      await create();
      await load();
    } finally {
      setWorking(false);
    }
  };

  const copy = async (value, note) => {
    const ok = await copyText(value);
    toast({ title: ok ? note : "Kopieren ging nicht", description: ok ? undefined : "Markier den Text und kopier ihn von Hand." });
  };

  if (loading) return null;

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <p className="font-display text-xl text-foreground mb-1">Goldmut-Zugang</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4">
        Zwei Links und ein Code. Wer den Goldmut-Link öffnet oder den Code eintippt, hat danach alles frei — der Standard-Link bleibt normal.
      </p>

      {!ready ? (
        <button
          onClick={create}
          disabled={working}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
        >
          <Crown className="w-4 h-4" /> {working ? "Lege an …" : "Zugänge anlegen"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
              <Crown className="w-3.5 h-3.5" /> Goldmut-Link — alles frei
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-[220px] px-4 py-3 rounded-xl bg-background border border-border text-[13px] font-semibold text-foreground truncate">
                {inviteUrl(gold.token)}
              </code>
              <button onClick={() => copy(inviteUrl(gold.token), "Goldmut-Link kopiert")} className="inline-flex items-center gap-2 px-4 py-3 rounded-full glass-btn text-[13px] font-bold text-foreground">
                <Copy className="w-4 h-4" /> Kopieren
              </button>
            </div>
            <p className="text-[13px] font-semibold text-muted-foreground mt-2">
              Bisher {gold.useCount || 0} Mal eingelöst{gold.maxUses ? ` von ${gold.maxUses}` : ""}.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-elevated p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              <Link2 className="w-3.5 h-3.5" /> Standard-Link — normaler Zugang
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-[220px] px-4 py-3 rounded-xl bg-background border border-border text-[13px] font-semibold text-foreground truncate">
                {inviteUrl(standard.token)}
              </code>
              <button onClick={() => copy(inviteUrl(standard.token), "Standard-Link kopiert")} className="inline-flex items-center gap-2 px-4 py-3 rounded-full glass-btn text-[13px] font-bold text-foreground">
                <Copy className="w-4 h-4" /> Kopieren
              </button>
            </div>
            <p className="text-[13px] font-semibold text-muted-foreground mt-2">
              Bisher {standard.useCount || 0} Mal eingelöst{standard.maxUses ? ` von ${standard.maxUses}` : ""}.
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-5">
            <div className="flex-1 min-w-[220px]">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Code für den Goldmut-Zugang</p>
              <button
                onClick={() => copy(gold.code, "Code kopiert")}
                className="px-5 py-3 rounded-xl bg-background border border-border font-display text-2xl tracking-[0.25em] text-primary"
              >
                {gold.code}
              </button>
              <p className="text-[13px] font-semibold text-muted-foreground mt-2">
                Der Gast tippt den Code auf seiner Konto-Seite ein — ganz ohne Link.
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5 justify-center">
                <QrCode className="w-3.5 h-3.5" /> QR-Code
              </p>
              <div className="bg-white p-3 rounded-xl inline-block">
                <QRCodeSVG value={inviteUrl(gold.token)} size={128} />
              </div>
            </div>
          </div>

          <button
            onClick={rotate}
            disabled={working}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[13px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", working && "animate-spin")} /> Neue Zugänge erzeugen
          </button>
        </div>
      )}
    </div>
  );
}