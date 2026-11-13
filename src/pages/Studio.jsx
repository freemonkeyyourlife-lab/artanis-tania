import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Plus, Pencil, Trash2, BookOpen, Mic, ImagePlus, Maximize, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import CharacterForm from "@/components/studio/CharacterForm";
import CharacterQuickImages from "@/components/studio/CharacterQuickImages";
import CharacterVoiceBox from "@/components/studio/CharacterVoiceBox";
import { assignVoiceToCreator } from "@/lib/voiceAssign";
import { syncCreatorGalleries } from "@/lib/gallery";
import { useToast } from "@/components/ui/use-toast";
import StoryManager from "@/components/studio/StoryManager";
import TopicManager from "@/components/studio/TopicManager";
import ContentManager from "@/components/studio/ContentManager";
import LiveManager from "@/components/studio/LiveManager";
import MemberManager from "@/components/studio/MemberManager";
import ContestManager from "@/components/studio/ContestManager";
import GeneratorManager from "@/components/studio/GeneratorManager";
import ModelManager from "@/components/studio/ModelManager";
import TextModelManager from "@/components/studio/TextModelManager";
import VideoModelManager from "@/components/studio/VideoModelManager";
import BulkImport from "@/components/studio/BulkImport";
import SammelImport from "@/components/studio/SammelImport";
import HarvestSandbox from "@/components/studio/HarvestSandbox";
import BotTrainingSandbox from "@/components/studio/BotTrainingSandbox";
import LinkUpload from "@/components/studio/LinkUpload";
import PlanManager from "@/components/studio/PlanManager";
import GalleryManager from "@/components/studio/GalleryManager";
import GuideManager from "@/components/studio/GuideManager";
import DockManager from "@/components/studio/DockManager";
import VoiceManager from "@/components/studio/VoiceManager";
import VoiceByCharacter from "@/components/studio/VoiceByCharacter";
import Stimmkatalog from "@/components/studio/Stimmkatalog";
import VoiceTuner from "@/components/studio/VoiceTuner";
import VoiceProfilesPanel from "@/components/voice/VoiceProfilesPanel";
import CharacterTransfer from "@/components/studio/CharacterTransfer";
import ServiceListManager from "@/components/studio/ServiceListManager";
import ModelLinkList from "@/components/studio/ModelLinkList";
import ModelOverview from "@/components/studio/ModelOverview";
import AiLogbook from "@/components/studio/AiLogbook";
import RequestLog from "@/components/studio/RequestLog";
import ExternalStudio from "@/components/studio/ExternalStudio";
import PromptGenerator from "@/components/studio/PromptGenerator";
import PromptSandbox from "@/components/studio/PromptSandbox";
import AssistantWizard from "@/components/studio/assistant/AssistantWizard";
import ConciergePanel from "@/components/studio/ConciergePanel";
import CameraSettings from "@/components/studio/CameraSettings";
import ReferenceModelManager from "@/components/studio/ReferenceModelManager";
import Mischpult from "@/components/charakter/Mischpult";
import StudioExportAll from "@/components/studio/StudioExportAll";

const personaLabel = (t) =>
  t === "SOLO_MALE" ? "Mann" : t === "COUPLE" ? "Paar" : t === "SHEMALE" ? "Shemale" : t === "GROUP" ? "Gruppe" : "Frau";

