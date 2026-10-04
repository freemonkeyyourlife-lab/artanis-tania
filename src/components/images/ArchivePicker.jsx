import React, { useEffect, useState } from "react";
import { Image } from "@/components/ui/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadArchive } from "@/lib/imageArchive";

// Alles, was je hochgeladen wurde, ist hier — und bleibt hier. Ein Klick holt
// das Bild zurück in die Idee, an den Charakter oder in den Bausatz.
export default function ArchivePicker({ kind, onPick, selected = [], className }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    loadArchive(kind)
      .then((list) => { if (alive) setItems(list); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, [kind]);

  if (!items) {
    return (
      <p className="text-[12px] font-semibold text-muted-foreground flex items-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Archiv wird geladen …
      </p>
    );
  }

  if (!items.length) {
    return (
      <p className="text-[12px] font-semibold text-muted-foreground">
        Das Archiv ist noch leer. Was du hochlädst, liegt hier von da an für immer.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2 max-h-56 overflow-y-auto", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onPick(item.url)}
          title={item.name}
          className={cn(
            "relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors",
            selected.includes(item.url) ? "border-primary" : "border-border hover:border-primary/50"
          )}
        >
          <Image src={item.url} fittingType="fill" className="w-full h-full" />
        </button>
      ))}
    </div>
  );
}