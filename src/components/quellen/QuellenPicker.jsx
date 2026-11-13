import React, { useState, useEffect, useRef } from "react";
import { Search, Upload, Loader2, Link2, Library, Globe, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";

// Eine Quelle wählen — aus deiner Bibliothek (gespeicherte Charaktere und
// Archiv-Bilder) oder aus dem Internet (Link einfügen oder Datei hochladen).
// Überall gleich: derselbe Picker für Bild-, Charakter- und Vorlagen-Referenzen,
// in jedem Chat oder jeder Situation.
//
// Auswahlform: { url, name, source: "BIBLIOTHEK" | "INTERNET" }
// url ist bei Bibliothek ein gespeichertes Bild, bei Internet ein Link oder
// Upload (stored publicly — anyone with the link can open them).

export default function QuellenPicker({ value, onChange, placeholder = "Quelle wählen …", className }) {
  const [tab, setTab] = useState(value?.source === "INTERNET" ? "INTERNET" : "BIBLIOTHEK");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [urlInput, setUrlInput] = useState(value?.source === "INTERNET" ? value?.url || "" : "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [chars, quellen] = await Promise.all([
          base44.entities.Character.list("-created_date", 200).catch(() => []),
          base44.entities.Quelle.list("-created_date", 200).catch(() => []),
        ]);
        const out = [];
        (chars || []).forEach((c) => {
          if (c.avatar) out.push({ url: c.avatar, name: c.name, group: "Charakter" });
          (c.images || []).forEach((u) => { if (u) out.push({ url: u, name: c.name, group: "Charakter" }); });
        });
        (quellen || []).filter((q) => !q.kind || q.kind === "BILD").forEach((q) => {
          const url = q.url || q.fileUri;
          if (url) out.push({ url, name: q.name, group: "Archiv" });
        });
        setItems(out);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = items.filter((x) => (x.name || "").toLowerCase().includes(query.trim().toLowerCase()));

  const pickLib = (x) => onChange?.({ url: x.url, name: x.name, source: "BIBLIOTHEK" });

  const applyUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    onChange?.({ url: u, name: "Internet-Link", source: "INTERNET" });
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const up = await base44.integrations.Core.UploadPublicFile({ file: f });
      if (up?.file_url) {
        setUrlInput(up.file_url);
        onChange?.({ url: up.file_url, name: f.name || "Upload", source: "INTERNET" });
      }
    } catch {
      toast({ variant: "destructive", title: "Upload fehlgeschlagen" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)}>
      <div className="flex border-b border-border">
        {[
          { k: "BIBLIOTHEK", label: "Bibliothek", Icon: Library },
          { k: "INTERNET", label: "Internet", Icon: Globe },
        ].map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k)}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold transition-colors",
              tab === t.k ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.Icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {value?.url && (
        <div className="relative">
          <Image src={value.url} className="w-full max-h-40" fittingType="fit" />
          <button
            type="button"
            onClick={() => onChange?.(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center"
            title="Entfernen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-background/80 text-[10px] text-muted-foreground">
            {value.source === "INTERNET" ? "Internet" : "Bibliothek"} · {value.name}
          </span>
        </div>
      )}

      {tab === "BIBLIOTHEK" ? (
        <div className="p-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border mb-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Noch nichts in der Bibliothek.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto">
              {filtered.slice(0, 80).map((x, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickLib(x)}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden border-2 transition-colors",
                    value?.url === x.url ? "border-primary" : "border-transparent hover:border-border"
                  )}
                >
                  <Image src={x.url} className="w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 flex-1 px-3 py-2 rounded-full bg-elevated border border-border">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyUrl()}
                placeholder="https:// … Bild-Link einfügen"
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
              />
            </div>
            <button type="button" onClick={applyUrl} className="px-3 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              Setzen
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-border text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Lade hoch …" : "Datei hochladen"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        </div>
      )}
    </div>
  );
}