// Drei Blöcke statt einer langen Reihe: erstellen, erleben, einrichten.
const TAB_GROUPS = [
  {
    label: "Selbst erstellen",
    tabs: [
      { id: "assistant", label: "Assistent" },
      { id: "characters", label: "Charaktere" },
      { id: "vorbilder", label: "Vorbilder" },
      { id: "external", label: "Externes Studio" },
      { id: "dock", label: "Dockingstation" },
      { id: "baukasten", label: "Baukasten" },
      { id: "stimmkatalog", label: "Stimmkatalog" },
      { id: "voices", label: "Stimmbank" },
      { id: "voiceeditor", label: "Stimmen-Editor" },
      { id: "voiceprofiles", label: "Stimmen-Profile" },
      { id: "generator", label: "Generator" },
      { id: "promptgen", label: "Prompt-Generator" },
      { id: "sandbox", label: "Prompt-Sandbox" },
      { id: "bottraining", label: "Bot-Training" },
      { id: "concierge", label: "Concierge-Stimme" },
      { id: "content", label: "Inhalte & Preise" },
    ],
  },
  {
    label: "Erlebnis",
    tabs: [
      { id: "stories", label: "Storys" },
      { id: "topics", label: "Themen" },
      { id: "gallery", label: "Galerie" },
      { id: "plan", label: "Content-Planer" },
      { id: "requestlog", label: "Anfragen-Log" },
      { id: "live", label: "Live-Stream" },
      { id: "contests", label: "Wettbewerbe" },
    ],
  },
  {
    label: "Einrichten & Hilfe",
    tabs: [
      { id: "guide", label: "Anleitung" },
      { id: "sammel", label: "Sammel-Import" },
      { id: "harvestsandbox", label: "Import-Sandbox" },
      { id: "linkupload", label: "Link-Upload" },
      { id: "bulk", label: "Massen-Import" },
      { id: "services", label: "Dienste" },
      { id: "camera", label: "Kamera & Aufnahme" },
      { id: "modellinks", label: "Modell-Links" },
      { id: "overview", label: "Modell-Übersicht" },
      { id: "textmodels", label: "Text-KI" },
      { id: "videomodels", label: "Video-KI" },
      { id: "models", label: "Bild-KI" },
      { id: "logbook", label: "KI-Logbuch" },
      { id: "members", label: "Mitglieder" },
    ],
  },
];

