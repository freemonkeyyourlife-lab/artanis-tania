import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, Check, ExternalLink, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { importManyFromServices } from "@/lib/creatorImport";
import { subscribeImport } from "@/lib/importRunner";

// Die eigene Dienste-Liste als Quelle: auswählen, was hereinkommen soll.
export default function ImportServicePicker() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState([]);
  const [run, setRun] = useState(null);

  useEffect(() => subscribeImport(setRun), []);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.ExternalService.list("name", 400);
        setServices(res.items || res || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const list = services.filter((s) => (s.name || "").toLowerCase().includes(query.trim().toLowerCase()));
  const running = run?.running;

  const toggle = (s) =>
    setPicked(picked.some((p) => p.id === s.id) ? picked.filter((p) => p.id !== s.id) : [...picked, s]);

  const start = async () => {
    if (!picked.length || running) return;
    await importManyFromServices(picked);
    setPicked([]);
  };

  if (loading) {
    return (
      <p className="inline-flex items-center gap-2 text-[15px] font-semibold text-muted-foreground py-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Dienste-Liste wird geladen …
      </p>
    );
  }

  return (
    <div>
      <p className="text-[13px] font-semibold text-muted-foreground mb-3">
        {services.length} Dienste in deiner Liste. Aus jedem ausgewählten wird die Seite gelesen und ein Charakter
        daraus gebaut. Achtung: viele Einträge sind Testberichte fremder Anbieter — die ergeben selten brauchbare
        Figuren. Läuft im Hintergrund weiter.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dienst suchen…"
            className="w-full pl-9 h-11 rounded-full bg-card border border-border text-[14px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <button
          onClick={() => setPicked(picked.length === list.length ? [] : list)}
          className="px-4 h-11 rounded-full glass-btn text-[13px] font-bold text-foreground"
        >
          {picked.length === list.length && list.length ? "Auswahl leeren" : `Alle ${list.length} wählen`}
        </button>
        <button
          onClick={start}
          disabled={!picked.length || running}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {running ? `${run.done} / ${run.total}` : `${picked.length} importieren`}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
        {list.map((s) => {
          const on = picked.some((p) => p.id === s.id);
          return (
            <div
              key={s.id}
              className={cn(
                "rounded-2xl border-2 p-3 flex items-start gap-2",
                on ? "border-primary" : "border-border"
              )}
            >
              <button onClick={() => toggle(s)} className="flex-1 min-w-0 text-left">
                <p className="inline-flex items-center gap-1.5 text-[14px] font-bold text-foreground truncate">
                  {on && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  <span className="truncate">{s.name}</span>
                </p>
                {s.category && <p className="text-[12px] font-semibold text-muted-foreground">{s.category}</p>}
              </button>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                title="Seite ansehen"
                className="w-7 h-7 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-primary flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}