import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Image as ImageIcon } from "@/components/ui/image";
import { Loader2, Search, Trash2, Upload, FileAudio, FileVideo, FileText, Image as ImgIcon, Sparkles, Film, Mic, User } from "lucide-react";

// Das private Quellen-Archiv im Godmode: alles was wir sammeln — Bilder, Videos,
// Audio, GIFs, Texte, Stories, Stimmen, Modelle, Charaktere — landet hier, ist
// nach Charakter sortiert, durchsuchbar und lässt sich als Prompt für Bild- und
// Video-Erzeugung übernehmen. Ton- und Videoquellen lassen sich transkribieren;
// das Transkript wird selbst eine durchsuchbare Quelle.

const KINDS = [
  { key: "BILD", label: "Bild", icon: ImgIcon },
  { key: "VIDEO", label: "Video", icon: FileVideo },
  { key: "AUDIO", label: "Audio", icon: FileAudio },
  { key: "GIF", label: "GIF", icon: ImgIcon },
  { key: "TEXT", label: "Text", icon: FileText },
  { key: "STORY", label: "Story", icon: FileText },
  { key: "STIMME", label: "Stimme", icon: Mic },
  { key: "MODELL", label: "Modell", icon: Sparkles },
  { key: "CHARAKTER", label: "Charakter", icon: User },
  { key: "FUNKTION", label: "Funktion", icon: Sparkles },
];

const kindForFile = (file) => {
  const t = (file.type || "").toLowerCase();
  const n = (file.name || "").toLowerCase();
  if (t.startsWith("image/gif") || n.endsWith(".gif")) return "GIF";
  if (t.startsWith("image")) return "BILD";
  if (t.startsWith("video")) return "VIDEO";
  if (t.startsWith("audio")) return "AUDIO";
  if (t.startsWith("text") || n.match(/\.(txt|md|json|csv)$/)) return "TEXT";
  return "TEXT";
};

