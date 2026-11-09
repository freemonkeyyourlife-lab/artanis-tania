import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { MessageSquare, Sparkles, ArrowRight, Crown, Bot, Calendar, Link2, CalendarRange, Receipt } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import PersonaCard from "@/components/PersonaCard";
import CharacterStoryCard from "@/components/CharacterStoryCard";
import ContentCard from "@/components/ContentCard";
import HeroCloud from "@/components/HeroCloud";
import HeroNews from "@/components/hero/HeroNews";
import HomeSearch from "@/components/home/HomeSearch";
import StartImagePicker from "@/components/home/StartImagePicker";
import AudioMoments from "@/components/home/AudioMoments";
import StartBackground from "@/components/home/StartBackground";
import BrandWordmark from "@/components/BrandWordmark";
import { Settings2 } from "lucide-react";
import RequestCard from "@/components/RequestCard";
import { useRequestVotes } from "@/hooks/useRequestVotes";
import { cn } from "@/lib/utils";

const HERO_BG = "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/9795fbefc_generated_image.png";

// Die Flanken oben — immer die echten Gesichter: Artanis, Tania und ihre
// gemeinsame Welt. Kein fremdes Modell, kein Testdummy.
// Die Mitte trägt das Paar, links und rechts stehen die beiden Einzelnen.
const HERO_ITEMS = [
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/6549e1153_Screenshot2026-09-28053726.png", title: "Privater Chat", text: "Schreib ihr direkt — sie antwortet dir", to: "/messages" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/dd71409ec_generated_image.png", title: "Tania", text: "Solo · Storytelling", to: "/" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/83f1549c6_Screenshot2026-09-091854361.png", title: "Artanis", text: "Solo · Interactive", to: "/" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/9795fbefc_generated_image.png", title: "Artanis × Tania", text: "Unser gemeinsames Profil", to: "/couple" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/99c4b7146_Screenshot2026-09-28084637.png", title: "Storys", text: "Geschichten aus ihrer Welt", to: "/stories" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/78af4f762_Screenshot2026-09-28034357.png", title: "Live / Online", text: "Wer gerade da ist", to: "/live" },
  { src: "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/dcbb95a47_Screenshot2026-09-28051650.png", title: "Wettbewerbe", text: "Mitmachen, abstimmen, gewinnen", to: "/contests" },
];

// Frische Motive für die Teaser oben — Bilder, die noch niemand gesehen hat.
const TEASER_IMAGES = [
  "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/b80095c82_generated_image.png",
  "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/4aa1b2f57_generated_image.png",
  "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/0097a75a2_generated_image.png",
];

const FEED_FILTERS = ["Alle", "Solo Artanis", "Solo Tania", "Paar", "Interaktive Storys", "Themen"];

