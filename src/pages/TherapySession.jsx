import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Send, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import TherapyThread from "@/components/therapy/TherapyThread";
import { buildTherapyPrompt, THERAPY_MODES, INTENSITIES } from "@/lib/therapyPrompts";
import { parseReply } from "@/lib/chatMedia";
import VoiceInput from "@/components/VoiceInput";
import ReadAloudButton from "@/components/ReadAloudButton";

const CLIENT_LINES = [
  "Weiter fragen",
  "Geh tiefer",
  "Was war der Auslöser?",
  "Ich schäme mich dabei",
  "Ich will es hier ausleben",
];

const THERAPIST_LINES = [
  "Erzähl mir die Szene genau",
  "Und dann?",
  "Wie fühlt sich das an?",
  "Was war der Auslöser?",
  "Zieh dich aus",
];

export default function TherapySession() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [guestNote, setGuestNote] = useState("");
  const [guestSending, setGuestSending] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const bottomRef = useRef(null);
  const openedRef = useRef(false);
  const messagesRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me().catch(() => null);
        setMe(user);
        const loaded = await base44.entities.TherapySession.get(id);
        setSession(loaded);
        const msgs = await base44.entities.TherapyMessage.filter({ sessionId: id }, "created_date", 300);
        setMessages(msgs);
      } catch (e) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    const unsubscribe = base44.entities.TherapyMessage.subscribe((event) => {
      if (event.type !== "create" || event.data?.sessionId !== id) return;
      setMessages((prev) => (prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]));
    });
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const isOwner = !!me && !!session && (session.userId === me.id || session.created_by_id === me.id);
  const canWrite = isOwner && session?.status !== "DONE";

  const speak = async (prompt) => {
    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    const raw = typeof res === "string" ? res : (res.response || res.text || res.output || "");
    const { cleanText, suggestions } = parseReply(raw);
    const created = await base44.entities.TherapyMessage.create({
      sessionId: session.id,
      senderType: "AI",
      senderName: "Triania",
      text: cleanText,
      suggestions: suggestions || [],
    });
    setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
  };

  // Triania eröffnet die Sitzung von selbst.
  useEffect(() => {
    if (loading || openedRef.current || !session || !isOwner) return;
    if (messages.length > 0 || session.status === "DONE") return;
    openedRef.current = true;
    (async () => {
      setSending(true);
      try {
        await speak(
          buildTherapyPrompt(session, "", []) +
            "\n\nDU ERÖFFNEST DIE SITZUNG JETZT. Zwei bis drei Sätze, dann die erste Frage."
        );
      } catch (e) {
        console.error(e);
      } finally {
        setSending(false);
      }
    })();
  }, [loading, session, isOwner, messages.length]);

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending || !session || !canWrite) return;
    setSending(true);
    try {
      const mine = await base44.entities.TherapyMessage.create({
        sessionId: session.id,
        senderType: "USER",
        senderName: session.anonymous ? "Anonym" : (me?.full_name || me?.email || "Du"),
        text,
      });
      setMessages((prev) => (prev.some((m) => m.id === mine.id) ? prev : [...prev, mine]));
      setInput("");

      const all = [...messagesRef.current, mine];
      const history = all
        .filter((m) => m.senderType !== "GUEST")
        .map((m) => `${m.senderType === "AI" ? "Triania" : "Klient"}: ${m.text}`)
        .join("\n");
      const guests = all.filter((m) => m.senderType === "GUEST").slice(-5).map((m) => m.text);

      await speak(buildTherapyPrompt(session, history, guests));
      await base44.entities.TherapySession.update(session.id, { lastMessageAt: new Date().toISOString() });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const sendGuestNote = async () => {
    const text = guestNote.trim();
    if (!text || guestSending || !session) return;
    setGuestSending(true);
    try {
      const created = await base44.entities.TherapyMessage.create({
        sessionId: session.id,
        senderType: "GUEST",
        senderName: me?.full_name || me?.email || "Gast",
        text,
      });
      setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
      setGuestNote("");
    } catch (e) {
      console.error(e);
    } finally {
      setGuestSending(false);
    }
  };

  const endSession = async () => {
    if (!session) return;
    const updated = await base44.entities.TherapySession.update(session.id, { status: "DONE" });
    setSession(updated);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Diese Sitzung gibt es nicht (mehr).</p>
        <Link to="/therapy" className="text-primary text-sm">Zurück zur Sprechstunde</Link>
      </div>
    );
  }

  const mode = THERAPY_MODES.find((m) => m.value === session.mode);
  const intensity = INTENSITIES.find((i) => i.value === session.intensity);
  const quickLines = session.roleSetup === "USER_THERAPIST" ? THERAPIST_LINES : CLIENT_LINES;
  const lastAi = [...messages].reverse().find((m) => m.senderType === "AI");
  const isLast = messages.length > 0 && messages[messages.length - 1]?.id === lastAi?.id;

  return (
    <div className="max-w-[900px] mx-auto px-4 lg:px-8 py-6">
      <Link to="/therapy" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Sprechstunde
      </Link>

      <div className="rounded-2xl border border-border bg-card p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
            {session.roleSetup === "USER_THERAPIST" ? "Du führst" : "Triania führt"}
          </span>
          {mode && <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">{mode.label}</span>}
          {intensity && <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">{intensity.label}</span>}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {session.visibility === "PRIVATE" ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {session.visibility === "PRIVATE" ? "vertraulich" : "offen für Mitleser"}
          </span>
          {session.status === "DONE" && (
            <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">beendet</span>
          )}
          <button
            onClick={() => setHandsFree((v) => !v)}
            title="Triania liest ihre Sätze laut vor und deine Stimme wird direkt gesendet"
            className={cn(
              "px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
              handsFree ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
            )}
          >
            {handsFree ? "Freisprechen ✓" : "Freisprechen"}
          </button>
          <ReadAloudButton text={lastAi?.text} voice="honey" autoPlay={handsFree} className="px-2.5 py-1.5 rounded-full bg-elevated" />
          {isOwner && session.status !== "DONE" && (
            <button onClick={endSession} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
              Sitzung beenden
            </button>
          )}
        </div>
        <p className="text-[15px] text-foreground leading-snug">{session.topic}</p>
        {session.goal && <p className="text-xs text-muted-foreground mt-1">Erhofft sich: {session.goal}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          {session.anonymous ? "Anonym" : session.userName || "Unbekannt"}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 lg:p-6 mb-4">
        {messages.length === 0 && !sending ? (
          <p className="text-sm text-muted-foreground text-center py-8">Die Sitzung beginnt gleich …</p>
        ) : (
          <TherapyThread messages={messages} />
        )}

        {sending && (
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Triania überlegt …
          </div>
        )}

        {canWrite && isLast && lastAi?.suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {lastAi.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => send(s)}
                disabled={sending}
                className="px-3.5 py-2 rounded-full bg-background border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {canWrite ? (
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {quickLines.map((line) => (
              <button
                key={line}
                onClick={() => send(line)}
                disabled={sending}
                className="px-3 py-1.5 rounded-full bg-elevated text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {line}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Sag es so, wie du es denkst — keine Ausflüchte."
              className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-[15px] text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <VoiceInput
              onResult={(t) => (handsFree ? send(t) : setInput((prev) => (prev ? prev + " " + t : t)))}
              disabled={sending}
              title={handsFree ? "Sprechen — geht direkt raus" : "Sprechen statt tippen"}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : session.visibility === "PUBLIC" ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-3">
          <p className="text-xs text-muted-foreground mb-2">
            Du liest mit. Wenn dir etwas durch den Kopf geht — wirf es ein. Triania darf es aufgreifen.
          </p>
          <div className="flex gap-2">
            <input
              value={guestNote}
              onChange={(e) => setGuestNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendGuestNote()}
              placeholder="Dein Gedanke dazu …"
              className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <VoiceInput
              onResult={(t) => setGuestNote((prev) => (prev ? prev + " " + t : t))}
              disabled={guestSending}
              title="Gedanken einwerfen statt tippen"
            />
            <button
              onClick={sendGuestNote}
              disabled={!guestNote.trim() || guestSending}
              className={cn("w-10 h-10 rounded-full bg-elevated text-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0")}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center">Diese Sitzung ist vertraulich.</p>
      )}
    </div>
  );
}