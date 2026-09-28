import React, { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { base44 } from "@/api/base44Client";
import { Loader2, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import GalleryGrid from "@/components/studio/GalleryGrid";
import { collectImages, groupByCreator } from "@/lib/gallery";

// Alle im Chat erzeugten Bilder eines Charakters auf einen Blick.
export default function GalleryManager({ creators = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("ALL");
  const [active, setActive] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [convs, msgs] = await Promise.all([
        base44.entities.Conversation.list("-created_date", 500),
        base44.entities.Message.list("-created_date", 1000),
      ]);
      setItems(collectImages(convs, msgs, creators));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const groups = useMemo(() => groupByCreator(items), [items]);
  const visible = selected === "ALL" ? items : items.filter((i) => i.creatorId === selected);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-xl text-foreground mb-1">Galerie</h2>
      <p className="text-xs text-muted-foreground mb-5">
        {items.length} {items.length === 1 ? "Bild" : "Bilder"} aus allen Chats — Charakter wählen, Bild anklicken zum Vergrößern.
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Images className="w-6 h-6" />
          <p className="text-sm">Noch keine Bilder erzeugt.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setSelected("ALL")}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-colors",
                selected === "ALL" ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground"
              )}
            >
              Alle ({items.length})
            </button>
            {groups.map((g) => (
              <button
                key={g.id || "none"}
                onClick={() => setSelected(g.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold transition-colors",
                  selected === g.id ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground"
                )}
              >
                {g.name} ({g.count})
              </button>
            ))}
          </div>

          <GalleryGrid items={visible} onOpen={setActive} />
        </>
      )}

      {active && (
        <div
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl">
            <Image src={active.url} fittingType="fit" className="w-full max-h-[72vh] rounded-2xl" />
            <div className="flex items-center gap-3 mt-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">
                  {active.creatorName}{active.userName ? ` · mit ${active.userName}` : ""}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {moment(active.createdAt).format("DD.MM.YYYY, HH:mm")}{active.label ? ` · ${active.label}` : ""}
                </p>
              </div>
              <a
                href={active.url}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-2 rounded-full bg-elevated border border-border text-xs font-medium text-foreground"
              >
                Herunterladen
              </a>
              <button
                onClick={() => setActive(null)}
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}