export default function Home() {
  const [creators, setCreators] = useState([]);
  const [content, setContent] = useState([]);
  const [requests, setRequests] = useState([]);
  const [topics, setTopics] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Alle");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userPref, setUserPref] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { userId, vote } = useRequestVotes();

  useEffect(() => { loadData(); }, []);

  // Admin-Prüfung und persönliche Startbilder des Nutzers laden.
  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setIsAdmin(u?.role === "admin");
      if (!u) return;
      try {
        const prefs = await base44.entities.UserPreference.filter({ userId: u.id }, "-created_date", 5);
        if (prefs[0]) setUserPref(prefs[0]);
      } catch (e) { /* noch keine Preferences */ }
    }).catch(() => setIsAdmin(false));
  }, []);

  // Eine Stimme für einen Community-Wunsch — zählt genau einmal pro Person.
  const voteRequest = async (request) => {
    const updated = await vote(request);
    if (updated) setRequests((prev) => prev.map((r) => (r.id === request.id ? updated : r)));
  };

  const loadData = async () => {
    try {
      const [creatorData, contentData, requestData, topicData, expData, storyData] = await Promise.all([
        base44.entities.Creator.list(),
        base44.entities.Content.filter({ published: true }, "-created_date", 50),
        base44.entities.CommunityRequest.list("-votes", 10),
        base44.entities.Topic.list(),
        base44.entities.Experience.filter({ published: true }, "-created_date", 10),
        base44.entities.Story.filter({ published: true }, "-created_date", 6),
      ]);
      setCreators(creatorData);
      setContent(contentData);
      setRequests(requestData);
      setTopics(topicData);
      setExperiences(expData);
      setStories(storyData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const realCreators = creators.filter(c => c.creatorCategory === "REAL" && c.active !== false);
  // Nur was sich zeigen lässt: KI-Charaktere mit Bild UND Geschichte.
  const aiCharacters = creators.filter(
    c => c.creatorCategory === "AI_MODEL" && c.active !== false && c.avatar && (c.shortStory || c.bio)
  );
  const artanis = creators.find(c => c.stageName === "Artanis");
  const tania = creators.find(c => c.stageName === "Tania");
  const couple = creators.find(c => c.stageName === "Artanis × Tania");
  const spotlight = artanis || tania || creators[0];
  const latestContent = content.slice(0, 6);

  // Was oben durchläuft: abwechselnd eine interaktive Szene und eine Story.
  const news = [
    ...experiences.slice(0, 3).map((e) => ({
      id: `exp-${e.id}`,
      image: e.cover || TEASER_IMAGES[0],
      kicker: "Interactive",
      title: e.title,
      hook: e.creatorName ? `Willst du sehen, wie ${e.creatorName} das gemacht hat?` : "Willst du mehr erfahren?",
      text: e.description,
      cta: "Szene spielen",
      to: `/experience/${e.id}`,
    })),
    ...stories.slice(0, 3).map((s) => {
      const c = creators.find((x) => x.stageName === s.creatorName);
      return {
        id: `story-${s.id}`,
        image: c?.banner || c?.avatar || TEASER_IMAGES[1],
        kicker: "Story",
        title: s.title,
        hook: "Willst du mehr erfahren?",
        text: s.preview,
        cta: "Story öffnen",
        to: "/stories",
      };
    }),
  ];
  const newsFallback = [
    { id: "fb-1", image: TEASER_IMAGES[0], kicker: "Interactive", title: "Spiel eine Szene durch", hook: "Willst du sehen, wie es läuft?", text: "Wähle deinen Weg und entscheide, was als Nächstes passiert.", cta: "Szene spielen", to: "/interactive" },
    { id: "fb-2", image: TEASER_IMAGES[1], kicker: "Story", title: "Neue Storys", hook: "Willst du mehr erfahren?", text: "Geschichten aus ihrer Welt — lang, ausführlich, nur für dich.", cta: "Story öffnen", to: "/stories" },
    { id: "fb-3", image: TEASER_IMAGES[2], kicker: "Chat", title: "Schreib ihr direkt", hook: "Willst du sie kennenlernen?", text: "Sie antwortet, schickt Bilder und geht auf dich ein.", cta: "Chat starten", to: "/messages" },
  ];
  const newsItems = news.length ? news : newsFallback;

  // Persönliche Startbilder des Nutzers — falls vorhanden, ersetzen sie die
  // Standard-Hero-Bilder. Sonst gelten die festen HERO_ITEMS.
  const heroItems = userPref?.startImages?.length
    ? userPref.startImages.map((img, i) => ({ src: img.src, title: img.title || `Mein Bild ${i + 1}`, text: "", to: "/" }))
    : HERO_ITEMS;

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[860px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image src={HERO_BG} fittingType="fill" className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-transparent to-transparent" />
        </div>

        <StartBackground images={userPref?.startImages} />

        <HeroCloud items={heroItems} />
        {/* Die Bilder lösen sich nach oben und unten in den Hintergrund auf — keine harten Kanten. */}
        <div className="absolute inset-x-0 top-0 h-[150px] z-20 pointer-events-none bg-gradient-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 top-0 h-[470px] z-20 pointer-events-none bg-gradient-to-b from-transparent via-background/20 to-background" />

        {/* Schriftzug links, die Storys rutschen rechts daneben herein. */}
        <div className="relative z-30 min-h-[860px] max-w-[1600px] mx-auto px-4 lg:px-8 pointer-events-none [&>*]:pointer-events-auto flex flex-col justify-end pt-[260px] lg:pt-[320px] pb-20">
          <div className="flex flex-col lg:flex-row lg:items-end gap-10 lg:gap-16">
            <div className="flex-1 min-w-0">
              {spotlight && (
                <div className="mb-6">
                  <StatusBadge status={spotlight.onlineStatus} />
                </div>
              )}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[64px] leading-[1.05] text-foreground">
                <BrandWordmark />
                <span className="block text-gradient-warm mt-2">Interaktives Archiv</span>
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base mt-4 max-w-xl">
                Exklusive Inhalte, interaktive Szenen und private Stunden — von Artanis, Tania und ihrer gemeinsamen Welt.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/explore" className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass-btn glass-btn-accent text-sm font-semibold text-gloss">
                  Entdecken <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/live" className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass-btn text-foreground text-sm font-semibold text-gloss">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live / Online
                </Link>
                <Link to="/interactive" className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass-btn text-foreground text-sm font-semibold text-gloss">
                  <Sparkles className="w-4 h-4 text-primary" /> Interaktive Szene
                </Link>
                <Link to="/messages" className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass-btn text-foreground text-sm font-semibold text-gloss">
                  <MessageSquare className="w-4 h-4" /> Privater Chat
                </Link>
                {userId && (
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass-btn text-foreground text-sm font-semibold text-gloss"
                  >
                    <Settings2 className="w-4 h-4 text-primary" /> Meine Startbilder
                  </button>
                )}
              </div>

              <div className="mt-6">
                <HomeSearch
                  isOwner={isAdmin}
                  creators={creators}
                  content={content}
                  stories={stories}
                  topics={topics}
                />
              </div>
            </div>

            <div className="w-full lg:w-[440px] flex-shrink-0">
              <HeroNews items={newsItems} />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Feed Selector */}
      <section className="sticky top-[72px] z-30 glass border-y border-border">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {FEED_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-[15px] font-bold whitespace-nowrap transition-colors text-gloss",
                  activeFilter === filter ? "glass-btn glass-btn-accent" : "glass-btn text-foreground"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-12">
            {/* Featured Personas */}
            <div>
              <h2 className="font-display text-2xl text-foreground mb-4">Meine Charaktere</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {artanis && <PersonaCard creator={artanis} />}
                {tania && <PersonaCard creator={tania} />}
                {couple && <PersonaCard creator={couple} />}
              </div>
            </div>

            {/* AI Characters */}
            {aiCharacters.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-display text-2xl text-foreground">KI-Charaktere</h2>
                  <span className="px-2 py-0.5 rounded-full bg-violet-600/90 text-white text-[10px] font-semibold uppercase">KI-Modelle</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Jeder Charakter mit seiner Geschichte — lies die Kurzfassung und klapp die ganze auf, wenn du mehr wissen willst.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {aiCharacters.map(c => (
                    <CharacterStoryCard key={c.id} creator={c} to="/messages" />
                  ))}
                </div>
              </div>
            )}

            {/* Latest Releases */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl text-foreground">Neueste Inhalte</h2>
                <Link to="/explore" className="text-sm text-primary hover:underline">Alle ansehen</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {latestContent.map((item) => (
                  <ContentCard key={item.id} content={item} />
                ))}
                {latestContent.length === 0 && !loading && (
                  <p className="text-muted-foreground col-span-full text-center py-12">Noch keine Inhalte</p>
                )}
              </div>
            </div>

            {/* Audio-Momente */}
            <AudioMoments />

            {/* Interactive Experiences */}
            {experiences.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl text-foreground">Interaktive Szenen</h2>
                  <Link to="/interactive" className="text-sm text-primary hover:underline">Alle ansehen</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {experiences.map((exp) => (
                    <Link key={exp.id} to="/interactive" className="group">
                      <div className="relative overflow-hidden rounded-2xl border border-border bg-card aspect-video">
                        {exp.cover && <Image src={exp.cover} fittingType="fill" className="w-full h-full" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <StatusBadge experienceType={exp.experienceType} />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="font-display text-lg text-foreground">{exp.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Community Requests */}
            {requests.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl text-foreground">Wünsche der Community</h2>
                  <Link to="/request" className="text-sm text-primary hover:underline">Wunsch einreichen</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {requests.slice(0, 6).map((req) => (
                    <RequestCard key={req.id} request={req} currentUserId={userId} onVote={voteRequest} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side Rail */}
          <div className="lg:col-span-4 space-y-6">
            {/* AI Assistant */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground">KI-Assistenz</h3>
                  <p className="text-xs text-muted-foreground">Immer erreichbar</p>
                </div>
                <StatusBadge experienceType="AI_INTERACTIVE" className="ml-auto" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Frag nach Inhalten, Themen oder Storys — oder buche eine private Stunde.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Story empfehlen", "Was ist neu?", "Inhalte finden", "Stunde buchen"].map((prompt) => (
                  <Link key={prompt} to="/messages" className="px-3 py-1.5 rounded-full glass-btn text-xs text-foreground">
                    {prompt}
                  </Link>
                ))}
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Nächste Termine
              </h3>
              <div className="space-y-3">
                {[
                  { creator: "Artanis", title: "Abendliche Szene", time: "Heute 21:00", type: "PRERECORDED_INTERACTIVE" },
                  { creator: "Tania", title: "Solo-Storyzeit", time: "Morgen 20:00", type: "AI_INTERACTIVE" },
                  { creator: "Paar", title: "Freitagnacht live", time: "Fr 22:00", type: "LIVE" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-elevated">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.creator} · {s.time}</p>
                    </div>
                    <StatusBadge experienceType={s.type} />
                  </div>
                ))}
              </div>
            </div>

            {/* Room Invite */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display text-lg text-foreground mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" /> Privater Raum
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Erzeuge einen privaten Raumlink, der nur für Eingeladene gilt.</p>
              <Link to="/admin" className="block w-full py-2.5 rounded-full glass-btn glass-btn-accent text-sm font-semibold text-center text-gloss">
                Raumlink erstellen
              </Link>
            </div>

            {/* Besitzer-Werkzeuge — dieselben Ansichten wie im Studio und in der Konsole. */}
            {isAdmin && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-lg text-foreground mb-4">Werkzeuge</h3>
                <div className="space-y-3">
                  <Link to="/studio" className="flex items-center gap-3 p-3 rounded-xl bg-elevated hover:bg-popover transition-colors">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Sag was du willst 2.0</p>
                      <p className="text-[11px] text-muted-foreground">Import, Bilder, Stimme und Prompt in einem Zug</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                  <Link to="/planung" className="flex items-center gap-3 p-3 rounded-xl bg-elevated hover:bg-popover transition-colors">
                    <CalendarRange className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Content-Planer</p>
                      <p className="text-[11px] text-muted-foreground">Wünsche in den Plan übernehmen</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                  <Link to="/verkauf" className="flex items-center gap-3 p-3 rounded-xl bg-elevated hover:bg-popover transition-colors">
                    <Receipt className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Verkaufs-Dashboard</p>
                      <p className="text-[11px] text-muted-foreground">Umsatz, offene Beträge und Abos</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                </div>
              </div>
            )}

            {/* Topics */}
            {topics.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-lg text-foreground mb-4">Themen</h3>
                <div className="flex flex-wrap gap-2">
                  {topics.slice(0, 12).map((topic) => (
                    <span key={topic.id} className="px-3 py-1.5 rounded-full glass border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer">
                      {topic.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* VIP */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5 accent-glow">
              <Crown className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-display text-lg text-foreground mb-2">VIP-Zugang</h3>
              <p className="text-sm text-muted-foreground mb-4">Exklusive Inhalte, private Räume, bevorzugte Wünsche und früher Zugang.</p>
              <Link to="/account" className="block w-full py-2.5 rounded-full glass-btn glass-btn-accent text-sm font-semibold text-center text-gloss">
                VIP werden
              </Link>
            </div>
          </div>
        </div>
      </section>

      {pickerOpen && (
        <StartImagePicker
          userId={userId}
          prefId={userPref?.id}
          current={userPref?.startImages || []}
          onSaved={(imgs) => {
            setUserPref((prev) => ({ ...(prev || { userId }), startImages: imgs }));
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}