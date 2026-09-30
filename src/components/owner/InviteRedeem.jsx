import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { KeyRound } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { grantLocalPro } from "@/lib/proAccess";

// Für den Gast: hat er einen Code vorgelesen bekommen, tippt er ihn hier ein.
export default function InviteRedeem() {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const redeem = async () => {
    const value = code.trim().toUpperCase();
    if (!value) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("claimInvite", { code: value });
      if (res.data?.error) throw new Error(res.data.error);
      if (res.data?.status) grantLocalPro(res.data.status);
      toast({ title: "Eingelöst", description: "Deine Einladung ist aktiv — viel Spaß." });
      setCode("");
    } catch (e) {
      toast({ title: "Code hat nicht gepasst", description: "Tipp ihn nochmal ein — oder frag nach einem neuen.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-display text-xl text-foreground mb-1 flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-primary" /> Einladungscode
      </h2>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4">
        Hast du einen Code bekommen? Tipp ihn hier ein — dann ist dein Zugang sofort frei.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && redeem()}
          placeholder="z. B. K7M-2QP"
          className="flex-1 min-w-[200px] px-4 py-3 rounded-xl bg-elevated border border-border text-[15px] font-bold tracking-[0.15em] text-foreground placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <button
          onClick={redeem}
          disabled={busy || !code.trim()}
          className="px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
        >
          {busy ? "Prüfe …" : "Einlösen"}
        </button>
      </div>
    </div>
  );
}