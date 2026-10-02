import React from "react";
import { Radio, ExternalLink } from "lucide-react";

// Großer, gut sichtbarer Weg zum eigenen Stripchat-Stream.
export default function StreamLinkCard({ url, name }) {
  if (!url) return null;
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-6 flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:p-5 hover:bg-primary/15 transition-colors"
    >
      <div className="w-12 h-12 rounded-full bg-badge-live/20 flex items-center justify-center shrink-0">
        <Radio className="w-6 h-6 text-badge-live animate-pulse" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-primary">Live auf Stripchat</p>
        <p className="font-display text-lg text-foreground truncate">Zum Stream von {name}</p>
        <p className="text-xs text-muted-foreground truncate">{href.replace(/^https?:\/\//i, "")}</p>
      </div>
      <span className="glass-btn glass-btn-accent inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold shrink-0">
        Jetzt ansehen <ExternalLink className="w-4 h-4" />
      </span>
    </a>
  );
}