import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import {
  Loader2, Lock, Cpu, Images, Mic, Boxes, Sparkles, CheckCircle2, AlertTriangle,
  Video, FileText, Wand2, ArrowRight, RefreshCw, Layers,
} from "lucide-react";
import GalleryAssignDialog from "@/components/studio/GalleryAssignDialog";

// Zentrale Studio-Uebersicht: Status der KI-Modelle, Voice-Daten und
// Trainingsfortschritte an einem Ort — plus direkte Galerie-Zuweisung
// und Sprung zur Charakter-Vorschau & Erstellen. Nur fuer die Besitzerin.

const STATUS_STYLE = {
  SAMMLUNG: "bg-muted text-muted-foreground",
  BEREIT: "bg-primary/15 text-primary",
  TRAINIERT: "bg-primary text-primary-foreground",
};
const TRAIN_STYLE = {
  OFFEN: "bg-muted text-muted-foreground",
  "LÄUFT": "bg-badge-ai/20 text-badge-ai",
  FERTIG: "bg-primary text-primary-foreground",
  FEHLER: "bg-destructive/20 text-destructive",
};
const norm = (n) => String(n || "").trim().toLowerCase();

function Kpi({ icon: Icon, label, value, tone, spin }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <Icon className={"mx-auto h-4 w-4 " + tone + (spin ? " animate-spin" : "")} />
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function ModelRow({ name, id, sub, enabled }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-elevated px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-foreground">{name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{sub || id}</p>
      </div>
      <span className={"h-2 w-2 rounded-full " + (enabled ? "bg-primary" : "bg-muted-foreground/40")} />
    </div>
  );
}

