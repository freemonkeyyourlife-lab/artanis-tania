import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Repeat } from "lucide-react";
import { euro, paidAtLabel } from "@/lib/sales";
import { isRecurring } from "@/lib/billing";

// Die letzten Zahlungen — mit einem Klick auf den Link selbst.
export default function SalesList({ payments }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-xl text-foreground mb-1">Letzte Zahlungen</h2>
      <p className="text-xs text-muted-foreground mb-5">Die jüngsten bezahlten Links.</p>

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Noch nichts eingegangen. Leg in der Kasse einen Link an und verschick ihn.
        </p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <Link
              key={p.id}
              to={`/pay/${p.token}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-elevated hover:bg-popover transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{p.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {p.targetName ? `für ${p.targetName} · ` : ""}
                  {p.paidByName ? `bezahlt von ${p.paidByName} · ` : ""}
                  {paidAtLabel(p.paidAt)}
                </p>
              </div>
              {isRecurring(p) && <Repeat className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
              <span className="text-sm font-semibold text-foreground flex-shrink-0">{euro(p.amount)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}