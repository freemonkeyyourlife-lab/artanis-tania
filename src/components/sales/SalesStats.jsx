import React from "react";
import { TrendingUp, Clock, CheckCircle2, Repeat } from "lucide-react";
import { euro } from "@/lib/sales";

// Vier Kennzahlen oben — Umsatz, Offenes, Bezahltes und laufende Abos.
export default function SalesStats({ totals }) {
  const cards = [
    {
      label: "Umsatz bezahlt",
      value: euro(totals.revenue),
      hint: `${totals.paidCount} ${totals.paidCount === 1 ? "Zahlung" : "Zahlungen"}`,
      icon: TrendingUp,
      accent: true,
    },
    {
      label: "Noch offen",
      value: euro(totals.openAmount),
      hint: `${totals.openCount} ${totals.openCount === 1 ? "Link" : "Links"}`,
      icon: Clock,
    },
    {
      label: "Einmalig bezahlt",
      value: euro(totals.oneTimeAmount),
      hint: `${totals.oneTimeCount} ${totals.oneTimeCount === 1 ? "Vorgang" : "Vorgänge"}`,
      icon: CheckCircle2,
    },
    {
      label: "Abos",
      value: euro(totals.recurringAmount),
      hint: `${totals.recurringCount} laufend`,
      icon: Repeat,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={
              c.accent
                ? "rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5 accent-glow"
                : "rounded-2xl border border-border bg-card p-5"
            }
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
            </div>
            <p className="font-display text-3xl text-foreground text-gloss">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.hint}</p>
          </div>
        );
      })}
    </div>
  );
}