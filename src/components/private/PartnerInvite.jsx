import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, UserPlus, Shield, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Lädt die Partnerin per E-Mail als Admin ein. Mit Admin-Rolle sieht sie den
// privaten Bereich (PrivateBuild) und darf an Charakteren, Training und
// Inhalten mitarbeiten — alle entsprechenden Entitäten sind Admin-RLS.

export default function PartnerInvite() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const invite = async () => {
    const addr = email.trim();
    if (!addr || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) {
      toast({ variant: "destructive", title: "E-Mail fehlt", description: "Gib eine gültige E-Mail-Adresse ein." });
      return;
    }
    setBusy(true);
    try {
      await base44.users.inviteUser(addr, "admin");
      toast({ title: "Einladung verschickt", description: `${addr} bekommt eine Mail. Nach der Anmeldung hat sie vollen Admin-Zugang zum privaten Bereich.` });
      setEmail("");
      setOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Einladung fehlgeschlagen", description: e?.message || "Versuche es später erneut." });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full bg-elevated px-3 py-1.5 text-muted-foreground hover:text-foreground">
        <UserPlus className="h-3.5 w-3.5" /> Partnerin einladen
      </button>
    );
  }

  return (
    <div className="absolute right-4 top-14 z-30 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm text-foreground flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-primary" /> Partnerin als Admin einladen
        </h3>
        <button onClick={() => setOpen(false)} className="rounded-full bg-elevated p-1 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Sie bekommt eine Einladungs-Mail. Nach der Anmeldung sieht sie den privaten Bereich und arbeitet mit dir an Charakteren, Training und Inhalten.
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ihre@email.de"
        className="mt-3 w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground"
      />
      <button
        onClick={invite}
        disabled={busy}
        className="glass-btn glass-btn-accent mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Als Admin einladen
      </button>
    </div>
  );
}