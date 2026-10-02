import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Search, MessageSquare, User, Home, Sparkles, Library, Menu, X, ShieldCheck, ArrowLeft, LogOut, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import HeaderNav, { buildNavGroups } from "@/components/nav/HeaderNav";
import { base44 } from "@/api/base44Client";
import InviteShareButton from "@/components/InviteShareButton";
import { hasProAccess, localProActive } from "@/lib/proAccess";
import { ownerHeartbeat, HEARTBEAT_MS } from "@/lib/presence";
import { getViewAs, setViewAs, subscribeViewAs } from "@/lib/viewAs";
import { loadLayout, layoutFont } from "@/lib/siteLayout";
import { structureOf, structureGroups } from "@/lib/siteStructure";
import BackgroundSlideshow from "@/components/BackgroundSlideshow";
import InfoModeToggle from "@/components/InfoModeToggle";
import WishButton from "@/components/wish/WishButton";
import HelpAssistant from "@/components/help/HelpAssistant";
import { useCallSession } from "@/lib/CallContext";
import { getRooms } from "@/lib/callRooms";
import { publicName } from "@/lib/displayName";

const MORE_LINKS = [
  { label: "Dockingstation", path: "/dock" },
  { label: "Kasse", path: "/paylinks" },
  { label: "Sprechstunde", path: "/therapy" },
  { label: "Wünsche", path: "/request" },
  { label: "Entdecken", path: "/explore" },
  { label: "Videos", path: "/videos" },
  { label: "Fotos", path: "/photos" },
  { label: "Storys", path: "/stories" },
  { label: "Themen", path: "/topics" },
  { label: "Live", path: "/live" },
  { label: "Interaktiv", path: "/interactive" },
  { label: "Gruppen", path: "/groups" },
  { label: "Community", path: "/community" },
  { label: "Börse", path: "/coins" },
  { label: "Bibliothek", path: "/library" },
];

