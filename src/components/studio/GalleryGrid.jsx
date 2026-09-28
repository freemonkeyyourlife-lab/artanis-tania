import React from "react";
import moment from "moment";
import { Lock } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function GalleryGrid({ items, onOpen }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((img) => (
        <button
          key={img.url}
          onClick={() => onOpen(img)}
          className="group relative aspect-square rounded-xl overflow-hidden bg-elevated border border-border"
        >
          <Image
            src={img.url}
            fittingType="fill"
            className="w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
          {img.locked && (
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/85 text-[10px] text-foreground">
              <Lock className="w-3 h-3" /> {img.price ? `${img.price} €` : "gesperrt"}
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent px-2 pt-6 pb-2 text-left">
            <span className="block text-[11px] font-medium text-foreground truncate">{img.creatorName}</span>
            <span className="block text-[10px] text-muted-foreground truncate">
              {moment(img.createdAt).format("DD.MM.YY HH:mm")}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}