export default function Studio() {
  const { toast } = useToast();
  const [tab, setTab] = useState("assistant");
  const synced = useRef(false); // Nachfassen läuft einmal pro Öffnen
  const [creators, setCreators] = useState([]);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | creator
  const [soundFor, setSoundFor] = useState(null); // Charakter, dessen Klang gerade offen ist
  const [imagesFor, setImagesFor] = useState(null); // Charakter, dessen Bilder gerade offen sind

  useEffect(() => { load(); }, []);

  // Nachfassen: was ein Charakter an Bildern schon hat, aber noch nicht in der
  // Galerie steht, kommt automatisch dazu.
  const syncGalleries = async (data) => {
    try {
      const added = await syncCreatorGalleries(data);
      if (added) {
        toast({ title: `${added} Bilder nachgetragen`, description: "Stehen jetzt in den Galerien der Profile." });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const load = async () => {
    try {
      const [data, v] = await Promise.all([
        base44.entities.Creator.list("-created_date"),
        base44.entities.Voice.list("-created_date"),
      ]);
      setCreators(data.sort((a, b) => (a.active === false ? 1 : 0) - (b.active === false ? 1 : 0)));
      setVoices(v);
      if (!synced.current) { synced.current = true; syncGalleries(data); }
    }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const remove = async (c) => {
    if (!window.confirm(`"${c.stageName}" wirklich löschen?`)) return;
    await base44.entities.Creator.delete(c.id);
    load();
  };

  const toggleActive = async (c) => {
    await base44.entities.Creator.update(c.id, { active: c.active === false });
    load();
  };

  // Ein Klick: derselbe Charakter einmal echt, einmal als Zeichentrickfigur.
  const toggleStyle = async (c) => {
    await base44.entities.Creator.update(c.id, { artStyle: c.artStyle === "CARTOON" ? "PHOTOREAL" : "CARTOON" });
    load();
  };

  // Klang am Charakter einstellen, ohne das Bearbeiten-Formular zu öffnen.
  const assignVoice = async (c, voiceId) => {
    await assignVoiceToCreator(c.id, voiceId, creators);
    setSoundFor((s) => (s && s.id === c.id ? { ...s, voiceProfileId: voiceId } : s));
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Studio</h1>
          <p className="text-muted-foreground text-sm">Verwalte Charaktere, Storys und Themen — alles selbst, ohne Umweg.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/creator-studio"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
          >
            <Maximize className="w-4 h-4" /> Eigene Studio-Seite
          </Link>
          <Link
            to="/erzaehler"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
          >
            <Users className="w-4 h-4" /> Erzähler-Studio
          </Link>
          <Link
            to="/anleitung"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
          >
            <BookOpen className="w-4 h-4" /> Anleitung: Modelle eintragen
          </Link>
          <StudioExportAll />
        </div>
      </div>

      <div className="mb-8">
        <Mischpult />
      </div>

      <div className="space-y-3 mb-8">
        {TAB_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="sm:w-44 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {group.tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-[15px] font-bold transition-colors whitespace-nowrap",
                    tab === t.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {tab === "assistant" && <AssistantWizard />}
      {tab === "guide" && <GuideManager />}
      {tab === "vorbilder" && <ReferenceModelManager />}
      {tab === "services" && <ServiceListManager />}
      {tab === "camera" && <CameraSettings />}
      {tab === "modellinks" && <ModelLinkList />}
      {tab === "overview" && <ModelOverview onOpenTab={setTab} />}
      {tab === "logbook" && <AiLogbook />}
      {tab === "dock" && <DockManager />}
      {tab === "stimmkatalog" && <Stimmkatalog onOpenTab={setTab} />}
      {tab === "voices" && <VoiceManager />}
      {tab === "voiceeditor" && (
        <div className="glass rounded-2xl border-2 border-border p-6">
          <p className="font-display text-2xl text-foreground">Stimmen-Editor</p>
          <p className="text-xs text-muted-foreground mb-5">
            Jeder Charakter mit seiner Stimme — darunter die Regler für Tonlage, Tempo und Intensität. Gilt sofort im Chat und in der Sitzung.
          </p>
          <VoiceByCharacter />
        </div>
      )}
      {tab === "voiceprofiles" && (
        <div className="glass rounded-2xl border-2 border-border p-6">
          <p className="font-display text-2xl text-foreground">Stimmen-Profile</p>
          <p className="text-xs text-muted-foreground mb-5">
            Für jede Figur ein eigener Klang. Beschreib ihn in Worten wie „tief", „hauchend" oder „schnell" — und hör ihn dir mit deinem Test-Schnipsel an.
          </p>
          <VoiceProfilesPanel />
        </div>
      )}
      {tab === "generator" && <GeneratorManager creators={creators} />}
      {tab === "models" && <ModelManager />}
      {tab === "textmodels" && <TextModelManager />}
      {tab === "videomodels" && <VideoModelManager />}
      {tab === "sammel" && (
        <SammelImport creators={creators} onOpenSandbox={() => setTab("harvestsandbox")} />
      )}
      {tab === "harvestsandbox" && <HarvestSandbox creators={creators} />}
      {tab === "linkupload" && <LinkUpload />}
      {tab === "bulk" && <BulkImport creators={creators} />}
      {tab === "promptgen" && <PromptGenerator />}
      {tab === "sandbox" && <PromptSandbox />}
      {tab === "bottraining" && <BotTrainingSandbox />}
      {tab === "concierge" && <ConciergePanel />}
      {tab === "plan" && (
        <div>
          <p className="font-display text-2xl text-foreground mb-1">Content-Planer</p>
          <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-3xl leading-relaxed">
            Links die Wünsche aus der Community, rechts dein Plan. Übernimm, was du machen willst — und mach daraus mit einem Klick einen Entwurf.
          </p>
          <PlanManager creators={creators} />
        </div>
      )}
      {tab === "gallery" && <GalleryManager creators={creators} />}
      {tab === "requestlog" && <RequestLog />}
      {tab === "stories" && <StoryManager creators={creators} />}
      {tab === "topics" && <TopicManager />}
      {tab === "content" && <ContentManager creators={creators} />}
      {tab === "live" && <LiveManager />}
      {tab === "contests" && <ContestManager />}
      {tab === "members" && <MemberManager />}

      {tab === "baukasten" && (
        <div className="glass rounded-2xl border-2 border-border p-6">
          <p className="font-display text-2xl text-foreground mb-2">Baukasten</p>
          <p className="text-[15px] font-semibold text-muted-foreground mb-4 max-w-2xl">
            Bausteine anlegen, zu Paketen zusammensetzen und andere nachbauen lassen — mit Situation,
            Varianten und der Sprechzeile dazu.
          </p>
          <Link
            to="/baukasten"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss"
          >
            Baukasten öffnen
          </Link>
        </div>
      )}

      {tab === "external" && <ExternalStudio onChanged={load} />}

      {tab === "characters" && (
      <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <CharacterTransfer creators={creators} onImported={load} />
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Neuer Charakter
        </button>
      </div>

      {editing && (
        <div className="mb-8">
          <CharacterForm
            initial={editing === "new" ? null : editing}
            onSaved={() => { setEditing(null); load(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {soundFor && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-card p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="font-display text-lg text-foreground">Klang von „{soundFor.stageName}“</p>
            <button onClick={() => setSoundFor(null)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              Schließen
            </button>
          </div>
          <CharacterVoiceBox value={soundFor.voiceProfileId || ""} onChange={(id) => assignVoice(soundFor, id)} />
          {(() => {
            const v = voices.find((x) => x.id === soundFor.voiceProfileId);
            if (!v) {
              return <p className="mt-3 text-xs text-muted-foreground">Erst eine Stimme wählen — danach kannst du Tonlage und Intensität hier direkt drehen.</p>;
            }
            return <VoiceTuner key={v.updated_date} voice={v} onSaved={load} />;
          })()}
        </div>
      )}

      {imagesFor && (
        <CharacterQuickImages
          key={imagesFor.id}
          creator={creators.find((c) => c.id === imagesFor.id) || imagesFor}
          onClose={() => setImagesFor(null)}
          onChanged={load}
        />
      )}

      {creators.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Noch keine Charaktere — leg deinen ersten an.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {creators.map((c) => (
            <div key={c.id} className={cn("rounded-2xl border border-border bg-card overflow-hidden", c.active === false && "opacity-60")}>
              <Link to={`/creator/${c.id}`} title="Profil ansehen" className="relative block aspect-[3/4] bg-elevated">
                {c.avatar ? (
                  <Image src={c.avatar} fittingType="fill" className={cn("w-full h-full transition-opacity hover:opacity-80", c.active === false && "grayscale")} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display text-3xl text-primary">{c.stageName[0]}</div>
                )}
                {c.featured && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">Featured</span>}
                {c.active === false && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-destructive text-white text-[10px] font-semibold uppercase">Inaktiv</span>}
                <span className={cn("absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase", c.artStyle === "CARTOON" ? "bg-violet-600 text-white" : "glass text-foreground")}>
                  {c.artStyle === "CARTOON" ? "Animiert" : "Foto"}
                </span>
              </Link>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{c.stageName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {personaLabel(c.personaType)} · {c.creatorCategory === "REAL" ? "Real" : "KI"}
                </p>
                <button
                  onClick={() => toggleActive(c)}
                  className={cn(
                    "w-full mt-3 px-3 py-2 rounded-full text-xs font-semibold transition-colors",
                    c.active === false
                      ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                      : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.active === false ? "Aktivieren" : "Deaktivieren"}
                </button>
                <button
                  onClick={() => toggleStyle(c)}
                  title="Diesen Charakter animiert (gezeichnet) anzeigen"
                  className={cn(
                    "w-full mt-2 px-3 py-2 rounded-full text-xs font-semibold transition-colors",
                    c.artStyle === "CARTOON"
                      ? "bg-violet-600/25 text-violet-300 hover:bg-violet-600/35"
                      : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.artStyle === "CARTOON" ? "Animiert ✓" : "Animiert"}
                </button>
                <button
                  onClick={() => { setSoundFor(soundFor?.id === c.id ? null : c); setImagesFor(null); }}
                  className={cn(
                    "w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors",
                    soundFor?.id === c.id ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary hover:bg-primary/25"
                  )}
                >
                  <Mic className="w-3.5 h-3.5" /> Klang & Stimme
                </button>
                <button
                  onClick={() => { setImagesFor(imagesFor?.id === c.id ? null : c); setSoundFor(null); }}
                  className={cn(
                    "w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors",
                    imagesFor?.id === c.id ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary hover:bg-primary/25"
                  )}
                >
                  <ImagePlus className="w-3.5 h-3.5" /> Bilder
                </button>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditing(c)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-elevated border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Bearbeiten
                  </button>
                  <button onClick={() => remove(c)} className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}