const MOBILE_NAV = [
  { icon: Home, label: "Start", path: "/" },
  { icon: Sparkles, label: "Interaktiv", path: "/interactive" },
  { icon: MessageSquare, label: "Chat", path: "/messages" },
  { icon: Library, label: "Bibliothek", path: "/library" },
  { icon: User, label: "Profil", path: "/profile" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [memberStatus, setMemberStatus] = useState(null);
  const [viewAs, setViewAsState] = useState(null);
  const [incomingCount, setIncomingCount] = useState(0);
  const [waitingChats, setWaitingChats] = useState(0);
  const [layout, setLayout] = useState(null);
  // Der Call ist von jeder Seite aus erreichbar — und läuft weiter, wenn du
  // weiterklickst.
  const { session, joined, start } = useCallSession();
  const callRunning = joined && !!session;
  // Der Call ist ein Teil von dem, was du gerade machst: Er startet klein in der
  // Ecke und läuft mit — statt dich aus der Seite zu werfen.
  const openCall = () => {
    if (callRunning) { navigate(`/call/${session.token}?r=${session.roomNumber || 1}`); return; }
    const room = getRooms()[0];
    start({ token: room.token, roomNumber: room.number, name: publicName(me, "Ich") });
  };

  // Der Besitzer legt Reihenfolge, Schrift und ausgeblendete Punkte fest.
  useEffect(() => {
    loadLayout().then(setLayout).catch(() => setLayout(null));
  }, []);

  // Wird die Reihenfolge neu geordnet, holt die Kopfzeile sie sich sofort neu.
  useEffect(() => {
    const reload = () => loadLayout().then(setLayout).catch(() => {});
    window.addEventListener("artanis:layout-changed", reload);
    return () => window.removeEventListener("artanis:layout-changed", reload);
  }, []);

  // Testansicht: du schaust dir die App gerade als ein anderer Nutzer an.
  useEffect(() => {
    setViewAsState(getViewAs());
    return subscribeViewAs(() => setViewAsState(getViewAs()));
  }, []);

  useEffect(() => {
    base44.auth.me()
      .then((user) => {
        setMe(user);
        setMemberStatus(user?.role === "admin" ? "OWNER" : hasProAccess(user) ? "GOLD" : (user?.memberStatus || "STANDARD"));
      })
      .catch(() => setMemberStatus(localProActive() ? "GOLD" : "STANDARD"));
  }, []);

  // Leute, die mit dir chatten wollen — sichtbar am Messages-Symbol.
  useEffect(() => {
    let unsubscribe;
    let timer;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me) return;
        const load = async () => {
          try {
            const convs = await base44.entities.Conversation.filter({ participantId: me.id, conversationType: "HUMAN" });
            setIncomingCount(convs.length);
          } catch (e) { /* kurz nicht erreichbar — nächster Versuch später */ }
          if (me.role === "admin") {
            try {
              const chats = await base44.entities.Conversation.filter({ conversationType: "AI" }, "-lastMessageAt", 100);
              setWaitingChats(chats.filter((c) => c.waitingSince).length);
            } catch (e) { /* kurz nicht erreichbar — nächster Versuch später */ }
          }
        };
        await load();
        // Ereignisse sammeln: höchstens eine Abfrage alle paar Sekunden.
        unsubscribe = base44.entities.Conversation.subscribe(() => {
          clearTimeout(timer);
          timer = setTimeout(load, 5000);
        });
      } catch (e) { /* nicht angemeldet */ }
    })();
    return () => { clearTimeout(timer); unsubscribe?.(); };
  }, []);

  // Lebenszeichen: solange dein Fenster offen ist, weiß die App, dass du da bist.
  // Bist du weg, springt die KI in den Gäste-Chats sofort ein.
  useEffect(() => {
    let id;
    let cancelled = false;
    (async () => {
      const me = await base44.auth.me().catch(() => null);
      if (!me || me.role !== "admin") return;
      const tick = () => { if (!cancelled) ownerHeartbeat(); };
      tick();
      id = setInterval(tick, HEARTBEAT_MS);
    })();
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Die Kopfzeile zeigt genau die Struktur, die der Besitzer in der Übersicht
  // festgelegt hat — Bereiche und Knöpfe in seiner Reihenfolge.
  const groups = layout ? structureGroups(structureOf(layout)) : buildNavGroups(MORE_LINKS);
  const mobileLinks = groups.flatMap((g) => g.items);
  const navFont = layoutFont(layout);

  return (
    <div className="min-h-screen bg-background">
      <BackgroundSlideshow />
      <header className="fixed top-0 left-0 right-0 z-50 glass-milky" style={{ height: "72px" }}>
        <div className="h-full max-w-[1600px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/">
              <span className="font-display text-lg lg:text-xl font-extrabold text-foreground tracking-wide text-gloss">
                ARTANIS <span className="text-primary">×</span> TRIANIA
              </span>
            </Link>
            {memberStatus === "GOLD" && (
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider">Gold</span>
            )}
            {viewAs && (
              <button
                onClick={() => setViewAs(null)}
                title="Testansicht beenden — zurück zu dir"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full glass-btn text-[11px] font-bold text-amber-300 whitespace-nowrap"
              >
                Blick als: {viewAs.name} · {viewAs.memberStatus === "GOLD" ? "Gold" : "Standard"}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <HeaderNav groups={groups} font={navFont} waitingChats={waitingChats} />

          <div className="flex items-center gap-2 lg:gap-3">
            {location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                title="Zurück"
                className="w-9 h-9 rounded-full glass-btn flex items-center justify-center hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <WishButton />
            <InfoModeToggle />
            <button
              onClick={openCall}
              title={callRunning ? "Zurück in den laufenden Video-Call" : "Video-Call starten"}
              className={cn("relative w-9 h-9 rounded-full glass-btn flex items-center justify-center transition-colors", callRunning ? "text-primary" : "hover:text-primary")}
            >
              <Video className="w-4 h-4" />
              {callRunning && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500" />}
            </button>
            <InviteShareButton className="hidden sm:flex" />
            <span title="Suche folgt in Kürze" className="w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground/40 cursor-not-allowed">
              <Search className="w-4 h-4" />
            </span>
            <Link to="/messages" title={incomingCount > 0 ? `${incomingCount} wollen mit dir chatten` : "Messages"} className="hidden sm:flex w-9 h-9 rounded-full glass-btn items-center justify-center hover:text-primary transition-colors relative">
              <MessageSquare className="w-4 h-4" />
              {incomingCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{incomingCount}</span>
              )}
            </Link>
            <Link
              to="/account"
              title="Mein Konto"
              className="hidden lg:flex items-center gap-2.5 pl-1.5 pr-4 py-1 rounded-full glass-btn hover:text-primary transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-primary/25 flex items-center justify-center font-display text-primary text-xs flex-shrink-0">
                {(viewAs?.name || me?.full_name || me?.email || "?").charAt(0).toUpperCase()}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[13px] font-bold text-foreground max-w-[150px] truncate">
                  {viewAs?.name || me?.full_name || me?.email || "Mein Konto"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {viewAs
                    ? (viewAs.memberStatus === "GOLD" ? "Gold · alles frei" : "Standard")
                    : memberStatus === "OWNER" ? "Besitzer · God Mode" : memberStatus === "GOLD" ? "Gold · alles frei" : "Standard"}
                </span>
              </span>
            </Link>
            <Link to="/account" className="lg:hidden w-9 h-9 rounded-full glass-btn flex items-center justify-center hover:text-primary transition-colors">
              <User className="w-4 h-4" />
            </Link>
            <button
              onClick={() => base44.auth.logout("/")}
              title="Abmelden"
              className="w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-full glass-btn flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <HelpAssistant />
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 glass-strong border-b border-border/30 p-4">
            <nav className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
              {mobileLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium",
                    location.pathname === link.path ? "text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                  {link.path === "/leitstand" && waitingChats > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{waitingChats}</span>
                  )}
                </Link>
              ))}
              <WishButton className="w-full justify-center py-3 text-[15px] my-1" />
              <InviteShareButton className="w-full justify-center py-3 text-sm my-1" />
              <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground">
                Account
              </Link>
              <button onClick={() => base44.auth.logout("/")} className="text-left px-4 py-3 rounded-xl text-sm font-medium text-destructive">
                Abmelden
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10 pt-[72px] pb-24 lg:pb-0">
        <Outlet />
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="glass-strong rounded-full border border-border/40 flex items-center justify-around py-2 px-2 max-w-md mx-auto">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.path === "/messages" && incomingCount > 0 && (
                  <span className="absolute top-0 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{incomingCount}</span>
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}