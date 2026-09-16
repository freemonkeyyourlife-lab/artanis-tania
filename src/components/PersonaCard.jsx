import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import StatusBadge from "./StatusBadge";
import { cn } from "@/lib/utils";

export default function PersonaCard({ creator, className }) {
  const link = creator.personaType === "COUPLE" ? "/couple" : `/${creator.stageName.toLowerCase().replace(/\s+/g, "")}`;
  return (
    <Link to={link} className={cn("group block", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-[3/4] relative">
          <Image src={creator.banner || creator.avatar} fittingType="fill" className="w-full h-full transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute top-3 left-3">
            <StatusBadge status={creator.onlineStatus} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-xl text-foreground">{creator.stageName}</h3>
            <p className="text-sm text-muted-foreground mt-1">{creator.tagline || `${creator.age} y/o`}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}