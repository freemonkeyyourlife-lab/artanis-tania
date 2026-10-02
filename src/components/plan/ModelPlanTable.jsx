import React from "react";

// Eine Tabelle, die auf dem Handy nicht seitlich wegrutscht: am Rechner eine
// echte Tabelle, auf dem Handy eine Karte je Zeile mit Beschriftungen.
export default function ModelPlanTable({ columns, rows }) {
  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-2 border-b-2 border-border"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="align-top">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="px-3 py-3 text-[13px] font-semibold text-foreground/90 border-b border-border leading-relaxed"
                  >
                    {r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-xl bg-elevated border-2 border-border p-4">
            <p className="text-[15px] font-bold text-foreground mb-2 leading-snug">{r[columns[0].key]}</p>
            {columns.slice(1).map((c) => (
              <p key={c.key} className="text-[13px] font-semibold text-foreground/90 leading-relaxed mb-1.5">
                <span className="text-muted-foreground">{c.label}: </span>
                {r[c.key]}
              </p>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}