export default function GodTrainArchiv() {
  const [items, setItems] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("ALLE");
  const [charFilter, setCharFilter] = useState("ALLE");
  const [assignChar, setAssignChar] = useState("");
  const [query, setQuery] = useState("");
  const [signed, setSigned] = useState({});
  const [gen, setGen] = useState({ id: null, kind: null });
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [page, chars] = await Promise.all([
        base44.entities.Quelle.filter({}, { sort: "-created_date", limit: 200 }),
        base44.entities.Character.list({ limit: 200 }).catch(() => ({ items: [] })),
      ]);
      setItems(page.items || []);
      setCharacters(chars.items || chars || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const charName = (id) => characters.find((c) => c.id === id)?.name || "";

  const ensureSigned = async (q) => {
    if (!q.fileUri || signed[q.id]) return;
    try {
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: q.fileUri, expires_in: 3600 });
      setSigned((s) => ({ ...s, [q.id]: res.signed_url }));
    } catch {}
  };

  const upload = async (files) => {
    if (!files?.length || busy) return;
    setBusy(true);
    try {
      const cName = assignChar ? charName(assignChar) : "";
      for (const f of files) {
        const up = await base44.integrations.Core.UploadPrivateFile({ file: f });
        await base44.entities.Quelle.create({
          name: f.name,
          kind: kindForFile(f),
          fileUri: up.file_uri,
          source: "UPLOAD",
          characterId: assignChar || undefined,
          characterName: cName || undefined,
        });
      }
      await load();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const transcribe = async (q) => {
    setBusy(true);
    try {
      await ensureSigned(q);
      const url = signed[q.id];
      if (!url) throw new Error("Kein Zugriff auf die Datei.");
      const text = await base44.integrations.Core.TranscribeAudio({ audio_url: url });
      await base44.entities.Quelle.create({
        name: `Transkript · ${q.name}`,
        kind: "TEXT",
        text: typeof text === "string" ? text : text?.text || JSON.stringify(text),
        source: "EXTRAKT",
        characterId: q.characterId,
        characterName: q.characterName,
        tags: ["Transkript", q.name],
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const generate = async (q, kind) => {
    const prompt = q.text || q.note || q.name || "";
    if (!prompt) return;
    setGen({ id: q.id, kind });
    try {
      let res;
      if (kind === "BILD") {
        res = await base44.integrations.Core.GenerateImage({ prompt });
        await base44.entities.Quelle.create({
          name: `Generiert · ${q.name}`,
          kind: "BILD",
          url: res.url,
          source: "GENERIERT",
          characterId: q.characterId,
          characterName: q.characterName,
          tags: ["generiert", q.name],
        });
      } else {
        res = await base44.integrations.Core.GenerateVideo({ prompt });
        await base44.entities.Quelle.create({
          name: `Generiert · ${q.name}`,
          kind: "VIDEO",
          url: res.url,
          source: "GENERIERT",
          characterId: q.characterId,
          characterName: q.characterName,
          tags: ["generiert", q.name],
        });
      }
      await load();
    } finally {
      setGen({ id: null, kind: null });
    }
  };

  const assignTo = async (q, charId) => {
    const cName = charId ? charName(charId) : "";
    await base44.entities.Quelle.update(q.id, { characterId: charId || undefined, characterName: cName || undefined });
    setItems((xs) => xs.map((x) => (x.id === q.id ? { ...x, characterId: charId || undefined, characterName: cName || undefined } : x)));
  };

  const remove = async (q) => {
    await base44.entities.Quelle.delete(q.id);
    setItems((xs) => xs.filter((x) => x.id !== q.id));
  };

  const filtered = useMemo(() => {
    return items.filter((q) => {
      if (filter !== "ALLE" && q.kind !== filter) return false;
      if (charFilter !== "ALLE" && (q.characterId || "") !== charFilter) return false;
      if (query) {
        const hay = `${q.name || ""} ${(q.tags || []).join(" ")} ${q.note || ""} ${q.text || ""} ${q.characterName || ""}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, filter, charFilter, query]);

  // Gruppiert nach Charakter — "Ohne Zuordnung" landet am Ende.
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((q) => {
      const key = q.characterName || (q.characterId ? charName(q.characterId) : "") || "__ohne";
      (groups[key] ||= []).push(q);
    });
    return Object.entries(groups).sort((a, b) => (a[0] === "__ohne" ? 1 : a[0].localeCompare(b[0])));
  }, [filtered, characters]);

  const charCounts = useMemo(() => {
    const c = {};
    items.forEach((q) => { const k = q.characterId || "__ohne"; c[k] = (c[k] || 0) + 1; });
    return c;
  }, [items]);

  const counts = useMemo(() => {
    const c = {};
    items.forEach((q) => { c[q.kind] = (c[q.kind] || 0) + 1; });
    return c;
  }, [items]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-btn glass-btn-accent text-[12px] font-bold text-gloss disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Hochladen
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => upload(Array.from(e.target.files || []))}
        />
        <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
          <User className="w-3.5 h-3.5" /> zu Charakter:
          <select
            value={assignChar}
            onChange={(e) => setAssignChar(e.target.value)}
            className="bg-elevated border border-border rounded-full px-2 py-1 text-[11px] text-foreground focus:outline-none max-w-[160px]"
          >
            <option value="">— ohne —</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-elevated border border-border flex-1 min-w-[140px] max-w-[220px]">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Archiv durchsuchen …"
            className="bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setCharFilter("ALLE")}
          className={cn("px-2 py-0.5 rounded-full text-[11px] font-bold", charFilter === "ALLE" ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground")}
        >
          Alle Charaktere {items.length}
        </button>
        {characters.map((c) => (
          <button
            key={c.id}
            onClick={() => setCharFilter(c.id)}
            className={cn("px-2 py-0.5 rounded-full text-[11px] font-bold", charFilter === c.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground")}
          >
            {c.name} {charCounts[c.id] || 0}
          </button>
        ))}
        {charCounts.__ohne ? (
          <button
            onClick={() => setCharFilter("__ohne")}
            className={cn("px-2 py-0.5 rounded-full text-[11px] font-bold", charFilter === "__ohne" ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground")}
          >
            Ohne Zuordnung {charCounts.__ohne}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1">
        {[{ key: "ALLE", label: "Alle" }, ...KINDS].map((k) => (
          <button
            key={k.key}
            onClick={() => setFilter(k.key)}
            className={cn(
              "px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors",
              filter === k.key ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground"
            )}
          >
            {k.label}{k.key !== "ALLE" && counts[k.key] ? ` ${counts[k.key]}` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Archiv wird geladen …
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-[12px] text-muted-foreground py-6 text-center">
          Noch nichts hier. Lade Bilder, Videos, Audio oder Texte hoch — alles wird (stored privately) abgelegt und nach Charakter sortiert.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {grouped.map(([group, qs]) => (
            <div key={group} className="rounded-2xl border border-border bg-background/40 p-2">
              <p className="px-1 pb-1 text-[12px] font-bold text-primary flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {group === "__ohne" ? "Ohne Zuordnung" : group}
                <span className="text-muted-foreground font-normal">{qs.length}</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {qs.map((q) => (
                  <div key={q.id} className="rounded-xl border border-border bg-elevated p-2 flex flex-col gap-2">
                    <QuellePreview q={q} signed={signed[q.id]} ensureSigned={() => ensureSigned(q)} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-foreground truncate">{q.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {q.kind} · {q.source}
                      </p>
                    </div>
                    {(q.kind === "AUDIO" || q.kind === "VIDEO") && (
                      <button
                        onClick={() => transcribe(q)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground disabled:opacity-50"
                      >
                        <Mic className="w-3 h-3" /> Transkribieren
                      </button>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={() => generate(q, "BILD")}
                        disabled={gen.id === q.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground disabled:opacity-50"
                      >
                        {gen.id === q.id && gen.kind === "BILD" ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImgIcon className="w-3 h-3" />} Bild
                      </button>
                      <button
                        onClick={() => generate(q, "VIDEO")}
                        disabled={gen.id === q.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground disabled:opacity-50"
                      >
                        {gen.id === q.id && gen.kind === "VIDEO" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />} Video
                      </button>
                      <button
                        onClick={() => remove(q)}
                        className="ml-auto px-2 py-1 rounded-full glass-btn text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <select
                      value={q.characterId || ""}
                      onChange={(e) => assignTo(q, e.target.value)}
                      className="bg-background border border-border rounded-full px-2 py-1 text-[10px] text-foreground focus:outline-none w-full"
                    >
                      <option value="">Charakter …</option>
                      {characters.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuellePreview({ q, signed, ensureSigned }) {
  const src = q.url || signed;
  useEffect(() => { if (q.fileUri && !signed && (q.kind === "BILD" || q.kind === "VIDEO" || q.kind === "AUDIO" || q.kind === "GIF")) ensureSigned(); }, [q.id]);
  if (q.kind === "TEXT" || q.kind === "STORY") {
    return <p className="text-[11px] text-foreground bg-background rounded-lg p-2 max-h-24 overflow-y-auto whitespace-pre-wrap">{q.text || q.note || ""}</p>;
  }
  if (q.kind === "BILD" || q.kind === "GIF") {
    if (!src) return <div className="h-20 rounded-lg bg-background" />;
    return <ImageIcon src={src} alt={q.name} className="h-24 w-full rounded-lg object-cover" />;
  }
  if (q.kind === "VIDEO") {
    if (!src) return <div className="h-20 rounded-lg bg-background" />;
    return <video src={src} controls className="h-28 w-full rounded-lg object-cover" />;
  }
  if (q.kind === "AUDIO") {
    if (!src) return <div className="h-12 rounded-lg bg-background" />;
    return <audio src={src} controls className="w-full" />;
  }
  return <div className="h-12 rounded-lg bg-background flex items-center justify-center text-[10px] text-muted-foreground uppercase">{q.kind}</div>;
}