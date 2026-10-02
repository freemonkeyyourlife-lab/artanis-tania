import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Search, Copy, Check, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { addGalleryItems } from "@/lib/gallery";
import { promptList } from "@/lib/externalPrompt";
import ExternalCharacterRow from "@/components/studio/ExternalCharacterRow";
import KeywordPromptBox from "@/components/studio/KeywordPromptBox";

const FIELDS = ["stageName", "avatar", "personaType", "artStyle", "age", "tagline", "shortStory", "bio", "referenceImages"];
const NO_IMAGE = { $or: [{ avatar: "" }, { avatar: { $exists: false } }] };

// Draußen erzeugen, hier hochladen: Prompts zum Mitnehmen und ein Feld pro
// Charakter, in das das fertige Bild zurückgelegt wird.
export default function ExternalPromptUpload({ onChanged }) {
  const { toast } = useToast();
  const [mode, setMode] = useState("OHNE");
  const [query, setQuery] = useState("");
  const [creators, setCreators] = useState([]);
  const [stats, setStats] = useState({ total: 0, ohne: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    const t = setTimeout(load, query ? 350 : 0);
    return () => clearTimeout(t);
  }, [mode, query]);

  const load = async () => {
    setLoading(true);
    try {
      const base = mode === "OHNE" ? NO_IMAGE : {};
      const q = query.trim() ? { ...base, stageName: { $regex: query.trim(), $options: "i" } } : base;
      const [page, total, ohne] = await Promise.all([
        base44.entities.Creator.filter(q, { sort: "stageName", limit: 200, fields: FIELDS }),
        base44.entities.Creator.count(),
        base44.entities.Creator.count(NO_IMAGE),
      ]);
      setCreators(page.items || []);
      setStats({ total, ohne });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Hochladen, Hauptbild setzen, Galerie-Eintrag anlegen — in einem Zug.
  const upload = async (files, creator, input) => {
    if (!files.length) return;
    setBusyId(creator.id);
    try {
      const urls = [];
      for (const f of files) {
        const res = await base44.integrations.Core.UploadPublicFile({ file: f });
        urls.push(res.file_url);
      }
      await addGalleryItems({ urls, creatorId: creator.id, creatorName: creator.stageName });

      const rest = [...urls];
      const avatar = creator.avatar || rest.shift();
      const referenceImages = [...(creator.referenceImages || []), ...rest];
      const data = { avatar, referenceImages };
      if (!creator.banner && avatar) data.banner = avatar;
      await base44.entities.Creator.update(creator.id, data);

      toast({
        title: "Bild sitzt",
        description: `${urls.length} Bild(er) bei „${creator.stageName}" — stehen auch in der Galerie des Profils.`,
      });
      await load();
      onChanged?.();
    } catch (e) {
      console.error(e);
      toast({ title: "Upload fehlgeschlagen", description: "Versuch es noch einmal.", variant: "destructive" });
    } finally {
      setBusyId(null);
      if (input) input.value = "";
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(promptList(creators));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1600);
    } catch (e) {
      /* Zwischenablage verweigert. */
    }
  };

  const withImage = stats.total - stats.ohne;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-display text-xl text-foreground mb-1">Prompt mitnehmen & Ergebnis zurücklegen</p>
          <p className="text-[14px] font-semibold text-muted-foreground max-w-2xl">
            Prompt kopieren, im externen Bild-Studio erzeugen, Ergebnis hier ablegen. Jedes Bild wird sofort zum
            Hauptbild und steht in der Galerie des Profils.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground whitespace-nowrap"
        >
          <RefreshCw className="w-4 h-4" /> Neu laden
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {[
          { n: "1", t: "Prompt kopieren", d: "Name, Persona, Stil und Aussehen sind schon fertig formuliert." },
          { n: "2", t: "Draußen erzeugen", d: "Im externen Studio deiner Wahl einfügen und das Bild erzeugen lassen." },
          { n: "3", t: "Hier hochladen", d: "Das fertige Bild am Charakter ablegen — Hauptbild und Galerie in einem Schritt." },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-border bg-card p-4">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary text-[13px] font-bold mb-2">
              {s.n}
            </span>
            <p className="text-[15px] font-bold text-foreground">{s.t}</p>
            <p className="text-[13px] font-semibold text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>

      <KeywordPromptBox />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setMode("OHNE")}
          className={cn(
            "px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors",
            mode === "OHNE" ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
          )}
        >
          Ohne Bild ({stats.ohne})
        </button>
        <button
          onClick={() => setMode("ALLE")}
          className={cn(
            "px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors",
            mode === "ALLE" ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
          )}
        >
          Alle Charaktere ({stats.total})
        </button>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Charakter suchen…"
            className="w-full pl-9 h-11 rounded-full bg-card border border-border text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <button
          onClick={copyAll}
          disabled={!creators.length}
          className={cn(
            "inline-flex items-center gap-2 px-5 h-11 rounded-full text-[14px] font-bold whitespace-nowrap transition-colors disabled:opacity-50",
            copiedAll ? "bg-emerald-600/20 text-emerald-400" : "glass-btn text-foreground"
          )}
        >
          {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedAll ? "Kopiert" : "Alle Prompts der Liste kopieren"}
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-[13px] font-bold text-muted-foreground mb-1.5">
          <span>
            {withImage} von {stats.total} Charakteren haben ein Bild
          </span>
          <span>{stats.ohne} offen</span>
        </div>
        <div className="h-2.5 rounded-full bg-elevated border border-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${stats.total ? Math.round((withImage / stats.total) * 100) : 0}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : creators.length === 0 ? (
        <p className="text-[15px] font-semibold text-muted-foreground text-center py-14">
          {mode === "OHNE" ? "Alle Charaktere haben ein Bild — nichts offen." : "Kein Charakter gefunden."}
        </p>
      ) : (
        <div className="space-y-2">
          {creators.map((c) => (
            <ExternalCharacterRow key={c.id} creator={c} onUpload={upload} busy={busyId === c.id} />
          ))}
        </div>
      )}

      <p className="mt-5 text-[13px] font-semibold text-muted-foreground flex items-start gap-2">
        <Upload className="w-4 h-4 flex-shrink-0 mt-0.5" />
        Mehrere Bilder auf einmal gehen auch: Das erste wird das Hauptbild, die übrigen sind Referenzen, damit der
        Charakter in jedem Bild gleich aussieht.
      </p>
    </div>
  );
}