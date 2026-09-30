import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { HelpCircle, Loader2, Send, X } from "lucide-react";
import VoiceInput from "@/components/VoiceInput";
import HelpAnswer from "@/components/help/HelpAnswer";
import { askHelp } from "@/lib/helpAssistant";

// Runder Fragezeichen-Knopf unten links: fragen per Text oder Sprache. Nur für den Besitzer.
export default function HelpAssistant() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [spokenIdx, setSpokenIdx] = useState(-1);
  const endRef = useRef(null);

  useEffect(() => { base44.auth.me().then((u) => setIsAdmin(u?.role === "admin")).catch(() => {}); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [items, busy]);

  const ask = async (q, spoken = false) => {
    const question = q.trim();
    if (!question || busy) return;
    setText("");
    setBusy(true);
    const res = await askHelp(question, items).catch(() => ({ answer: "Das hat gerade nicht geklappt — bitte nochmal fragen.", links: [] }));
    setItems((prev) => {
      if (spoken) setSpokenIdx(prev.length);
      return [...prev, { q: question, ...res }];
    });
    setBusy(false);
  };

  if (!isAdmin) return null;

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} title="Hilfe fragen" className="fixed bottom-5 left-5 z-[90] w-14 h-14 rounded-full glass-btn glass-btn-accent flex items-center justify-center accent-glow-strong">
        {open ? <X className="w-6 h-6" /> : <HelpCircle className="w-7 h-7" />}
      </button>
      {open && (
        <div className="fixed bottom-24 left-5 z-[90] w-[min(420px,calc(100vw-2.5rem))] h-[min(600px,70vh)] glass-strong rounded-3xl border-2 border-border flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="font-display text-lg text-foreground">Frag mich</p>
            <p className="text-xs text-muted-foreground">Tippen oder aufs Mikro drücken und reinsprechen.</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 && !busy && (
              <div className="space-y-2">
                {["Wie stelle ich Tonlage und Intensität einer Stimme ein?", "Wie hole ich Stimmen aus ElevenLabs?", "Wo finde ich meine erstellten Bilder?"].map((s) => (
                  <button key={s} onClick={() => ask(s)} className="block w-full text-left px-4 py-2.5 rounded-2xl bg-elevated border border-border text-sm text-foreground hover:border-primary/50">{s}</button>
                ))}
              </div>
            )}
            {items.map((item, i) => <HelpAnswer key={i} item={item} autoPlay={i === spokenIdx} />)}
            {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Ich schau nach …</div>}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-border flex items-center gap-2">
            <VoiceInput onResult={(t) => ask(t, true)} disabled={busy} title="Frage reinsprechen" />
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(text)} placeholder="Wie funktioniert …?" className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            <button onClick={() => ask(text)} disabled={busy || !text.trim()} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}