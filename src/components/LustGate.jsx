import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, X, MessageSquare, Sparkles, Image as ImageIcon, Users } from "lucide-react";
import { isGodMode } from "@/lib/godMode";

const KEY = "artanis_lust_gate_seen";

const OPTIONS = [
  { label: "Verführen lassen", hint: "Direkt in den Chat mit Triania", icon: MessageSquare, path: "/messages" },
  { label: "Eine Story spielen", hint: "Interaktiv, du entscheidest", icon: Sparkles, path: "/interactive" },
  { label: "Bilder ansehen", hint: "Frischer Content", icon: ImageIcon, path: "/photos" },
  { label: "Mit anderen reden", hint: "Offener Gruppenchat", icon: Users, path: "/groups" },
];

export default function LustGate() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => {
      if (isGodMode()) return false;
      try {
        if (localStorage.getItem("age_verified") === "true" && !localStorage.getItem(KEY)) {
          setOpen(true);
          return true;
        }
      } catch (e) { /* ignore */ }
      return false;
    };
    if (check()) return;
    const id = setInterval(() => { if (check()) clearInterval(id); }, 800);
    return () => clearInterval(id);
  }, []);

  const close = (path) => {
    try { localStorage.setItem(KEY, "1"); } catch (e) { /* ignore */ }
    setOpen(false);
    if (path) navigate(path);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={() => close()} />
      <div className="relative w-full max-w-lg rounded-3xl border border-primary/30 bg-card p-8 accent-glow-strong">
        <button onClick={() => close()} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <Flame className="w-6 h-6 text-primary" />
        </div>

        <h2 className="font-display text-3xl text-foreground mb-2">Hast du Lust?</h2>
        <p className="text-sm text-muted-foreground mb-6">Sag einfach, worauf du gerade Lust hast — Triania ist da.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <button
                key={o.label}
                onClick={() => close(o.path)}
                className="flex items-start gap-3 p-4 rounded-2xl bg-elevated border border-border text-left hover:border-primary/50 transition-colors"
              >
                <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{o.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{o.hint}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={() => close()} className="mt-5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Erstmal nur umschauen
        </button>
      </div>
    </div>
  );
}