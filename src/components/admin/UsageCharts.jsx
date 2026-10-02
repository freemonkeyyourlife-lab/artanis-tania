import React from "react";
import moment from "moment";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";

const money = (v) => `${(Number(v) || 0).toFixed(4)} $`;
const count = (v) => (Number(v) || 0).toLocaleString("de-DE");
const shortName = (id) => String(id || "").split("/").pop().replace(":free", "");

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
};

const axis = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

// Zwei Bilder auf einen Blick: welches Modell am häufigsten läuft — und wie
// sich die Kosten über die Tage aufbauen.
export default function UsageCharts({ rows, timeline, loading }) {
  const top = (rows || []).slice(0, 8).map((r) => ({
    name: shortName(r.modelId),
    calls: r.count || 0,
  }));

  // Die teuersten Modelle zuerst — hier siehst du, wohin das Guthaben geht.
  const byCost = [...(rows || [])]
    .sort((a, b) => (Number(b.sum_costUsd) || 0) - (Number(a.sum_costUsd) || 0))
    .slice(0, 8)
    .map((r) => ({ name: shortName(r.modelId), cost: Number(r.sum_costUsd) || 0 }));

  const days = [...(timeline || [])]
    .sort((a, b) => String(a.created_date).localeCompare(String(b.created_date)))
    .map((r) => ({
      label: moment(r.created_date).format("DD.MM."),
      cost: Number(r.sum_costUsd) || 0,
    }));

  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-elevated h-72 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-border bg-elevated p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Am häufigsten abgerufen
        </p>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">
            In diesem Zeitraum lief noch keine Abfrage über OpenRouter.
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={axis} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={132} tick={axis} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--background))" }}
                  contentStyle={tooltipStyle}
                  formatter={(value) => [count(value), "Abfragen"]}
                />
                <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-elevated p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Kosten im Verlauf
        </p>
        {days.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">Noch keine Kosten angefallen.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                <YAxis
                  tick={axis}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                  tickFormatter={(v) => `${Number(v).toFixed(3)} $`}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [money(value), "Kosten"]} />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#costFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-elevated p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Kosten je Modell
        </p>
        {byCost.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">Noch keine Kosten angefallen.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCost} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={axis}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Number(v).toFixed(3)} $`}
                />
                <YAxis type="category" dataKey="name" width={132} tick={axis} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--background))" }}
                  contentStyle={tooltipStyle}
                  formatter={(value) => [money(value), "Kosten"]}
                />
                <Bar dataKey="cost" fill="hsl(var(--secondary))" radius={[0, 8, 8, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}