import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

// Die Bilder eines Charakters — alles, was im Charakter-Bereich hochgeladen
// wurde, landet automatisch hier.
export default function CharacterGallery({ creatorId }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => { load(); }, [creatorId]);

  const load = async () => {
    if (!creatorId) return;
    try {
      const query = { creatorId, published: true, contentType: "PHOTO" };
      const [page, count] = await Promise.all([
        base44.entities.Content.filter(query, { sort: "-created_date", limit: 24 }),
        base44.entities.Content.count(query),
      ]);
      setItems(page.items || []);
      setTotal(count || 0);
    } catch (e) {
      console.error(e);
    }
  };

  if (!items.length) return null;

  return (
    <div className="mt-8">
      <p className="font-display text-xl text-foreground mb-1">Galerie</p>
      <p className="text-xs text-muted-foreground mb-4">{total} Bilder</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((c) => (
          <a
            key={c.id}
            href={c.fullAsset || c.thumbnail}
            target="_blank"
            rel="noreferrer"
            className="block aspect-[3/4] rounded-2xl overflow-hidden border border-border bg-elevated"
          >
            <Image src={c.thumbnail || c.fullAsset} fittingType="fill" className="w-full h-full" />
          </a>
        ))}
      </div>
    </div>
  );
}