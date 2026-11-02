import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, CornerDownLeft } from "lucide-react";
import { MODULE_TYPES } from "@/lib/modules";
import { isRestricted } from "@/lib/accessTiers";
import { cn } from "@/lib/utils";

// Die Suche direkt auf der Startseite: tippen, treffen, da. Sie fasst
// Seiten, Charaktere, Storys, Inhalte und Themen in einer Leiste zusammen —
// wer den Weg nicht weiß, findet ihn von hier aus.
export default function HomeSearch({ isOwner, creators = [], content = [], stories = [], topics = [] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const query = q.trim().toLowerCase();

  const pages = useMemo(
    () => MODULE_TYPES.filter((m) => isOwner || !isRestricted(m.path)),
    [isOwner]
  );

  const go = (path) => {
    setOpen(false);
    setQ("");
    navigate(path);
  };

  const matchStr = (...vals) =>
    vals.some((v) => String(v || "").toLowerCase().includes(query));

  const results = useMemo(() => {
    if (!query) return null;
    const seiten = pages
      .filter((m) => matchStr(m.label, m.description, m.path))
      .slice(0, 6)
      .map((m) => ({ id: `p-${m.path}`, label: m.label, sub: m.description, to: m.path, group: "Seiten" }));

    const chars = creators
      .filter((c) => c.active !== false && matchStr(c.stageName, c.realName, c.bio, c.shortStory))
      .slice(0, 5)
      .map((c) => ({ id: `c-${c.id}`, label: c.stageName || c.realName || "Charakter", sub: c.bio || c.shortStory || "Charakter", to: "/explore", group: "Charaktere" }));

    const storyHits = stories
      .filter((s) => matchStr(s.title, s.preview, s.creatorName))
      .slice(0, 5)
      .map((s) => ({ id: `s-${s.id}`, label: s.title, sub: s.creatorName ? `${s.creatorName} · Story` : "Story", to: "/stories", group: "Storys" }));

    const contentHits = content
      .filter((c) => matchStr(c.title, c.description))
      .slice(0, 5)
      .map((c) => ({ id: `ct-${c.id}`, label: c.title || "Inhalt", sub: c.description || "Inhalt", to: "/explore", group: "Inhalte" }));

    const topicHits = topics
      .filter((t) => matchStr(t.name))
      .slice(0, 6)
      .map((t) => ({ id: `t-${t.id}`, label: t.name, sub: "Thema", to: "/topics", group: "Themen" }));

    return [...seiten, ...chars, ...storyHits, ...contentHits, ...topicHits];
  }, [query, pages, creators, stories, content, topics]);

  const groups = useMemo(() => {
    const map = new Map();
    (results || []).forEach((r) => {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group).push(r);
    });
    return [...map.entries()];
  }, [results]);

  const showPanel = open && (query ? (results && results.length > 0) : true);

  return (
    <div ref={wrapRef} className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 px-4 h-12 rounded-full glass-strong border-2 border-border focus-within:border-primary/50 transition-colors">
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="Suche Seite, Charakter, Story, Thema …"
          className="flex-1 bg-transparent outline-none text-[15px] font-semibold text-foreground placeholder:text-muted-foreground"
        />
        {q && (
          <button
            onMouseDown={(e) => { e.preventDefault(); setQ(""); }}
            className="w-7 h-7 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute z-40 mt-2 w-full rounded-2xl glass-strong border-2 border-border overflow-hidden max-h-[60vh] overflow-y-auto scrollbar-hide">
          {query && results.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-muted-foreground text-center">
              Nichts gefunden für „{q}".
            </p>
          ) : !query ? (
            <div className="p-2">
              <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Schnell hin
              </p>
              {[
                { label: "Entdecken", to: "/explore" },
                { label: "Storys", to: "/stories" },
                { label: "Live", to: "/live" },
                { label: "Nachrichten", to: "/messages" },
                { label: "Studio", to: "/studio" },
                { label: "Hilfe & Wegweiser", to: "/hilfe" },
              ].map((s) => (
                <button
                  key={s.to}
                  onMouseDown={() => go(s.to)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-elevated transition-colors text-left"
                >
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[14px] font-semibold text-foreground">{s.label}</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2">
              {groups.map(([group, items]) => (
                <div key={group}>
                  <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </p>
                  {items.map((r) => (
                    <button
                      key={r.id}
                      onMouseDown={() => go(r.to)}
                      className="w-full flex flex-col px-3 py-2.5 rounded-xl hover:bg-elevated transition-colors text-left"
                    >
                      <span className="text-[14px] font-semibold text-foreground truncate">{r.label}</span>
                      <span className="text-[12px] text-muted-foreground truncate">{r.sub}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}