export default function StudioUebersicht() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [sets, setSets] = useState([]);
  const [chars, setChars] = useState([]);
  const [imgModels, setImgModels] = useState([]);
  const [vidModels, setVidModels] = useState([]);
  const [txtModels, setTxtModels] = useState([]);
  const [voices, setVoices] = useState([]);
  const [voiceModels, setVoiceModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [assignSet, setAssignSet] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c, im, vm, tm, v, vm2] = await Promise.all([
        base44.entities.TrainingSet.filter({}, { sort: "-created_date", limit: 100 }),
        base44.entities.Character.filter({}, { sort: "-created_date", limit: 100 }),
        base44.entities.ImageModel.filter({}, { sort: "-created_date", limit: 100 }),
        base44.entities.VideoModel.filter({}, { sort: "-created_date", limit: 100 }),
        base44.entities.TextModel.filter({}, { sort: "-created_date", limit: 100 }),
        base44.entities.Voice.list("-created_date", 200).catch(() => []),
        base44.entities.VoiceModel.filter({}, { sort: "-created_date", limit: 100 }),
      ]);
      setSets(s.items || []);
      setChars(c.items || []);
      setImgModels(im.items || []);
      setVidModels(vm.items || []);
      setTxtModels(tm.items || []);
      setVoices(v || []);
      setVoiceModels(vm2.items || []);
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

  const refreshOne = async (id) => {
    setBusy(id);
    try {
      const res = await base44.functions.invoke("runpodStatus", { setId: id });
      if (res?.data) setSets((xs) => xs.map((x) => (x.id === id ? { ...x, ...res.data } : x)));
      toast({ title: "Status aktualisiert" });
    } catch (e) {
      toast({ variant: "destructive", title: "Nicht abrufbar", description: e?.message });
    } finally {
      setBusy(null);
    }
  };

  const rows = sets.map((s) => {
    const ch = chars.find((c) => norm(c.name) === norm(s.personName));
    const have = (s.images?.length || 0) + (s.generatedImages?.length || 0);
    const sources = s.sourceMedia?.length || 0;
    const target = s.targetCount || 12;
    return { set: s, char: ch, have, sources, target, missing: Math.max(0, target - have) };
  });

  const stats = {
    saetze: sets.length,
    trainiert: sets.filter((s) => s.status === "TRAINIERT").length,
    laeuft: sets.filter((s) => s.trainStatus === "LÄUFT").length,
    fehler: sets.filter((s) => s.trainStatus === "FEHLER").length,
    imgModels: imgModels.length,
    vidModels: vidModels.length,
    txtModels: txtModels.length,
    voices: voices.length,
    chars: chars.length,
  };

  if (meLoading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!me || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-2xl text-foreground">Nur für dich</h1>
        <p className="mt-2 text-sm text-muted-foreground">Die Studio-Übersicht ist privat — melde dich als Besitzerin an.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-2">
            <Wand2 className="h-8 w-8 text-primary" /> Studio-Übersicht
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Status deiner KI-Modelle, Voice-Daten und Trainingsfortschritte an einem Ort.
            Weise direkt Dateien aus der Galerie zu und springe zur Charakter-Vorschau, um zu erstellen.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/sammelgalerie" className="glass-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm"><Images className="h-4 w-4" /> Galerie</Link>
          <Link to="/trainingsset" className="glass-btn inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm"><Cpu className="h-4 w-4" /> Werkstatt</Link>
        </div>
      </div>

      {/* Kennzahlen */}
      <div className="mt-6 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        <Kpi icon={Boxes} label="Sätze" value={stats.saetze} tone="text-foreground" />
        <Kpi icon={Sparkles} label="Trainiert" value={stats.trainiert} tone="text-primary" />
        <Kpi icon={Loader2} label="Läuft" value={stats.laeuft} tone="text-badge-ai" spin={stats.laeuft > 0} />
        <Kpi icon={AlertTriangle} label="Fehler" value={stats.fehler} tone="text-destructive" />
        <Kpi icon={Images} label="Bild-Modelle" value={stats.imgModels} tone="text-foreground" />
        <Kpi icon={Video} label="Video-Modelle" value={stats.vidModels} tone="text-foreground" />
        <Kpi icon={FileText} label="Text-Modelle" value={stats.txtModels} tone="text-foreground" />
        <Kpi icon={Mic} label="Stimmen" value={stats.voices} tone="text-foreground" />
        <Kpi icon={Cpu} label="Charaktere" value={stats.chars} tone="text-foreground" />
        <Kpi icon={CheckCircle2} label="Modelle fertig" value={rows.filter((r) => r.set.modelUrl || r.set.modelUri).length} tone="text-primary" />
      </div>

      {/* KI-Modelle */}
      <section className="mt-8">
        <h2 className="font-display text-xl text-foreground flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> KI-Modelle</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Images className="h-3 w-3" /> Bild ({imgModels.length})</p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-hide">
              {imgModels.length === 0 ? <p className="text-xs text-muted-foreground">Keine.</p> :
                imgModels.map((m) => <ModelRow key={m.id} name={m.name} id={m.modelId} sub={m.source + (m.preset ? ` · ${m.preset}` : "")} enabled={m.enabled} />)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Video className="h-3 w-3" /> Video ({vidModels.length})</p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-hide">
              {vidModels.length === 0 ? <p className="text-xs text-muted-foreground">Keine.</p> :
                vidModels.map((m) => <ModelRow key={m.id} name={m.name} id={m.modelId} sub={m.style} enabled={m.enabled} />)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" /> Text ({txtModels.length})</p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-hide">
              {txtModels.length === 0 ? <p className="text-xs text-muted-foreground">Keine.</p> :
                txtModels.map((m) => <ModelRow key={m.id} name={m.name} id={m.modelId} sub={m.style} enabled={m.enabled} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Voice-Daten */}
      <section className="mt-8">
        <h2 className="font-display text-xl text-foreground flex items-center gap-2"><Mic className="h-5 w-5 text-primary" /> Voice-Daten</h2>
        <p className="mt-1 text-xs text-muted-foreground">{voices.length} Stimmen · {voiceModels.length} Voice-Modelle</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3 max-h-56 overflow-y-auto scrollbar-hide">
          {voices.length === 0 ? <p className="text-xs text-muted-foreground">Noch keine Stimmen — im Voice-Studio anlegen.</p> :
            voices.slice(0, 30).map((v) => (
              <div key={v.id} className="flex items-center gap-2 rounded-xl border border-border bg-elevated px-3 py-2">
                <span className={"h-2 w-2 rounded-full " + (v.active ? "bg-primary" : "bg-muted-foreground/40")} />
                <p className="truncate text-[13px] text-foreground">{v.name}</p>
                <span className="ml-auto text-[10px] text-muted-foreground">{v.provider}</span>
              </div>
            ))}
        </div>
      </section>

      {/* Trainingsfortschritt */}
      <section className="mt-8">
        <h2 className="font-display text-xl text-foreground flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" /> Trainingsfortschritt</h2>
        {loading ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lade …</div>
        ) : rows.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="text-sm text-foreground font-heading">Noch keine Sätze</p>
            <p className="text-xs text-muted-foreground">Lege einen Satz an oder sammle in der Galerie.</p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {rows.map((r) => (
              <div key={r.set.id} className="rounded-2xl border border-border bg-card p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-elevated">
                    {r.set.avatar ? <Image src={r.set.avatar} fittingType="fill" className="h-full w-full" /> :
                      r.set.images?.[0] ? <Image src={r.set.images[0]} fittingType="fill" className="h-full w-full" /> :
                      <div className="flex h-full w-full items-center justify-center"><Cpu className="h-5 w-5 text-muted-foreground" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-heading text-foreground">{r.set.personName || r.set.name || "Ohne Name"}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Images className="h-3 w-3" /> {r.have}/{r.target}</span>
                      <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {r.sources} Quellen</span>
                      {r.missing > 0 && r.set.status !== "TRAINIERT" && <span className="text-primary">{r.missing} fehlen</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (STATUS_STYLE[r.set.status] || STATUS_STYLE.SAMMLUNG)}>{r.set.status}</span>
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (TRAIN_STYLE[r.set.trainStatus] || TRAIN_STYLE.OFFEN)}>{r.set.trainStatus}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button onClick={() => setAssignSet(r.set)} title="Dateien aus der Galerie zuweisen"
                      className="rounded-full bg-primary/15 px-2.5 py-1.5 text-[11px] text-primary hover:bg-primary/25 inline-flex items-center gap-1">
                      <Images className="h-3.5 w-3.5" /> Galerie zuweisen
                    </button>
                    {r.char && (
                      <Link to={`/charakter/${r.char.id}`} title="Vorschau & Erstellen"
                        className="rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground inline-flex items-center gap-1">
                        <Wand2 className="h-3.5 w-3.5" /> Vorschau & Erstellen
                      </Link>
                    )}
                    {(r.set.trainStatus === "LÄUFT" || r.set.trainStatus === "OFFEN") && r.set.trainJobId && (
                      <button onClick={() => refreshOne(r.set.id)} disabled={busy === r.set.id}
                        className="rounded-full bg-elevated px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-50">
                        {busy === r.set.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Status
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Charaktere & Erstellen */}
      <section className="mt-8">
        <h2 className="font-display text-xl text-foreground flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> Charaktere & Erstellen</h2>
        <p className="mt-1 text-xs text-muted-foreground">Vorschau des fertigen Charakters öffnen, dann Adventure-Bild, Roleplay-Text oder kurzen Clip erstellen.</p>
        {chars.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Noch keine Charaktere.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {chars.map((c) => (
              <Link key={c.id} to={`/charakter/${c.id}`} className="group rounded-2xl border border-border bg-card p-2 hover:border-primary/50">
                <div className="aspect-[3/4] overflow-hidden rounded-xl bg-elevated">
                  {c.avatar ? <Image src={c.avatar} fittingType="fill" className="h-full w-full" /> :
                    <div className="flex h-full w-full items-center justify-center font-display text-4xl text-primary">{c.name?.charAt(0)}</div>}
                </div>
                <div className="mt-2 flex items-center gap-1 px-1">
                  <p className="truncate text-sm text-foreground">{c.name}</p>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <GalleryAssignDialog open={!!assignSet} set={assignSet} onClose={() => setAssignSet(null)} onDone={load} />
    </div>
  );
}