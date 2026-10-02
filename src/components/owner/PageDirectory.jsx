import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { buildNavGroups } from "@/components/nav/HeaderNav";
import { MODULE_TYPES } from "@/lib/modules";

// Was ist wo: jede Seite der App mit ihrer Aufgabe — nach Bereich sortiert.
export default function PageDirectory({ items = [] }) {
  const groups = buildNavGroups(items.filter((i) => i && i.path && !i.hidden));
  const areaOf = new Map();
  groups.forEach((g) => g.items.forEach((it) => areaOf.set(it.path, g.label)));

  const rows = MODULE_TYPES.map((m) => ({ ...m, area: areaOf.get(m.path) || null }));
  const areas = groups.map((g) => g.label).filter((label) => rows.some((r) => r.area === label));
  const loose = rows.filter((r) => !r.area);

  const Section = ({ label, hint, list }) => (
    <div className="mb-5 last:mb-0">
      <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-[13px] font-semibold text-muted-foreground mb-3">{hint}</p>
      <div className="space-y-2">
        {list.map((r) => (
          <Link
            key={r.path}
            to={r.path}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-border bg-elevated px-3 py-2.5 hover:border-primary/50 transition-colors"
          >
            <span className="inline-flex items-center gap-1.5 text-[14px] font-bold text-foreground">
              {r.label} <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </span>
            <span className="text-[12px] font-mono font-semibold text-muted-foreground">{r.path}</span>
            <span className="text-[13px] font-semibold text-muted-foreground basis-full">{r.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <p className="font-display text-xl text-foreground mb-1">Was ist wo</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-3xl">
        Jede Seite, die es in der App gibt — mit dem, was man dort tut. Ein Klick öffnet sie. Steht eine Seite unter
        „Noch nicht in der Leiste“, erreicht man sie nur, wenn du sie unten einbindest.
      </p>

      {areas.map((label) => (
        <Section
          key={label}
          label={label}
          hint="Über diese Schaltfläche in der Kopfzeile erreichbar."
          list={rows.filter((r) => r.area === label)}
        />
      ))}

      {loose.length > 0 && (
        <Section
          label="Noch nicht in der Leiste"
          hint="Diese Seiten gibt es, aber kein Knopf führt hin — unten bindest du sie ein."
          list={loose}
        />
      )}
    </div>
  );
}