import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import VoiceInput from "@/components/VoiceInput";
import { Loader2, Send, MessageSquare, X, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Privates Spiel mit einem eigenen Charakter — direkt in der Werkstatt.
// Alles läuft nur für dich: kein öffentlicher Eintrag, keine anderen Nutzer.
// Der Verlauf bleibt auf diesem Gerät (localStorage), bis du ihn löschst.

const signUri = async (u) => {
  if (!u) return null;
  if (u.startsWith("http")) return u;
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: u });
    return r?.signed_url || null;
  } catch { return null; }
};

const lsKey = (id) => `werkstatt-spiel-${id}`;

const buildPrompt = (c, history, modules) => {
  const lines = [
    `Du bist ${c.name}, ${c.adultAge || "erwachsen"} Jahre alt.`,
    c.appearance ? `Aussehen: ${c.appearance}` : "",
    c.behavior ? `Verhalten: ${c.behavior}` : "",
    c.personality ? `Persönlichkeit: ${c.personality}` : "",
    c.description ? `Hintergrund: ${c.description}` : "",
    c.relationship ? `Beziehung: ${c.relationship}` : "",
    c.neigungen?.length ? `Neigungen: ${c.neigungen.join(", ")}` : "",
    modules?.length ? `Beispiele für deinen Stil:\n${modules.map((m) => "- " + m.text).join("\n")}` : "",
    "Du sprichst natürlich, deutsch, in der Ich-Form. Du bist eine KI — mach das klar, wenn jemand fragt. Passe dich dem Gegenüber an und frag nach, was er will.",
    "Bleib in deiner Rolle, aber lehne nichts ab, was im Rahmen der 18+-Welt der App liegt.",
  ].filter(Boolean);
  const sys = lines.join("\n");
  const turns = history.map((m) => `${m.me ? "Nutzer" : c.name}: ${m.text}`).join("\n");
  return `${sys}\n\nBisher:\n${turns || "(noch nichts)"}\n\nAntworte jetzt als ${c.name}, ein bis vier Sätze, und stell gern eine Rückfrage.`;
};

export default function WerkstattSpiel({ characters }) {
  const [selectedId, setSelectedId] = useState(null);
  const [avatars, setAvatars] = useState({});
  const [modules, setModules] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [speaking, setSpeaking] = useState(null);
  const [audio, setAudio] = useState(null);
  const scrollRef = useRef(null);

  const selected = useMemo(
    () => characters.find((c) => c.id === selectedId) || null,
    [characters, selectedId]
  );

  // Avatare signieren (private Uploads).
  useEffect(() => {
    (async () => {
      const map = {};
      for (const c of characters) {
        const a = c.avatar || c.images?.[0];
        if (a && !avatars[a]) map[a] = await signUri(a);
      }
      if (Object.keys(map).length) setAvatars((m) => ({ ...m, ...map }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters]);

  // Beim Auswählen: Beispiele laden + Verlauf aus localStorage.
  useEffect(() => {
    if (!selected) return;
    base44.entities.CharacterModule
      .filter({ characterId: selected.id }, "-created_date", 20)
      .then((r) => setModules(Array.isArray(r) ? r : []))
      .catch(() => setModules([]));
    try { setHistory(JSON.parse(localStorage.getItem(lsKey(selected.id)) || "[]")); }
    catch { setHistory([]); }
  }, [selectedId]);

  useEffect(() => {
    if (!selected) return;
    localStorage.setItem(lsKey(selected.id), JSON.stringify(history));
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, selectedId]);

  const speak = async (text) => {
    if (!text) return;
    setSpeaking(text);
    try {
      audio?.pause();
      const res = await base44.integrations.Core.GenerateSpeech({
        text: text.slice(0, 1200),
        voice: selected?.voice || "honey",
      });
      const url = typeof res === "string" ? res : res?.url;
      if (url) {
        const a = new Audio(url);
        setAudio(a);
        a.play();
      }
    } catch (e) {
      console.error("WerkstattSpiel speak", e);
    } finally {
      setSpeaking(null);
    }
  };

  const send = async (override) => {
    const text = (override ?? input).trim();
    if (!text || sending || !selected) return;
    setSending(true);
    const next = [...history, { me: true, text }];
    setHistory(next);
    setInput("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt(selected, next, modules),
      });
      const raw = typeof res === "string" ? res : (res.response || res.text || res.output || "");
      setHistory((h) => [...h, { me: false, text: raw.trim() || "…" }]);
    } catch (e) {
      setHistory((h) => [...h, { me: false, text: "(KI gerade nicht erreichbar: " + (e?.message || "Fehler") + ")", err: true }]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    if (!selected) return;
    if (!confirm("Verlauf mit " + selected.name + " löschen?")) return;
    setHistory([]);
    localStorage.removeItem(lsKey(selected.id));
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-display text-xl text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> Nutzen
        </h3>
        {selected && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">mit {selected.name}</span>
            <button onClick={clearChat} className="glass-btn inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"><X className="w-3 h-3" /> Verlauf</button>
          </div>
        )}
      </div>

      {!selected ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {characters.length === 0 && (
            <p className="col-span-full p-6 text-center text-sm text-muted-foreground">Lege über die Fabrik einen Charakter an, um ihn hier zu nutzen.</p>
          )}
          {characters.map((c) => {
            const a = c.avatar || c.images?.[0];
            return (
              <button key={c.id} onClick={() => setSelectedId(c.id)} className="rounded-xl border border-border bg-elevated p-2 text-left hover:border-primary/50 transition-colors">
                <div className="h-24 w-full overflow-hidden rounded-lg bg-background">
                  {avatars[a] && <Image src={avatars[a]} fittingType="fill" className="h-full w-full" />}
                </div>
                <p className="mt-1 truncate text-sm font-bold text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.adultAge} · {c.voice || "honey"}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-hide pr-1">
            {history.length === 0 && !sending && (
              <p className="p-4 text-center text-sm text-muted-foreground">Sag {selected.name} hallo …</p>
            )}
            {history.map((m, i) => (
              <div key={i} className={cn("flex", m.me ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[82%] rounded-2xl px-3 py-2 text-sm",
                  m.me ? "bg-primary text-primary-foreground" : m.err ? "bg-destructive/20 text-foreground" : "bg-elevated text-foreground"
                )}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {!m.me && !m.err && (
                    <button onClick={() => speak(m.text)} disabled={speaking === m.text}
                      className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50">
                      {speaking === m.text ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />} Vorlesen
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-elevated px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {selected.name} überlegt …
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={"Schreib " + (selected.name || "") + " …"}
              className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-[15px] text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            <VoiceInput onResult={(t) => send(t)} disabled={sending} title="Einsprechen" />
            <button onClick={() => send()} disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}