import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { MODULE_TYPES } from "@/lib/modules";
import { isRestricted } from "@/lib/accessTiers";
import { base44 } from "@/api/base44Client";

// Die Suche findet Seiten — und jetzt auch Storys, Inhalte und Charaktere.
// Strg+K öffnet sie von überall.
export default function PageSearch({ isOwner }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState([]);
  const [stories, setStories] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Beim ersten Öffnen Inhalte, Storys und Charaktere laden — einmal, dann im Cache.
  useEffect(() => {
    if (!open || loaded) return;
    setLoaded(true);
    Promise.all([
      base44.entities.Content.filter({ published: true }, "-created_date", 50).catch(() => []),
      base44.entities.Story.filter({ published: true }, "-created_date", 50).catch(() => []),
      base44.entities.Creator.list().catch(() => []),
    ]).then(([c, s, cr]) => {
      setContent(c || []);
      setStories(s || []);
      setCreators((cr || []).filter((x) => x.active !== false));
    });
  }, [open, loaded]);

  const pages = MODULE_TYPES.filter((m) => isOwner || !isRestricted(m.path));
  const go = (path) => { setOpen(false); navigate(path); };
  const creatorLink = (c) =>
    c.personaType === "COUPLE" ? "/couple" : `/${(c.stageName || "").toLowerCase().replace(/\s+/g, "")}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Suchen (Strg+K) — Seiten, Storys, Inhalte, Charaktere"
        className="w-9 h-9 rounded-full glass-btn flex items-center justify-center hover:text-primary transition-colors"
      >
        <Search className="w-4 h-4" />
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Suchen — Seiten, Storys, Inhalte, Charaktere …" />
        <CommandList>
          <CommandEmpty>Nichts gefunden.</CommandEmpty>
          <CommandGroup heading="Seiten">
            {pages.map((m) => (
              <CommandItem key={m.path} value={`${m.label} ${m.description} ${m.path}`} onSelect={() => go(m.path)}>
                <div className="flex flex-col">
                  <span className="font-bold">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.description}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          {creators.length > 0 && (
            <CommandGroup heading="Charaktere">
              {creators.map((c) => (
                <CommandItem key={`cr-${c.id}`} value={`Charakter ${c.stageName} ${c.tagline || ""}`} onSelect={() => go(creatorLink(c))}>
                  <span className="font-bold">{c.stageName}</span>
                  {c.tagline && <span className="text-xs text-muted-foreground ml-2">{c.tagline}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {stories.length > 0 && (
            <CommandGroup heading="Storys">
              {stories.map((s) => (
                <CommandItem key={`st-${s.id}`} value={`Story ${s.title} ${s.creatorName} ${(s.topics || []).join(" ")}`} onSelect={() => go("/stories")}>
                  <div className="flex flex-col">
                    <span className="font-bold">{s.title}</span>
                    <span className="text-xs text-muted-foreground">{s.creatorName}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {content.length > 0 && (
            <CommandGroup heading="Inhalte">
              {content.map((c) => (
                <CommandItem key={`ct-${c.id}`} value={`Inhalt ${c.title} ${c.creatorName} ${(c.topics || []).join(" ")}`} onSelect={() => go("/explore")}>
                  <div className="flex flex-col">
                    <span className="font-bold">{c.title}</span>
                    <span className="text-xs text-muted-foreground">{c.creatorName}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}