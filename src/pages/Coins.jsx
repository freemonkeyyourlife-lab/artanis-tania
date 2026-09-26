import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Coins as CoinsIcon, Gift, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Coins() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast({ title: "Coins gutgeschrieben", description: "Deine Coins sind in der Börse angekommen." });
      window.history.replaceState({}, "", window.location.pathname);
    }
    load();
  }, []);

  const load = async () => {
    try {
      const res = await base44.functions.invoke("coinWallet", { action: "get" });
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const claimDaily = async () => {
    setBusy("daily");
    try {
      const res = await base44.functions.invoke("coinWallet", { action: "daily" });
      toast({ title: `+${res.data.credited} Coins`, description: "Tagesbonus gesammelt." });
      await load();
    } catch (e) {
      toast({ title: "Heute schon geholt", description: "Der Tagesbonus ist alle 24 Stunden verfügbar.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const buy = async (pkg) => {
    if (window.self !== window.top) {
      toast({ title: "Kauf nur in der App", description: "Öffne die App in einem eigenen Tab, um Coins zu kaufen.", variant: "destructive" });
      return;
    }
    setBusy(pkg.id);
    try {
      const res = await base44.functions.invoke("coinWallet", { action: "purchase", packageId: pkg.id });
      const url = res.data?.url;
      if (!url) throw new Error(res.data?.error || "Kein Checkout-Link");
      window.location.href = url;
    } catch (e) {
      toast({ title: "Fehler", description: "Der Kauf konnte nicht gestartet werden.", variant: "destructive" });
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const balance = data?.balance || 0;
  const value = data?.coinValueInCurrency || 0.1;

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-1">Börse</h1>
      <p className="text-sm text-muted-foreground mb-6">Coins sammeln, aufladen und im Chat für Freischaltungen ausgeben.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Dein Guthaben</p>
          <div className="flex items-end gap-3">
            <span className="font-display text-5xl text-gradient-warm">{balance}</span>
            <span className="text-muted-foreground mb-2">Coins</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Gegenwert ca. {(balance * value).toFixed(2).replace(".", ",")} € · 1 Coin = {value.toFixed(2).replace(".", ",")} €
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
          <Gift className="w-6 h-6 text-primary mb-3" />
          <p className="font-display text-lg text-foreground mb-1">Tagesbonus</p>
          <p className="text-xs text-muted-foreground mb-4 flex-1">
            Einmal alle 24 Stunden {data?.dailyBonus ?? 50} Coins gratis.
          </p>
          <button
            onClick={claimDaily}
            disabled={busy === "daily" || !data?.dailyAvailable}
            className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
          >
            {busy === "daily" ? "…" : data?.dailyAvailable ? `+${data?.dailyBonus ?? 50} Coins holen` : "Heute schon geholt"}
          </button>
        </div>
      </div>

      <h2 className="font-display text-xl text-foreground mb-3">Coins aufladen</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {(data?.packages || []).map((pkg) => (
          <div key={pkg.id} className={cn("rounded-2xl border bg-card p-5 flex flex-col", pkg.tag ? "border-primary/60" : "border-border")}>
            {pkg.tag && (
              <span className="self-start px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider mb-2">
                {pkg.tag}
              </span>
            )}
            <div className="flex items-center gap-2 mb-1">
              <CoinsIcon className="w-5 h-5 text-primary" />
              <span className="font-display text-2xl text-foreground">{pkg.coins}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4 flex-1">
              {(pkg.price / pkg.coins).toFixed(3).replace(".", ",")} € pro Coin
            </p>
            <button
              onClick={() => buy(pkg)}
              disabled={busy === pkg.id}
              className="w-full py-2.5 rounded-full bg-elevated border border-border text-sm font-medium text-foreground hover:border-primary transition-colors disabled:opacity-50"
            >
              {busy === pkg.id ? "…" : `${pkg.price.toFixed(2).replace(".", ",")} €`}
            </button>
          </div>
        ))}
      </div>

      <h2 className="font-display text-xl text-foreground mb-3">Verlauf</h2>
      {!data?.entries?.length ? (
        <p className="text-sm text-muted-foreground">Noch keine Bewegungen.</p>
      ) : (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {data.entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", entry.direction === "CREDIT" ? "bg-emerald-600/20 text-emerald-400" : "bg-primary/15 text-primary")}>
                {entry.direction === "CREDIT" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{entry.description || entry.sourceType}</p>
                <p className="text-[11px] text-muted-foreground">
                  {entry.created_date ? format(new Date(entry.created_date), "dd.MM.yyyy HH:mm") : ""}
                </p>
              </div>
              <span className={cn("text-sm font-semibold flex-shrink-0", entry.direction === "CREDIT" ? "text-emerald-400" : "text-primary")}>
                {entry.direction === "CREDIT" ? "+" : "−"}{entry.amountCoins}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}