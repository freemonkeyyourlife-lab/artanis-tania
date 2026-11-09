import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { signMedia } from "@/lib/mediaSign";
import {
  Loader2, Lock, Download, Copy, Mic, Cpu, Users, BookOpen, ExternalLink, Sparkles, FileJson,
} from "lucide-react";

// Schnittstelle — private Brücke nach draußen. Hier exportierst du deine
// Charaktere als SillyTavern-Karte (JSON), spiegeln Stimmen-IDs und laden
// trainierte LoRA-Modelle herunter — damit du in anderen Apps (SillyTavern,
// Eigenes, …) mit deinen Charakteren & Stimmen weiterarbeiten kannst.

// Baut eine SillyTavern-Charakterkarte (Spec v2) aus einem Character-Datensatz.
function buildSillyTavernCard(c) {
  const desc = [c.description, c.appearance, c.personality, c.behavior, c.understanding]
    .filter(Boolean).join("\n\n");
  const scenario = c.relationship || "";
  const firstMes = c.art
    ? `${c.name} tritt ein. ${c.appearance || ""}`.trim()
    : `Hallo, ich bin ${c.name}.`;
  return {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: c.name || "Unbenannt",
      description: desc || "",
      personality: c.personality || "",
      scenario: scenario,
      first_mes: firstMes,
      mes_example: "",
      creator_notes: c.understanding || "",
      system_prompt: "",
      post_history_instructions: "",
      tags: Array.isArray(c.neigungen) ? c.neigungen : [],
      creator: "ARTANIS × TANIA",
      character_version: "1.0",
      alternate_greetings: [],
      extensions: {
        artanis_tania: {
          adultAge: c.adultAge,
          voiceId: c.voiceId || "",
          moduleIds: c.moduleIds || [],
        },
      },
    },
  };
}

