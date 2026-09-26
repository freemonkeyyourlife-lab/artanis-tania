import React, { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";

export default function CallLink({ url, onNewLink }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* clipboard blocked */ }
  };

  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 max-w-full">
      <span className="text-sm text-foreground truncate flex-1">{url}</span>
      <button onClick={copy} className="text-primary flex-shrink-0" title="Link kopieren">
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
      {onNewLink && (
        <button onClick={onNewLink} className="text-muted-foreground hover:text-foreground flex-shrink-0" title="Neuen Link erstellen">
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}