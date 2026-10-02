import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { euro } from "@/lib/sales";

// Der Monatsverlauf: was in welchem Monat wirklich eingegangen ist.
export default function SalesChart({ months }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-xl text-foreground mb-1">Umsatz im Verlauf</h2>
      <p className="text-xs text-muted-foreground mb-5">Bezahlte Links, nach Monat zusammengezählt.</p>

      {months.length === 0 ? (
        <p className="text-sm text-muted-foreground py-14 text-center">
          Noch nichts bezahlt — sobald der erste Link beglichen ist, steht der Verlauf hier.
        </p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={64}
                tickFormatter={(v) => euro(v)}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--elevated))" }}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  color: "hsl(var(--popover-foreground))",
                  fontSize: 12,
                }}
                formatter={(value) => [euro(value), "Umsatz"]}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} maxBarSize={54} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}