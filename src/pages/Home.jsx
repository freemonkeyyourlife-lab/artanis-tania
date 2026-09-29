import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { MessageSquare, Sparkles, ArrowRight, Crown, Bot, Calendar, Link2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import PersonaCard from "@/components/PersonaCard";
import ContentCard from "@/components/ContentCard";
import HeroCloud from "@/components/HeroCloud";
import HeroNews from "@/components/hero/HeroNews";
import RequestCard from "@/components/RequestCard";
import { cn } from "@/lib/utils";

const HERO_BG = "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/36d23e21f_generated_image.png";

// Die Wolke oben — Artemis & Artemia als Banner in der Mitte, die anderen drumherum.
const HERO_CLOUD = [
  "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/6549e1153_Screenshot2026-09-28053726.png",
  "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/ce1725bdf_Screenshot2026-09-28050434.png",
  "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/99c4b7146_Screenshot2026-09-28084637.png",
  "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/021e28b6a_825292887_1624149129493507_2639521819362873359_n.webp",
  "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/78af4f762_Screenshot2026-09-28034357.png",
  "https://media.base44.com/images/public/6aaaf0f2a95eaf5ac21b377f/dcbb95a47_Screenshot2026-09-28051650.png",
];

const FEED_FILTERS = ["All", "Solo Artanis", "Solo Triania", "Couple", "Interactive Stories", "Topics"];

export default function Home() {
  const [creators, setCreators] = useState([]);
  const [content, setContent] = useState([]);
  const [requests, setRequests] = useState([]);
  const [topics, setTopics] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => { loadData(); }, []);

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
  const aiCharacters = creators.filter(c => c.creatorCategory === "AI_MODEL" && c.stageName !== "Testdummy" && c.active !== false);
  const artanis = creators.find(c => c.stageName === "Artanis");
  const triania = creators.find(c => c.stageName === "Triania");
  const couple = creators.find(c => c.stageName === "Artanis × Triania");
  const spotlight = artanis || triania || creators[0];
  const latestContent = content.slice(0, 6);

  // Was oben durchläuft: abwechselnd eine interaktive Szene und eine Story.
  const news = [
    ...experiences.slice(0, 3).map((e) => ({
      id: `exp-${e.id}`,
      image: e.cover || HERO_CLOUD[0],
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
        image: c?.banner || c?.avatar || HERO_CLOUD[2],
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
    { id: "fb-1", image: HERO_CLOUD[1], kicker: "Interactive", title: "Spiel eine Szene durch", hook: "Willst du sehen, wie es läuft?", text: "Wähle deinen Weg und entscheide, was als Nächstes passiert.", cta: "Szene spielen", to: "/interactive" },
    { id: "fb-2", image: HERO_CLOUD[3], kicker: "Story", title: "Neue Storys", hook: "Willst du mehr erfahren?", text: "Geschichten aus ihrer Welt — lang, ausführlich, nur für dich.", cta: "Story öffnen", to: "/stories" },
    { id: "fb-3", image: HERO_CLOUD[4], kicker: "Chat", title: "Schreib ihr direkt", hook: "Willst du sie kennenlernen?", text: "Sie antwortet, schickt Bilder und geht auf dich ein.", cta: "Chat starten", to: "/messages" },
  ];
  const newsItems = news.length ? news : newsFallback;

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[860px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image src={HERO_BG} fittingType="fill" className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-transparent to-transparent" />
        </div>

        <HeroCloud images={HERO_CLOUD} />
        {/* Die Bilder lösen sich nach unten in den Hintergrund auf — keine harten Kanten. */}
        <div className="absolute inset-x-0 top-0 h-[470px] z-20 pointer-events-none bg-gradient-to-b from-transparent via-background/25 to-background" />

        <div className="relative z-30 min-h-[860px] max-w-[1600px] mx-auto px-4 lg:px-8 flex flex-col justify-end pt-[260px] lg:pt-[320px] pb-20">
          <div className="mb-10">
            <HeroNews items={newsItems} />
          </div>

          {spotlight && (
            <div className="mb-6">
              <StatusBadge status={spotlight.onlineStatus} />
            </div>
          )}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] leading-[1.1] text-foreground max-w-3xl">
            ARTANIS × TRIANIA
            <span className="block text-gradient-warm mt-2">Private Interactive Archive</span>
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base mt-4 max-w-xl">
            Exclusive content, interactive experiences, and private sessions from Artanis, Triania, and their shared world.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/explore" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:accent-glow-strong transition-all">
              Explore <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/live" className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass border border-border text-foreground text-sm font-semibold hover:border-primary/30 transition-all">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live / Online
            </Link>
            <Link to="/interactive" className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass border border-border text-foreground text-sm font-semibold hover:border-primary/30 transition-all">
              <Sparkles className="w-4 h-4 text-primary" /> Interactive Experience
            </Link>
            <Link to="/messages" className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass border border-border text-foreground text-sm font-semibold hover:border-primary/30 transition-all">
              <MessageSquare className="w-4 h-4" /> Private Chat
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Feed Selector */}
      <section className="sticky top-[72px] z-30 glass border-y border-border">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FEED_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors",
                  activeFilter === filter ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
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
              <h2 className="font-display text-2xl text-foreground mb-4">Featured Personas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {artanis && <PersonaCard creator={artanis} />}
                {triania && <PersonaCard creator={triania} />}
                {couple && <PersonaCard creator={couple} />}
              </div>
            </div>

            {/* AI Characters */}
            {aiCharacters.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-display text-2xl text-foreground">AI Characters</h2>
                  <span className="px-2 py-0.5 rounded-full bg-violet-600/90 text-white text-[10px] font-semibold uppercase">KI-Modelle</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">KI-Modelle auf Basis echter Charaktere — schreibe eigene Szenarien oder spiele welche durch</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {aiCharacters.map(c => (
                    <Link key={c.id} to="/messages" className="group">
                      <div className="relative overflow-hidden rounded-2xl border border-border bg-card aspect-[3/4]">
                        {c.avatar ? <Image src={c.avatar} fittingType="fill" className="w-full h-full group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full bg-elevated" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                        <div className="absolute top-2 right-2"><span className="px-2 py-0.5 rounded-full bg-violet-600/90 text-white text-[10px] font-semibold tracking-wider uppercase">KI</span></div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="font-display text-sm text-foreground">{c.stageName}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{c.tagline}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Releases */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl text-foreground">Latest Releases</h2>
                <Link to="/explore" className="text-sm text-primary hover:underline">View all</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {latestContent.map((item) => (
                  <ContentCard key={item.id} content={item} />
                ))}
                {latestContent.length === 0 && !loading && (
                  <p className="text-muted-foreground col-span-full text-center py-12">No content yet</p>
                )}
              </div>
            </div>

            {/* Interactive Experiences */}
            {experiences.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl text-foreground">Interactive Experiences</h2>
                  <Link to="/interactive" className="text-sm text-primary hover:underline">View all</Link>
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
                  <h2 className="font-display text-2xl text-foreground">Community Requests</h2>
                  <Link to="/request" className="text-sm text-primary hover:underline">Submit a request</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {requests.slice(0, 6).map((req) => (
                    <RequestCard key={req.id} request={req} />
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
                  <h3 className="font-display text-lg text-foreground">AI Assistant</h3>
                  <p className="text-xs text-muted-foreground">Always available</p>
                </div>
                <StatusBadge experienceType="AI_INTERACTIVE" className="ml-auto" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Ask about content, topics, stories, or request a private session.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Recommend a story", "What's new?", "Find content", "Book a session"].map((prompt) => (
                  <Link key={prompt} to="/messages" className="px-3 py-1.5 rounded-full glass border border-border text-xs text-foreground hover:border-primary/30 transition-colors">
                    {prompt}
                  </Link>
                ))}
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Upcoming Sessions
              </h3>
              <div className="space-y-3">
                {[
                  { creator: "Artanis", title: "Evening Interactive", time: "Today 21:00", type: "PRERECORDED_INTERACTIVE" },
                  { creator: "Triania", title: "Solo Storytime", time: "Tomorrow 20:00", type: "AI_INTERACTIVE" },
                  { creator: "Couple", title: "Friday Night Live", time: "Fri 22:00", type: "LIVE" },
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
                <Link2 className="w-4 h-4 text-primary" /> Private Room
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Generate an invite-only private room link.</p>
              <Link to="/admin" className="block w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold text-center hover:accent-glow transition-all">
                Create Room Link
              </Link>
            </div>

            {/* Topics */}
            {topics.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-lg text-foreground mb-4">Topics</h3>
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
              <h3 className="font-display text-lg text-foreground mb-2">VIP Access</h3>
              <p className="text-sm text-muted-foreground mb-4">Exclusive content, private rooms, priority requests, and early access.</p>
              <Link to="/account" className="block w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold text-center hover:accent-glow-strong transition-all">
                Become VIP
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}