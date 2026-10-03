import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X } from "lucide-react";
import { chipCls, inputCls } from "@/lib/narratorUi";

// Die Menschen, die zu einer Idee gehören: aus deinen Figuren ausgewählt oder
// einfach dazugeschrieben. Nichts ist vorgegeben.
export default function PeoplePicker({ value = [], onChange }) {
  const [chars, setChars] = useState([]);
  const [own, setOwn] = useState("");

  useEffect(() => {
    base44.entities.Character.list("name")
      .then((res) => setChars(Array.isArray(res) ? res : res?.items || []))
      .catch(() => setChars([]));
  }, []);

  const has = (name) => value.some((p) => p.name === name);

  const toggle = (c) =>
    onChange(has(c.name) ? value.filter((p) => p.name !== c.name) : [...value, { id: c.id, name: c.name }]);

  const addOwn = () => {
    const name = own.trim();
    setOwn("");
    if (!name || has(name)) return;
    onChange([...value, { id: "", name }]);
  };

  return (
    <div className="space-y-2">
      {chars.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chars.map((c) => (
            <button key={c.id} type="button" onClick={() => toggle(c)} className={chipCls(has(c.name))}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((p) => (
            <span
              key={p.name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border text-[12px] font-bold text-foreground"
            >
              {p.name}
              <button type="button" onClick={() => onChange(value.filter((x) => x.name !== p.name))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={own}
          onChange={(e) => setOwn(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOwn();
            }
          }}
          placeholder="Namen dazuschreiben …"
          className={inputCls}
        />
        <button
          type="button"
          onClick={addOwn}
          className="inline-flex items-center gap-1.5 px-4 rounded-xl glass-btn text-[13px] font-bold text-foreground whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" /> Dazu
        </button>
      </div>
    </div>
  );
}