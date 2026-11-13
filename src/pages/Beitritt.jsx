import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { KeyRound, ArrowRight, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { normalizeCallCode } from "@/lib/callLink";

// Code-Eingabe statt Link: wer nur den Geheim-Code bekommen hat, tippt ihn
// hier ein und landet direkt in der Sitzung — ohne HTTPS, ohne Copy-Paste.
export default function Beitritt() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e?.preventDefault();
    const norm = normalizeCallCode(code);
    if (!norm) return;
    setBusy(true);
    setError("");
    try {
      const res = await base44.entities.TherapySession.filter({ inviteCode: norm }, "-created_date", 5);
      const found = (res || [])[0];
      if (!found) {
        setError("Diesen Code gibt es nicht — vielleicht vertippt? Oder die Sitzung ist vertraulich.");
        setBusy(false);
        return;
      }
      const g = name.trim() || "Freundin";
      navigate(`/therapy/${found.id}?g=${encodeURIComponent(g)}`);
    } catch (e2) {
      setError("Etwas ist schiefgelaufen. Versuch's nochmal.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/therapy" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5">
          <ArrowLeft className="w-3.5 h-3.5" /> Sprechstunde
        </Link>

        <div className="glass rounded-3xl border border-border p-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 mb-4">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl text-foreground mb-1">Mit Code beitreten</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Du hast einen Geheim-Code bekommen? Hier eintippen — kein Link, kein Kopieren. Landest direkt in der Sitzung.
          </p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                placeholder="z. B. K7QM4XRP"
                className="w-full mt-1 px-4 py-3 rounded-2xl bg-background border-2 border-border text-foreground text-lg font-bold tracking-[0.2em] uppercase caret-primary focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dein Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Wie soll man dich nennen?"
                className="w-full mt-1 px-4 py-3 rounded-2xl bg-background border border-border text-foreground text-sm caret-primary focus:outline-none focus:border-primary/50"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={!code.trim() || busy}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {busy ? "Suche …" : "Beitreten"}
            </button>
          </form>

          <p className="mt-5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Der Code ist das einzige, was jemand braucht — er ist geheim.
          </p>
        </div>
      </div>
    </div>
  );
}