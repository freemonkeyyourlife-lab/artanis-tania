import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link as LinkIcon, Loader2, Image as ImageIcon } from "lucide-react";

// Link einfügen → die Seite wird gelesen (linkHarvest) und alle gefundenen
// Bilder/Videos als Trainings-Quellen vorgemerkt. Direkt-Adressen (Bild/Video)
// kommen sofort. Übernommen wird in den Pool — Auto-Sortieren oder manuelle
// Zuordnung übernimmt den Rest.
export default function LinkGrabber({ onLinks }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const fetchLinks = async () => {
    const u = (url || "").trim();
    if (!u) return;
    setBusy(true);
    setError("");
    setItems([]);
    try {
      const res = await base44.functions.invoke("linkHarvest", { url: u, deep: false });
      const data = res?.data ?? res;
      const found = (data?.items || []).filter((it) => it.kind === "BILD" || it.kind === "VIDEO");
      setItems(found);
      if (!found.length) setError("Keine Bilder oder Videos auf dieser Seite gefunden.");
    } catch (e) {
      setError(e?.message || "Seite nicht lesbar — mancher Anbieter blockt den Zugriff.");
    } finally {
      setBusy(false);
    }
  };

  const addAll = () => {
    if (!items.length) return;
    onLinks?.(
      items.map((it) => ({
        url: it.url,
        type: it.kind === "VIDEO" ? "VIDEO" : "IMAGE",
        name: it.label || it.url,
      }))
    );
    setItems([]);
    setUrl("");
  };

  return (
    <div className="glass-btn rounded-2xl border-2 border-dashed border-border px-6 py-5">
      <div className="flex items-center gap-2">
        <LinkIcon className="h-4 w-4 flex-shrink-0 text-primary" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") fetchLinks(); }}
          placeholder="Link zu Galerie, Seite oder Video"
          className="flex-1 rounded-lg bg-background px-3 py-2 text-sm text-foreground"
        />
        <button
          onClick={fetchLinks}
          disabled={busy || !url.trim()}
          className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
          Lesen
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {items.length > 0 && (
        <>
          <div className="mt-3 grid max-h-40 grid-cols-4 gap-2 overflow-y-auto scrollbar-hide sm:grid-cols-6">
            {items.slice(0, 24).map((it) => (
              <div key={it.url} className="relative h-16 overflow-hidden rounded-lg bg-background">
                {it.kind === "BILD" ? (
                  <img src={it.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">{it.kind}</span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addAll}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <ImageIcon className="h-3.5 w-3.5" /> {items.length} als Quellen übernehmen
          </button>
        </>
      )}
    </div>
  );
}