function download(name, content, type = "application/json") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Schnittstelle() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [characters, setCharacters] = useState([]);
  const [voices, setVoices] = useState([]);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modelUrls, setModelUrls] = useState({});

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null)).finally(() => setMeLoading(false));
    (async () => {
      try {
        const ch = await base44.entities.Character.filter({}, "-created_date", 80);
        setCharacters(Array.isArray(ch) ? ch : ch.items || []);
        const vo = await base44.entities.Voice.filter({}, "-created_date", 80);
        setVoices(Array.isArray(vo) ? vo : vo.items || []);
        const st = await base44.entities.TrainingSet.filter({}, "-created_date", 80);
        setSets(Array.isArray(st) ? st : st.items || []);
      } catch { /* leer */ }
      finally { setLoading(false); }
    })();
  }, []);

  const trainedSets = useMemo(() => sets.filter((s) => s.trainStatus === "FERTIG" && s.modelUri), [sets]);

  const exportCard = (c) => {
    const card = buildSillyTavernCard(c);
    download(`${(c.name || "charakter").replace(/\s+/g, "_")}.json`, JSON.stringify(card, null, 2));
    toast({ title: "Karte exportiert", description: `${c.name} — SillyTavern v2 JSON` });
  };

  const copyVoice = async (v, what) => {
    const val = what === "id" ? (v.externalVoiceId || v.modelId || "") : JSON.stringify({
      name: v.name, provider: v.provider, externalVoiceId: v.externalVoiceId, modelId: v.modelId,
      baseVoice: v.baseVoice, mood: v.mood, speed: v.speed, depth: v.depth, language: v.language,
    }, null, 2);
    try {
      await navigator.clipboard.writeText(val);
      toast({ title: "Kopiert", description: what === "id" ? "Voice-ID übernommen" : "Voice-Profil kopiert" });
    } catch {
      toast({ variant: "destructive", title: "Nicht kopiert" });
    }
  };

  const downloadModel = async (s) => {
    setBusy(true);
    try {
      let url = modelUrls[s.id];
      if (!url) url = s.modelUri.startsWith("http") ? s.modelUri : await signMedia(s.modelUri);
      if (!url) { toast({ variant: "destructive", title: "Nicht freigebbar" }); return; }
      setModelUrls((m) => ({ ...m, [s.id]: url }));
      const blob = await (await fetch(url)).blob();
      download(`${(s.personName || "lora").replace(/\s+/g, "_")}.safetensors`, blob, "application/octet-stream");
      toast({ title: "Modell geladen", description: s.personName });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
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
        <p className="mt-2 text-sm text-muted-foreground">Die Schnittstelle ist privat — melde dich als Besitzerin an.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-4xl text-foreground text-gloss">Schnittstelle</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Private Brücke nach draußen: Charaktere als SillyTavern-Karte exportieren, Stimmen-IDs spiegeln,
        trainierte LoRA-Modelle herunterladen — für SillyTavern und alle Apps, bei denen du Kunde bist.
      </p>

      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground">
        <BookOpen className="h-4 w-4 text-primary" />
        SillyTavern: Importiere die JSON unter „Import Character". Stimmen & Modelle verbindest du in der Ziel-App
        mit deinen dortigen TTS-/Bild-Providern.
        <a href="https://docs.sillytavern.app/usage/core-concepts/characterdesign/" target="_blank" rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-primary">
          Anleitung <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lade …</div>
      ) : (
        <>
          {/* Charaktere → SillyTavern */}
          <section className="mt-6">
            <h2 className="flex items-center gap-2 font-heading text-lg text-foreground">
              <Users className="h-5 w-5 text-primary" /> Charaktere → SillyTavern-Karte
            </h2>
            {characters.length === 0 ? (
              <p className="mt-2 rounded-xl bg-elevated p-4 text-sm text-muted-foreground">Noch keine Charaktere.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {characters.map((c) => (
                  <div key={c.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                    <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                      {c.avatar && <Image src={c.avatar} fittingType="fill" className="h-full w-full" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm text-foreground">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.adultAge ? `${c.adultAge} J.` : ""} {c.neigungen?.length ? `· ${c.neigungen.length} Neigungen` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button onClick={() => exportCard(c)}
                          className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]">
                          <FileJson className="h-3 w-3" /> Karte
                        </button>
                        {c.avatar && (
                          <a href={c.avatar.startsWith("http") ? c.avatar : "#"} target="_blank" rel="noopener noreferrer" download
                            onClick={async (e) => {
                              if (c.avatar.startsWith("http")) return;
                              e.preventDefault();
                              const url = await signMedia(c.avatar);
                              if (url) window.open(url, "_blank");
                            }}
                            className="glass-btn inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]">
                            <Download className="h-3 w-3" /> Bild
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Stimmen */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 font-heading text-lg text-foreground">
              <Mic className="h-5 w-5 text-primary" /> Stimmen spiegeln
            </h2>
            {voices.length === 0 ? (
              <p className="mt-2 rounded-xl bg-elevated p-4 text-sm text-muted-foreground">Noch keine Stimmen.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {voices.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm text-foreground">{v.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {v.provider}{v.externalVoiceId ? ` · ${v.externalVoiceId}` : ""}{v.baseVoice ? ` · Basis ${v.baseVoice}` : ""}
                      </p>
                    </div>
                    <button onClick={() => copyVoice(v, "id")} disabled={!v.externalVoiceId && !v.modelId}
                      className="glass-btn rounded-full px-2.5 py-1 text-[11px] disabled:opacity-40 inline-flex items-center gap-1">
                      <Copy className="h-3 w-3" /> Voice-ID
                    </button>
                    <button onClick={() => copyVoice(v, "profile")}
                      className="glass-btn glass-btn-accent rounded-full px-2.5 py-1 text-[11px] inline-flex items-center gap-1">
                      <Copy className="h-3 w-3" /> Profil
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* LoRA-Modelle */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 font-heading text-lg text-foreground">
              <Cpu className="h-5 w-5 text-primary" /> Trainierte LoRA-Modelle
            </h2>
            {trainedSets.length === 0 ? (
              <p className="mt-2 rounded-xl bg-elevated p-4 text-sm text-muted-foreground">
                Noch kein fertiges Modell — trainiere im Trainings-Assistenten.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {trainedSets.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm text-foreground">{s.personName}</p>
                      <p className="text-xs text-muted-foreground">.safetensors · LoRA</p>
                    </div>
                    <button onClick={() => downloadModel(s)} disabled={busy}
                      className="glass-btn glass-btn-accent rounded-full px-2.5 py-1 text-[11px] disabled:opacity-50 inline-flex items-center gap-1">
                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} Modell
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Lege die .safetensors auf deinen Server/Desktop und binde sie in deiner lokalen ComfyUI / SD-WebUI ein.
            </p>
          </section>
        </>
      )}
    </div>
  );
}