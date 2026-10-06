import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { intervalLabel, isRecurring } from "@/lib/billing";

export default function Pay() {
  const { token } = useParams();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const load = async () => {
    try {
      const res = await base44.functions.invoke("paymentLink", { action: "get", token });
      if (res.data?.error) throw new Error(res.data.error);
      setLink(res.data.link);
    } catch (e) {
      setError("Dieser Zahlungslink ist nicht mehr gültig.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast({ title: "Zahlung durch", description: "Danke — der Betrag ist eingegangen." });
    }
    load();
  }, [token]);

  const pay = async () => {
    // Im Vorschau-Rahmen muss das Fenster noch im Klick selbst aufgehen —
    // sonst blockt der Browser die Zahlung weg.
    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed ? window.open("", "_blank") : null;
    if (isFramed && !checkoutTab) {
      toast({
        title: "Popups erlauben",
        description: "Erlaub kurz Popups, damit die Zahlung aufgeht.",
        variant: "destructive",
      });
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;

    setPaying(true);
    try {
      const res = await base44.functions.invoke("paymentLink", { action: "checkout", token });
      const url = res.data?.url;
      if (!url) throw new Error(res.data?.error || "Kein Checkout-Link");
      if (checkoutTab) checkoutTab.location.replace(url);
      else window.location.assign(url);
    } catch (e) {
      checkoutTab?.close();
      console.error(e);
      toast({ title: "Zahlung nicht gestartet", description: "Versuch es nochmal.", variant: "destructive" });
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="rounded-3xl border border-border bg-card p-6 lg:p-8 text-center">
        {error || !link ? (
          <>
            <p className="font-display text-xl text-foreground mb-2">Link ungültig</p>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Link to="/" className="text-primary text-sm">Zur Startseite</Link>
          </>
        ) : link.status === "PAID" ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="font-display text-xl text-foreground mb-1">Schon bezahlt</p>
            <p className="text-sm text-muted-foreground">
              {link.paidByName ? `${link.paidByName} hat das schon beglichen.` : "Dieser Betrag ist schon eingegangen."}
            </p>
          </>
        ) : link.status === "CANCELLED" ? (
          <>
            <p className="font-display text-xl text-foreground mb-2">Zurückgezogen</p>
            <p className="text-sm text-muted-foreground">Dieser Link ist nicht mehr aktiv.</p>
          </>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-3">
              {link.kind === "TASK" ? "Aufgabe" : isRecurring(link) ? "Abo abschließen" : "Zahlung angefordert"}
            </p>
            <p className="font-display text-5xl text-gradient-warm mb-2">
              {Number(link.amount).toFixed(2).replace(".", ",")} €
            </p>
            {isRecurring(link) && (
              <p className="text-sm text-muted-foreground mb-1">
                {intervalLabel(link.interval)} — läuft, bis du kündigst
              </p>
            )}
            <p className="text-[15px] text-foreground mb-1">{link.title}</p>
            {link.description && <p className="text-sm text-muted-foreground mb-1">{link.description}</p>}
            <p className="text-xs text-muted-foreground mb-6">
              von {link.creatorName || "ARTANIS × TANIA"}
              {link.targetName ? ` · für ${link.targetName}` : ""}
            </p>

            <button
              onClick={pay}
              disabled={paying}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {paying ? "Weiterleitung …" : isRecurring(link) ? "Abo abschließen" : "Jetzt bezahlen"}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mt-4">
              <ShieldCheck className="w-3.5 h-3.5" /> Sichere Kartenzahlung über Stripe
            </p>
          </>
        )}
      </div>
    </div>
  );
}