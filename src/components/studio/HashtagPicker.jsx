import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { cleanTag, loadHashtags, tagLabel } from "@/lib/hashtags";

// Hashtags setzen: die Worte stammen aus der festen Liste, damit sie überall
// dasselbe heißen. Was gewählt ist, steht mit seiner Bedeutung darunter.
export default function HashtagPicker({ value = [], onChange, label = "Hashtags", options }) {
  const [loaded, setLoaded] = useState([]);
  const all = options || loaded;

  useEffect(() => {
    if (options) return;
    loadHashtags().then(setLoaded).catch(() => {});
  }, [options]);

  const isOn = (name) => value.some((v) => cleanTag(v) === cleanTag(name));

  const toggle = (name) => {
    const id = cleanTag(name);
    onChange(isOn(name) ? value.filter((v) => cleanTag(v) !== id) : [...value, id]);
  };

  const chosen = all.filter((h) => isOn(h.name));

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5 block">{label}</p>

      {!all.length ? (
        <p className="text-xs text-muted-foreground">
          Noch keine Hashtags festgelegt — die Liste füllst du in der Akademie auf der Prompt-Seite.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {all.map((h) => (
              <button
                key={h.id}
                type="button"
                title={h.meaning}
                onClick={() => toggle(h.name)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors",
                  isOn(h.name)
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {tagLabel(h.name)}
              </button>
            ))}
          </div>

          {chosen.length > 0 && (
            <div className="mt-2 space-y-1">
              {chosen.map((h) => (
                <p key={h.id} className="text-[11px] font-semibold text-muted-foreground">
                  <span className="text-foreground">{tagLabel(h.name)}</span> — {h.meaning}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}