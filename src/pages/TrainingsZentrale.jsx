import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import {
  Loader2, Lock, Cpu, Images, Layers, CheckCircle2, AlertTriangle, RefreshCw,
  Download, ExternalLink, Boxes, Sparkles, HardDrive,
} from "lucide-react";

// Zentrale Übersicht aller KI-Trainings-Workflows im privaten Studio:
// Status jedes Modells/Satzes, Fortschritt der Bild-Sammlung und direkte
// Verknüpfung zur Sammel-Galerie — Bilder per Klick ins Training übernehmen.
// Nur für die Besitzerin (admin).

const STATUS_STYLE = {
  SAMMLUNG: "bg-muted text-muted-foreground",
  BEREIT: "bg-primary/15 text-primary",
  TRAINIERT: "bg-primary text-primary-foreground",
};

const TRAIN_STYLE = {
  OFFEN: "bg-muted text-muted-foreground",
  LÄUFT: "bg-badge-ai/20 text-badge-ai",
  FERTIG: "bg-primary text-primary-foreground",
  FEHLER: "bg-destructive/20 text-destructive",
};

const norm = (n) => String(n || "").trim().toLowerCase();

export default function TrainingsZentrale() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [sets, setSets] = useState([]);
  const [chars, setChars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        base44.entities.TrainingSet.filter({}, { sort: "-created_date", limit: 100 }),
        base44.entities.Character.filter({}, { sort: "-created_date", limit: 100 }),
      ]);
      setSets(s.items || []);
      setChars(c.items || []);
    } catch (e) {
      toast({ variant: "destructive", title: "Nicht geladen", description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null)).finally(() => setMeLoading(false));
    load();
  }, []);

  const rows = sets.map((s) => {
    const ch = chars.find((c) => norm(c.name) === norm(s.personName));
    const have = (s.images?.length || 0) + (s.generatedImages?.length || 0);
    const sources = s.sourceMedia?.length || 0;
    const target = s.targetCount || 12;
    return { set: s, char: ch, have, sources, target, missing: Math.max(0, target - have) };
  });

  const stats = {
    gesamt: sets.length,
    sammlung: sets.filter((s) => s.status === "SAMMLUNG").length,
    bereit: sets.filter((s) => s.status === "BEREIT").length,
    trainiert: sets.filter((s) => s.status === "TRAINIERT").length,
    laeuft: sets.filter((s) => s.trainStatus === "LÄUFT").length,
    fehler: sets.filter((s) => s.trainStatus === "FEHLER").length,
    modelle: sets.filter((s) => s.modelUrl || s.modelUri).length,
  };

  const refreshOne = async (id) => {
    setBusy(id);
    try {
      const res = await base44.functions.invoke("runpodStatus", { setId: id });
      if (res?.data) {
        setSets((xs) => xs.map((x) => (x.id === id ? { ...x, ...res.data } : x)));
      }
      toast({ title: "Status aktualisiert" });
    } catch (e) {
      toast({ variant: "destructive", title: "Nicht abrufbar", description: e?.message });
    } finally {
      setBusy(null);
    }
  };

  if (meLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!me || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-2xl text-foreground">Nur für dich</h1>
        <p className="mt-2 text-sm text-muted-foreground">Die Trainings-Zentrale ist privat — melde dich als Besitzerin an.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-2">
            <Cpu className="h-8 w-8 text-primary" /> Trainings-Zentrale
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Status aller KI-Modell-Workflows an einem Ort. Sammle Bilder aus der
            Galerie, verfolge Trainings-Jobs und lade fertige Modelle herunter —
            direkt verknüpft mit deiner Sammel-Galerie und der Trainings-Werkstatt.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/sammelgalerie" className="glass-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm">
            <Images className="h-4 w-4" /> Zur Galerie
          </Link>
          <Link to="/trainingsset" className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm">
            <Cpu className="h-4 w-4" /> Trainings-Werkstatt
          </Link>
        </div>
      </div>

      {/* Kennzahlen */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { k: "Gesamt", v: stats.gesamt, icon: Boxes, tone: "text-foreground" },
          { k: "Sammlung", v: stats.sammlung, icon: Layers, tone: "text-muted-foreground" },
          { k: "Bereit", v: stats.bereit, icon: CheckCircle2, tone: "text-primary" },
          { k: "Trainiert", v: stats.trainiert, icon: Sparkles, tone: "text-primary" },
          { k: "Läuft", v: stats.laeuft, icon: Loader2, tone: "text-badge-ai", spin: stats.laeuft > 0 },
          { k: "Fehler", v: stats.fehler, icon: AlertTriangle, tone: "text-destructive" },
          { k: "Modelle", v: stats.modelle, icon: HardDrive, tone: "text-foreground" },
        ].map((c) => (
          <div key={c.k} className="rounded-2xl border border-border bg-card p-3 text-center">
            <c.icon className={"mx-auto h-4 w-4 " + c.tone + (c.spin ? " animate-spin" : "")} />
            <p className="mt-1 text-2xl font-bold text-foreground">{c.v}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.k}</p>
          </div>
        ))}
      </div>

      {/* Google Drive Hinweis — externe Quelle */}
      <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center gap-3">
        <HardDrive className="h-5 w-5 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground font-heading">Externe Quelle: Google Drive</p>
          <p className="text-xs text-muted-foreground">Nach der Freigabe kannst du Drive-Dateien und Ordner als Trainings-Quellen nutzen. Verbindung läuft über die private Studio-Freigabe.</p>
        </div>
        <Link to="/schnittstelle" className="rounded-full bg-elevated px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Anbindungen verwalten</Link>
      </div>

      {/* Liste aller Trainings-Sätze */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lade Workflows …</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
            <Cpu className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-foreground font-heading">Noch keine Trainings-Sätze</p>
            <p className="text-xs text-muted-foreground">Lege einen Satz in der Werkstatt an oder sammle Bilder in der Galerie.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link to="/sammelgalerie" className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm"><Images className="h-4 w-4" /> Galerie öffnen</Link>
              <Link to="/trainingsset" className="glass-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm"><Cpu className="h-4 w-4" /> Werkstatt öffnen</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.set.id} className="rounded-2xl border border-border bg-card p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Avatar / Vorschau */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-elevated">
                    {r.set.avatar ? (
                      <Image src={r.set.avatar} fittingType="fill" className="h-full w-full" />
                    ) : r.set.images?.[0] ? (
                      <Image src={r.set.images[0]} fittingType="fill" className="h-full w-full" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><Cpu className="h-5 w-5 text-muted-foreground" /></div>
                    )}
                  </div>

                  {/* Name + Fortschritt */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-heading text-foreground">{r.set.personName || r.set.name || "Ohne Name"}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Images className="h-3 w-3" /> {r.have}/{r.target} Bilder</span>
                      <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {r.sources} Quellen</span>
                      {r.missing > 0 && r.set.status !== "TRAINIERT" && (
                        <span className="inline-flex items-center gap-1 text-primary"><AlertTriangle className="h-3 w-3" /> {r.missing} fehlen</span>
                      )}
                    </div>
                    {r.set.trainStatus === "FEHLER" && r.set.trainError && (
                      <p className="mt-1 text-[11px] text-destructive truncate" title={r.set.trainError}>{r.set.trainError}</p>
                    )}
                  </div>

                  {/* Status-Badges */}
                  <div className="flex flex-col items-end gap-1">
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (STATUS_STYLE[r.set.status] || STATUS_STYLE.SAMMLUNG)}>{r.set.status}</span>
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (TRAIN_STYLE[r.set.trainStatus] || TRAIN_STYLE.OFFEN)}>{r.set.trainStatus}</span>
                  </div>

                  {/* Aktionen */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link to="/sammelgalerie" title="Bilder aus der Galerie holen"
                      className="rounded-full bg-elevated px-2.5 py-1.5 text-[11px] text-foreground hover:text-primary inline-flex items-center gap-1">
                      <Images className="h-3.5 w-3.5" /> Galerie
                    </Link>
                    <Link to={`/trainingsset`} title="In der Werkstatt öffnen"
                      className="rounded-full bg-elevated px-2.5 py-1.5 text-[11px] text-foreground hover:text-primary inline-flex items-center gap-1">
                      <Cpu className="h-3.5 w-3.5" /> Werkstatt
                    </Link>
                    {r.char && (
                      <Link to={`/charakter/${r.char.id}`} title="Charakter öffnen"
                        className="rounded-full bg-elevated px-2.5 py-1.5 text-[11px] text-foreground hover:text-primary inline-flex items-center gap-1">
                        <ExternalLink className="h-3.5 w-3.5" /> Charakter
                      </Link>
                    )}
                    {(r.set.trainStatus === "LÄUFT" || r.set.trainStatus === "OFFEN") && r.set.trainJobId && (
                      <button onClick={() => refreshOne(r.set.id)} disabled={busy === r.set.id}
                        title="Trainings-Status abfragen"
                        className="rounded-full bg-elevated px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-50">
                        {busy === r.set.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Status
                      </button>
                    )}
                    {r.set.modelUrl && (
                      <a href={r.set.modelUrl} target="_blank" rel="noreferrer" title="Fertiges Modell herunterladen"
                        className="rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground inline-flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" /> Modell
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}