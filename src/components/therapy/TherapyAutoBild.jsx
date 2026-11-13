import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Search, Loader2, Wand2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { charRefImages, CHAR_CONSISTENCY } from "@/lib/therapyVisual";

// Auto-Bild: zu jedem Text-Block in der Sitzung automatisch ein Bild erzeugen
// — anhand einer Vorlage oder eines Charakters, den du durchsuchen und
// auswählen kannst. Im Auto-Modus bekommt jede neue Antwort von selbst ein
// Bild; „Für alle Texte" füllt bestehende Blöcke nach.

export default function TherapyAutoBild({ session, messages, onMessageImage }) {
  const [src, setSrc] = useState("CHARACTER"); // "CHARACTER" | "VORLAGE"
  const [vorlagen, setVorlagen] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [sourceId, setSourceId] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [auto, setAuto] = useState(() => {
    try { return localStorage.getItem("therapy_autobild") === "1"; } catch { return false; }
  });
  const [busy, setBusy] = useState(false);
  const lastRef = useRef(null);
  const readyRef = useRef(false);
  const boxRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [v, c] = await Promise.all([
          base44.entities.SzenenVorlage.list("-created_date", 200).catch(() => []),
          base44.entities.Character.list("-created_date", 200).catch(() => []),
        ]);
        setVorlagen((v || []).filter((x) => !x.purpose || x.purpose === "BILD" || x.purpose === "KOMBI"));
        setCharacters(c || []);
      } catch {}
      const lastAi = [...messages].reverse().find((m) => m.senderType === "AI" && m.text);
      lastRef.current = lastAi?.id || null;
      readyRef.current = true;
    })();
  }, []);

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const list = src === "CHARACTER" ? characters : vorlagen;
  const filtered = list.filter((x) => (x.name || "").toLowerCase().includes(query.trim().toLowerCase()));
  const chosen = list.find((x) => x.id === sourceId) || null;

  const buildPrompt = (msgText) => {
    const scene = String(msgText || "").slice(0, 500);
    if (src === "CHARACTER" && chosen) {
      const parts = [];
      if (chosen.appearance) parts.push(`Aussehen: ${chosen.appearance}`);
      if (chosen.art) parts.push(`Stil: ${chosen.art}`);
      if (chosen.description) parts.push(`Charakter: ${chosen.description}`);
      parts.push(`Szene: ${scene}`);
      return `Kinorealistisches Bild einer intimen Szene mit ${chosen.name}. ${parts.join(". ")}. Erwachsene Person ab 18, einvernehmlich. Stimmungsvolles Licht, fotografisch. Keine realen Personen, keine erkennbaren Prominenten.`;
    }
    if (src === "VORLAGE" && chosen) {
      const poses = (chosen.auswahl || []).join(", ");
      const parts = [];
      if (poses) parts.push(`Posen/Szenen: ${poses}`);
      if (chosen.extra) parts.push(`Freie Szene: ${chosen.extra}`);
      parts.push(`Szene: ${scene}`);
      return `Kinorealistisches Bild einer intimen Szene. ${parts.join(". ")}. Erwachsene Personen ab 18, einvernehmlich. Stimmungsvolles Licht, fotografisch. Keine realen Personen.`;
    }
    return `Kinorealistisches Bild einer intimen Szene. Szene: ${scene}. Erwachsene Personen ab 18, einvernehmlich. Stimmungsvolles Licht.`;
  };

  const refsFor = () => {
    const charRefs = src === "CHARACTER" && chosen
      ? [...(chosen.images || []), chosen.avatar].filter(Boolean).slice(0, 2)
      : [];
    // Die Originalcharaktere der Sitzung kommen immer dazu — egal ob ein
    // Charakter oder eine Vorlage gewählt ist — damit jedes Bild gleich bleibt.
    const all = [...charRefs, ...charRefImages(session)];
    const seen = [...new Set(all)];
    return seen.length ? seen.slice(0, 4) : undefined;
  };

  const generateFor = async (msg) => {
    if (!msg || !msg.text) return false;
    if (msg.images && msg.images.length) return false;
    setBusy(true);
    try {
      const r = await base44.integrations.Core.GenerateImage({
        prompt: buildPrompt(msg.text) + CHAR_CONSISTENCY,
        existing_image_urls: refsFor(),
      });
      const url = r?.url;
      if (!url) return false;
      await base44.entities.TherapyMessage.update(msg.id, { images: [url] });
      onMessageImage?.(msg.id, url);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Auto-Modus: neue AI-Text-Antwort → Bild dazu.
  useEffect(() => {
    if (!auto || !readyRef.current || !sourceId || busy) return;
    const lastAi = [...messages].reverse().find((m) => m.senderType === "AI" && m.text && !(m.images || []).length);
    if (!lastAi || lastAi.id === lastRef.current) return;
    lastRef.current = lastAi.id;
    generateFor(lastAi);
  }, [auto, messages, sourceId]);

  const toggleAuto = () => {
    setAuto((v) => {
      const n = !v;
      try { localStorage.setItem("therapy_autobild", n ? "1" : "0"); } catch {}
      return n;
    });
  };

  const switchSrc = (s) => {
    setSrc(s);
    setSourceId("");
    setQuery("");
  };

  const backfillAll = async () => {
    const targets = messages.filter((m) => m.senderType === "AI" && m.text && !(m.images || []).length);
    if (!targets.length) return;
    if (!window.confirm(`Bilder für ${targets.length} Text-Blöcke erzeugen? Das kann einen Moment dauern.`)) return;
    for (const m of targets) {
      await generateFor(m);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap" ref={boxRef}>
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
        <Wand2 className="w-3.5 h-3.5" /> Auto-Bild
      </span>
      <div className="flex gap-1">
        {["CHARACTER", "VORLAGE"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => switchSrc(s)}
            className={cn(
              "px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
              src === s ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
            )}
          >
            {s === "CHARACTER" ? "Charakter" : "Vorlage"}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={chosen ? chosen.name : "Vorlage/Charakter suchen …"}
            className="bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none w-44"
          />
        </div>
        {open && (
          <div className="absolute z-50 mt-1 w-72 max-h-60 overflow-auto rounded-xl border border-border bg-popover shadow-xl">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-[12px] text-muted-foreground">Nichts gefunden.</p>
            ) : (
              filtered.slice(0, 60).map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => { setSourceId(x.id); setQuery(""); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[12px] hover:bg-elevated transition-colors truncate",
                    x.id === sourceId ? "text-primary font-bold" : "text-foreground"
                  )}
                >
                  {x.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggleAuto}
        disabled={!sourceId}
        className={cn(
          "px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-40",
          auto ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
        )}
        title="Neue Antworten bekommen automatisch ein Bild"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : <Sparkles className="w-3.5 h-3.5 inline" />}
        {auto ? "Auto an ✓" : "Auto"}
      </button>

      <button
        type="button"
        onClick={backfillAll}
        disabled={!sourceId || busy}
        className="px-2.5 py-1.5 rounded-full bg-elevated text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        title="Für alle Text-Blöcke ohne Bild eins erzeugen"
      >
        Für alle Texte
      </button>
    </div>
  );
}