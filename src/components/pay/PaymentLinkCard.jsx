import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Copy, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function PaymentLinkCard({ link, own, onChanged }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const url = `${window.location.origin}/pay/${link.token}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link kopiert", description: "Kannst du direkt verschicken." });
    } catch (e) {
      toast({ title: "Kopieren ging nicht", description: "Markier den Link und kopier ihn von Hand.", variant: "destructive" });
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke("paymentLink", { action: "cancel", id: link.id });
      onChanged?.();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
              {link.amount.toFixed(2).replace(".", ",")} €
            </span>
            <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">
              {link.kind === "TASK" ? "Aufgabe" : "Link"}
            </span>
            {link.status === "PAID" && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-600/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> bezahlt
              </span>
            )}
            {link.status === "CANCELLED" && (
              <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">zurückgezogen</span>
            )}
          </div>
          <p className="text-[15px] text-foreground leading-snug">{link.title}</p>
          {link.description && <p className="text-xs text-muted-foreground mt-1">{link.description}</p>}
          <p className="text-[11px] text-muted-foreground mt-2">
            {own ? `von dir` : `von ${link.creatorName || "Unbekannt"}`}
            {link.targetName ? ` · für ${link.targetName}` : ""}
            {link.paidByName ? ` · bezahlt von ${link.paidByName}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {link.status === "OPEN" && (
          <>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Kopiert" : "Link kopieren"}
            </button>
            <Link
              to={`/pay/${link.token}`}
              className={cn(
                "px-3.5 py-2 rounded-full text-xs font-semibold",
                own ? "bg-elevated text-muted-foreground" : "bg-elevated border border-primary/40 text-primary"
              )}
            >
              {own ? "Ansehen" : "Jetzt bezahlen"}
            </Link>
            {own && (
              <button
                onClick={cancel}
                disabled={busy}
                className="px-3.5 py-2 rounded-full bg-elevated text-muted-foreground text-xs hover:text-foreground disabled:opacity-50"
              >
                Zurückziehen
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}