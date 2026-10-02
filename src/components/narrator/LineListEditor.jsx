import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { inputCls, labelCls, btnCls } from "@/lib/narratorUi";

// Eine Liste von Sätzen: jeder Satz eine Zeile, die sie so sagen kann.
export default function LineListEditor({ label, hint, lines = [], onChange, placeholder }) {
  const change = (i, value) => onChange(lines.map((l, idx) => (idx === i ? value : l)));
  const remove = (i) => onChange(lines.filter((_, idx) => idx !== i));
  const add = () => onChange([...lines, ""]);

  return (
    <div className="mt-3">
      <label className={labelCls}>
        {label} <span className="font-semibold normal-case tracking-normal opacity-70">{hint}</span>
      </label>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={line}
              onChange={(e) => change(i, e.target.value)}
              placeholder={placeholder}
              className={inputCls}
            />
            <button
              onClick={() => remove(i)}
              title="Zeile weg"
              className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add} className={`${btnCls} mt-2`}>
        <Plus className="w-3.5 h-3.5" /> Zeile dazu
      </button>
    </div>
  );
}