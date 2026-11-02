import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Search } from "lucide-react";
import { signMedia } from "@/lib/mediaSign";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// Quellen-Suche: durchsucht die ganze Medienbibliothek — Archiv, Trainingssets
// und Charakter-Bilder — in einer durchsuchbaren Liste.
export default function GodTrainSources() {
  const [archive, setArchive] = useState([]);
  const [sets, setSets] = useState([]);
  const [chars, setChars] = useState([]);
  const [urls, setUrls] = useState({});
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("alle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, s, c] = await Promise.all([
          base44.entities.ImageArchive.filter({}, { sort: "-created_date", limit: 200 }),
          base44.entities.TrainingSet.filter({}, { sort: "-created_date", limit: 100 }),
          base44.entities.Character.filter({}, { sort: "-created_date", limit: 100 }),
        ]);
        setArchive(a.items || []);
        setSets(s.items || []);
        setChars(c.items || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Eine flache Liste aller Medien mit Herkunft.
  const all = useMemo(() => {
    const list = [];
    archive.forEach((a) => list.push({ id: a.id, url: a.url, label: a.name || a.note || "Archiv", src: "Archiv", kind: a.kind, tags: a.tags }));
    sets.forEach((s) => (s.images || []).forEach((u, i) => list.push({ id: `${s.id}-${i}`, url: u, label: `${s.personName} #${i + 1}`, src: `Set · ${s.personName}`, kind: "CHARAKTER" })));
    sets.forEach((s) => (s.generatedImages || []).forEach((u, i) => list.push({ id: `${s.id}-g${i}`, url: u, label: `${s.personName} (generiert) #${i + 1}`, src: `Set · ${s.personName} (gen)`, kind: "CHARAKTER" })));
    chars.forEach((c) => (c.images || []).forEach((u, i) => list.push({ id: `${c.id}-${i}`, url: u, label: `${c.name} #${i + 1}`, src: `Charakter · ${c.name}`, kind: "CHARAKTER" })));
    return list;
  }, [archive, sets, chars]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all.filter((m) => (!t || (m.label + " " + m.src + " " + (m.tags || []).join(" ")).toLowerCase().includes(t)) && (kind === "alle" || m.kind === kind));
  }, [all, q, kind]);

  // Vorschauen für private URIs nachladen.
  useEffect(() => {
    (async () => {
      const map = {};
      for (const m of filtered.slice(0, 60)) {
        if (!urls[m.url]) map[m.url] = await signMedia(m.url);
      }
      if (Object.keys(map).length) setUrls((u) => ({ ...u, ...map }));
    })();
  }, [filtered]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-xl bg-elevated border border-border px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Alles durchsuchen …" className="w-full bg-transparent text-[13px] text-foreground focus:outline-none" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["alle", "ALLGEMEIN", "IDEE", "CHARAKTER", "BAUSATZ"].map((k) => (
          <button key={k} onClick={() => setKind(k)} className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold border border-border bg-elevated", kind === k ? "text-primary" : "text-muted-foreground")}>{k}</button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{filtered.length} Treffer</p>
      {loading ? <p className="text-[13px] text-muted-foreground">Lädt …</p> : (
        <div className="grid grid-cols-3 gap-2">
          {filtered.slice(0, 60).map((m) => (
            <a key={m.id} href={urls[m.url] || "#"} target="_blank" rel="noreferrer" className="block group" title={m.src}>
              <div className="aspect-square overflow-hidden rounded-xl bg-background">
                {urls[m.url] ? <Image src={urls[m.url]} fittingType="fill" className="h-full w-full" /> : <div className="h-full w-full" />}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground truncate">{m.label}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}