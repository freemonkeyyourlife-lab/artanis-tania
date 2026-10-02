import React from "react";
import { Users } from "lucide-react";
import { euro } from "@/lib/sales";

// Wer am meisten bezahlt hat — die Kunden stehen oben.
export default function SalesCustomers({ customers }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-xl text-foreground mb-1">Top-Kunden</h2>
      <p className="text-xs text-muted-foreground mb-5">Nach Summe der bezahlten Links.</p>

      {customers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground">
          <Users className="w-6 h-6" />
          <p className="text-sm">Noch keine bezahlten Links.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((c, i) => (
            <div key={c.name} className="flex items-center gap-3 p-3 rounded-xl bg-elevated">
              <span className="w-7 h-7 rounded-full bg-background flex items-center justify-center font-display text-sm text-primary flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {c.count} {c.count === 1 ? "Zahlung" : "Zahlungen"}
                </p>
              </div>
              <span className="text-sm font-semibold text-primary">{euro(c.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}