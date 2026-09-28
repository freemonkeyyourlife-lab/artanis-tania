import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Search, MessageSquare, User, Home, Sparkles, Library, Menu, X, ShieldCheck, ArrowLeft, LogOut, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import InviteShareButton from "@/components/InviteShareButton";
import { hasProAccess, localProActive } from "@/lib/proAccess";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Messages", path: "/messages" },
  { label: "Wettbewerbe", path: "/contests" },
  { label: "Profile", path: "/profile" },
  { label: "Admin", path: "/admin" },
  { label: "Studio", path: "/studio" },
  { label: "Leitstand", path: "/leitstand" },
];

const PERSONA_LINKS = [
  { label: "Artanis", path: "/artanis" },
  { label: "Triania", path: "/triania" },
  { label: "Couple", path: "/couple" },
];

const MORE_LINKS = [
  { label: "Sprechstunde", path: "/therapy" },
  { label: "Request", path: "/request" },
  { label: "Explore", path: "/explore" },
  { label: "Videos", path: "/videos" },
  { label: "Photos", path: "/photos" },
  { label: "Stories", path: "/stories" },
  { label: "Topics", path: "/topics" },
  { label: "Live", path: "/live" },
  { label: "Interactive", path: "/interactive" },
  { label: "Groups", path: "/groups" },
  { label: "Community", path: "/community" },
  { label: "Börse", path: "/coins" },
  { label: "Library", path: "/library" },
];

const MOBILE_LINKS = [
  { label: "Home", path: "/" },
  ...PERSONA_LINKS,
  ...NAV_LINKS.slice(1),
  ...MORE_LINKS,
];

const MOBILE_NAV = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Sparkles, label: "Interactive", path: "/interactive" },
  { icon: MessageSquare, label: "Chat", path: "/messages" },
  { icon: Library, label: "Library", path: "/library" },
  { icon: User, label: "Profile", path: "/profile" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [memberStatus, setMemberStatus] = useState(null);
  const [incomingCount, setIncomingCount] = useState(0);
  const [waitingChats, setWaitingChats] = useState(0);

  useEffect(() => {
    base44.auth.me()
      .then((me) => setMemberStatus(hasProAccess(me) ? "GOLD" : (me?.memberStatus || "STANDARD")))
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

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border" style={{ height: "72px" }}>
        <div className="h-full max-w-[1600px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/">
              <span className="font-display text-lg lg:text-xl text-foreground tracking-wide">
                ARTANIS <span className="text-primary">×</span> TRIANIA
              </span>
            </Link>
            {memberStatus === "GOLD" && (
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider">Gold</span>
            )}
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {[NAV_LINKS[0]].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-2.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors",
                  location.pathname === link.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "px-2.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                    PERSONA_LINKS.some((l) => l.path === location.pathname) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Personen <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="glass-strong border-border">
                {PERSONA_LINKS.map((l) => (
                  <DropdownMenuItem key={l.path} asChild>
                    <Link to={l.path} className="text-sm cursor-pointer">{l.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {NAV_LINKS.slice(1, 4).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-2.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors",
                  location.pathname === link.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "px-2.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                    MORE_LINKS.some((l) => l.path === location.pathname) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Mehr <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="glass-strong border-border">
                {MORE_LINKS.map((l) => (
                  <DropdownMenuItem key={l.path} asChild>
                    <Link to={l.path} className="text-sm cursor-pointer">{l.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {NAV_LINKS.slice(4).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-2.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors",
                  location.pathname === link.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                {link.path === "/leitstand" && waitingChats > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{waitingChats}</span>
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 lg:gap-3">
            {location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                title="Zurück"
                className="w-9 h-9 rounded-full glass flex items-center justify-center hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <InviteShareButton className="hidden sm:flex" />
            <span title="Suche folgt in Kürze" className="w-9 h-9 rounded-full glass flex items-center justify-center text-muted-foreground/40 cursor-not-allowed">
              <Search className="w-4 h-4" />
            </span>
            <Link to="/messages" title={incomingCount > 0 ? `${incomingCount} wollen mit dir chatten` : "Messages"} className="hidden sm:flex w-9 h-9 rounded-full glass items-center justify-center hover:text-primary transition-colors relative">
              <MessageSquare className="w-4 h-4" />
              {incomingCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{incomingCount}</span>
              )}
            </Link>
            <Link to="/account" className="w-9 h-9 rounded-full glass flex items-center justify-center hover:text-primary transition-colors">
              <User className="w-4 h-4" />
            </Link>
            <button
              onClick={() => base44.auth.logout("/")}
              title="Abmelden"
              className="w-9 h-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-full glass flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 glass-strong border-b border-border p-4">
            <nav className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
              {MOBILE_LINKS.map((link) => (
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

      <main className="pt-[72px] pb-24 lg:pb-0">
        <Outlet />
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="glass-strong rounded-full border border-border flex items-center justify-around py-2 px-2 max-w-md mx-auto">
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