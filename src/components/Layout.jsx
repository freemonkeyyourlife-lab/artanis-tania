import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Search, MessageSquare, User, Home, Sparkles, Library, Menu, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Artanis", path: "/artanis" },
  { label: "Triania", path: "/triania" },
  { label: "Couple", path: "/couple" },
  { label: "Explore", path: "/explore" },
  { label: "Videos", path: "/videos" },
  { label: "Photos", path: "/photos" },
  { label: "Stories", path: "/stories" },
  { label: "Topics", path: "/topics" },
  { label: "Live", path: "/live" },
  { label: "Interactive", path: "/interactive" },
  { label: "Request", path: "/request" },
  { label: "Messages", path: "/messages" },
];

const MOBILE_NAV = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Sparkles, label: "Interactive", path: "/interactive" },
  { icon: MessageSquare, label: "Chat", path: "/messages" },
  { icon: Library, label: "Library", path: "/library" },
  { icon: User, label: "Profile", path: "/account" },
];

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border" style={{ height: "72px" }}>
        <div className="h-full max-w-[1600px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
          <Link to="/" className="flex-shrink-0">
            <span className="font-display text-lg lg:text-xl text-foreground tracking-wide">
              ARTANIS <span className="text-primary">×</span> TRIANIA
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-2.5 py-2 rounded-full text-[13px] font-medium transition-colors",
                  location.pathname === link.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 lg:gap-3">
            <button className="w-9 h-9 rounded-full glass flex items-center justify-center hover:text-primary transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <Link to="/messages" className="hidden sm:flex w-9 h-9 rounded-full glass items-center justify-center hover:text-primary transition-colors relative">
              <MessageSquare className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </Link>
            <Link to="/admin" className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </Link>
            <Link to="/account" className="w-9 h-9 rounded-full glass flex items-center justify-center hover:text-primary transition-colors">
              <User className="w-4 h-4" />
            </Link>
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
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
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
                </Link>
              ))}
              <Link to="/library" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground">
                My Library
              </Link>
              <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground">
                Account
              </Link>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground">
                Admin
              </Link>
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
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}