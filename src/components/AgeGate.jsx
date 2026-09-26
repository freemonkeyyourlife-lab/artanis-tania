import React, { useState } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export default function AgeGate() {
  const [verified, setVerified] = useState(() => {
    try { return localStorage.getItem("age_verified") === "true"; } catch { return false; }
  });

  if (verified) return null;

  const handleConfirm = () => {
    try { localStorage.setItem("age_verified", "true"); } catch {}
    setVerified(true);
  };

  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6">
      <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 50% 40%, rgba(226,149,120,0.15), transparent 60%)" }} />
      <div className="relative max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto rounded-full glass-strong flex items-center justify-center mb-6 accent-glow">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-3xl text-foreground mb-2">ARTANIS × TRIANIA</h1>
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8">Privates interaktives Archiv</p>

        <div className="glass rounded-2xl border border-border p-6 mb-6 text-left">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Diese Seite enthält Inhalte für Erwachsene ab 18 Jahren. Mit dem Betreten bestätigst du, dass du mindestens 18 Jahre alt bist und damit einverstanden bist, solche Inhalte zu sehen.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Alle dargestellten Personen und Charaktere sind 18 Jahre oder älter. Die KI-Modelle sind computergeneriert und zeigen keine realen Personen.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="w-full py-4 rounded-full bg-primary text-primary-foreground font-semibold text-sm tracking-wide hover:accent-glow-strong transition-all"
          >
            ICH BIN 18+
          </button>
          <button
            onClick={handleExit}
            className="w-full py-4 rounded-full border border-border text-muted-foreground font-medium text-sm hover:text-foreground hover:border-foreground/20 transition-all"
          >
            VERLASSEN
          </button>
        </div>
      </div>
    </div>
  );
}