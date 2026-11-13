import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Send, ArrowLeft, Loader2, Eye, EyeOff, Download, Radio, Settings2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import TherapyConfigMask from "@/components/therapy/TherapyConfigMask";
import TherapyThread from "@/components/therapy/TherapyThread";
import { buildTherapyPrompt, THERAPY_MODES, INTENSITIES, ROLE_SETUPS, FREILAUF_PROMPT, roleLabel, therapistName } from "@/lib/therapyPrompts";
import SessionControls from "@/components/therapy/SessionControls";
import SessionPlan from "@/components/therapy/SessionPlan";
import TherapySummaryCard from "@/components/therapy/TherapySummaryCard";
import TherapyInviteBar from "@/components/therapy/TherapyInviteBar";
import TherapySideChat from "@/components/therapy/TherapySideChat";
import TherapyVisualize from "@/components/therapy/TherapyVisualize";
import RollenCharakter from "@/components/therapy/RollenCharakter";
import { parseReply } from "@/lib/chatMedia";
import VoiceInput from "@/components/VoiceInput";
import TherapyReadButton from "@/components/therapy/TherapyReadButton";
import { downloadSession } from "@/lib/therapyExport";
import { newCallCode } from "@/lib/callLink";
import { publicName } from "@/lib/displayName";
import { useCallSession } from "@/lib/CallContext";

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
  const guestName = (() => {
    try {
      const v = new URLSearchParams(window.location.search).get("g");
      return v ? decodeURIComponent(v) : "";
    } catch { return ""; }
  })();
  const isGuest = !!guestName;
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [guestNote, setGuestNote] = useState("");
  const [guestSending, setGuestSending] = useState(false);
  const [creators, setCreators] = useState([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [running, setRunning] = useState(false);
  const [runCount, setRunCount] = useState(0);
  const [regie, setRegie] = useState(false);
  const [direction, setDirection] = useState("");
  const [selectedSugs, setSelectedSugs] = useState([]);
  const toggleSug = (s) => setSelectedSugs((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const bottomRef = useRef(null);
  const openedRef = useRef(false);
  const messagesRef = useRef([]);
  const lastAudioRef = useRef(null);
  const navigate = useNavigate();
  const call = useCallSession();
  const { toast } = useToast();

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
        const list = await base44.entities.Creator.filter({ active: { $ne: false } }, "stageName", 300).catch(() => []);
        setCreators(list);
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

  // Am Ende schreibt die Erzählerin die Zusammenfassung im Hintergrund — sie
  // soll hier auftauchen, ohne dass jemand die Seite neu lädt.
  useEffect(() => {
    const unsubscribe = base44.entities.TherapySession.subscribe((event) => {
      if (event.type !== "update" || event.data?.id !== id) return;
      setSession(event.data);
    });
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const isOwner = !!me && !!session && (session.userId === me.id || session.created_by_id === me.id);
  const canWrite = (isOwner || isGuest) && session?.status !== "DONE";

  // Live gehen: derselbe Video-Call-Raum, den die Zuschauer von hier aus öffnen.
  const goLive = () => {
    if (!session) return;
    const token = session.liveToken || newCallCode();
    if (!session.liveToken) {
      base44.entities.TherapySession.update(session.id, { liveToken: token }).catch(() => {});
      setSession((s) => ({ ...s, liveToken: token }));
    }
    const url = `/call/${token}?r=1`;
    // In der Vorschau (iframe) blockiert der Browser Kamera und Mikrofon —
    // der Call muss in einem eigenen Tab laufen, sonst startet nichts.
    if (window.self !== window.top) {
      window.open(url, "_blank");
      return;
    }
    call.start({ token, roomNumber: 1, name: publicName(me, "Therapeutin") });
    navigate(url);
  };

  const buildHistory = (list) => list
    .filter((m) => m.senderType !== "GUEST")
    .map((m) => `${m.senderType === "AI" ? (session.actor?.active ? "Szene" : therapistName(session)) : "Klient"}: ${m.text}`)
    .join("\n");

  // Seitenchat (channel SIDE) fließt nicht in Tanias Prompt — nur echte
  // Gast-Notizen aus dem Therapieverlauf.
  const buildGuests = (list) =>
    list.filter((m) => m.senderType === "GUEST" && m.channel !== "SIDE").slice(-5).map((m) => m.text);

  const speak = async (prompt) => {
    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    const raw = typeof res === "string" ? res : (res.response || res.text || res.output || "");
    const { cleanText, suggestions } = parseReply(raw);
    const created = await base44.entities.TherapyMessage.create({
      sessionId: session.id,
      senderType: "AI",
      senderName: therapistName(session),
      text: cleanText,
      suggestions: suggestions || [],
    });
    setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
  };

  // Tania eröffnet die Sitzung von selbst.
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
        senderName: isGuest
          ? (guestName || "Freundin")
          : (session.anonymous ? "Anonym" : (me?.full_name || me?.email || "Du")),
        text,
        audio: lastAudioRef.current || undefined,
      });
      lastAudioRef.current = null;
      setMessages((prev) => (prev.some((m) => m.id === mine.id) ? prev : [...prev, mine]));
      setInput("");

      const all = [...messagesRef.current, mine];

      await speak(buildTherapyPrompt(session, buildHistory(all), buildGuests(all)));
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

  // Richtung vorgeben: geht als Anweisung raus, nicht als eigene Zeile.
  const steer = async () => {
    const text = direction.trim();
    if (!text || sending || !session || !canWrite) return;
    setSending(true);
    try {
      const all = messagesRef.current;
      await speak(buildTherapyPrompt(session, buildHistory(all), buildGuests(all), text));
      setDirection("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // Freilauf: Tania macht von selbst weiter, bis Stopp gedrückt wird.
  const continueRun = async () => {
    if (sending || !session || !canWrite) return;
    setSending(true);
    try {
      const all = messagesRef.current;
      await speak(buildTherapyPrompt(session, buildHistory(all), buildGuests(all)) + FREILAUF_PROMPT);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // Rollenwechsel mitten in der Sitzung — hin und her, so oft du willst.
  const switchRole = async (value) => {
    if (!session || session.roleSetup === value) return;
    const updated = await base44.entities.TherapySession.update(session.id, { roleSetup: value });
    setSession(updated);
    const label = ROLE_SETUPS.find((r) => r.value === value)?.label || value;
    const note = await base44.entities.TherapyMessage.create({
      sessionId: session.id,
      senderType: "SYSTEM",
      text: `Rollenwechsel: ${label}.`,
    });
    setMessages((prev) => (prev.some((m) => m.id === note.id) ? prev : [...prev, note]));
  };

  const endSession = async () => {
    if (!session) return;
    const updated = await base44.entities.TherapySession.update(session.id, { status: "DONE" });
    setSession(updated);
  };

  // Das aktuelle Setup sichern — Rollen, Stimmen, Modus, Besetzung — als Vorlage
  // für künftige Sitzungen. Steht danach in der Bibliothek zum Laden bereit.
  const saveAsTemplate = async () => {
    if (!session) return;
    const name = window.prompt("Name für diese Vorlage:", session.topic || "Sitzungs-Setup");
    if (!name || !name.trim()) return;
    try {
      await base44.entities.SzenenVorlage.create({
        name: name.trim(),
        purpose: "SITZUNG",
        note: session.topic || "",
        setup: {
          roleSetup: session.roleSetup,
          mode: session.mode,
          intensity: session.intensity,
          therapistName: session.therapistName,
          therapistAge: session.therapistAge,
          therapistType: session.therapistType,
          therapistStyle: session.therapistStyle,
          therapistRole: session.therapistRole,
          therapistVoice: session.therapistVoice,
          cast: session.cast || [],
          actor: session.actor || {},
          topic: session.topic,
        },
      });
      toast({ title: "Vorlage gespeichert", description: `„${name.trim()}" steht in der Bibliothek.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Speichern fehlgeschlagen", description: e?.message });
    }
  };

  // Die Konfigurations-Maske übernehmen: Besetzung, Thema und ihre
  // Reaktionsweise — gilt ab der nächsten Antwort.
  const saveConfig = async (patch) => {
    if (!session) return;
    setConfigSaving(true);
    try {
      const { roleSetup, ...rest } = patch;
      const updated = await base44.entities.TherapySession.update(session.id, rest);
      setSession(updated);
      if (roleSetup && roleSetup !== session.roleSetup) await switchRole(roleSetup);
      const present = (patch.cast || []).filter((c) => c.mode === "PRESENT");
      const actorName = patch.actor?.active ? (patch.actor.name || "der Akteur") : null;
      const note = await base44.entities.TherapyMessage.create({
        sessionId: session.id,
        senderType: "SYSTEM",
        text: `Neu konfiguriert — Thema, Besetzung${present.length ? ` (${present.map((c) => c.name).join(", ")} im Raum)` : ""}${actorName ? `, Akteur ${actorName} spielt mit` : ""} und ihre Reaktionsweise. Gilt ab jetzt.`,
      });
      setMessages((prev) => (prev.some((m) => m.id === note.id) ? prev : [...prev, note]));
      setConfigOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setConfigSaving(false);
    }
  };

  // Solange der Freilauf läuft, antwortet Tania von selbst weiter.
  useEffect(() => {
    if (!running || sending || loading || !canWrite) return;
    const last = messages[messages.length - 1];
    if (!last || last.senderType !== "AI") return;
    if (runCount >= 10) { setRunning(false); return; }
    const t = setTimeout(() => { setRunCount((n) => n + 1); continueRun(); }, 3000);
    return () => clearTimeout(t);
  }, [running, sending, messages, loading, canWrite, runCount]);

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
  const name = therapistName(session);
  const quickLines = session.roleSetup === "USER_THERAPIST" ? THERAPIST_LINES : CLIENT_LINES;
  const therapyMessages = messages.filter((m) => m.channel !== "SIDE");
  const sideMessages = messages.filter((m) => m.channel === "SIDE");
  const lastAi = [...therapyMessages].reverse().find((m) => m.senderType === "AI");
  const isLast = therapyMessages.length > 0 && therapyMessages[therapyMessages.length - 1]?.id === lastAi?.id;

  return (
    <div className="max-w-[1140px] mx-auto px-4 lg:px-8 py-6">
      <Link to="/therapy" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Sprechstunde
      </Link>

      <TherapyInviteBar session={session} isOwner={isOwner} isGuest={isGuest} guestName={guestName} />

      <div className="lg:grid lg:grid-cols-[1fr_19rem] lg:gap-4 items-start">
      <div>

      <SessionPlan session={session} />

      <TherapySummaryCard
        session={session}
        messages={messages}
        isOwner={isOwner}
        onSaved={(updated) => setSession(updated)}
      />

      <div className="rounded-2xl border border-border bg-card p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setHandsFree((v) => !v)}
            title={`${name} liest ihre Sätze laut vor und deine Stimme wird direkt gesendet`}
            className={cn(
              "px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
              handsFree ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
            )}
          >
            {handsFree ? "Freisprechen ✓" : "Freisprechen"}
          </button>
          <TherapyReadButton
            session={session}
            text={lastAi?.text}
            sceneKey={`therapy-${session.id}`}
            autoPlay={handsFree}
            className="px-2.5 py-1.5 rounded-full bg-elevated"
          />
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {session.visibility === "PRIVATE" ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {session.visibility === "PRIVATE" ? "vertraulich" : "offen für Mitleser"}
          </span>
          {session.status === "DONE" && (
            <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">beendet</span>
          )}

          {(session.liveMode || "OFF") !== "OFF" && isOwner && (
            <button
              onClick={goLive}
              title="Auf Sendung gehen — die Zuschauer öffnen denselben Raum von dieser Seite aus"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive text-white text-[11px] font-bold"
            >
              <Radio className="w-3.5 h-3.5" /> Live gehen · {session.liveMode === "CAM" ? "Cam zu Cam" : "nur Stream"}
            </button>
          )}
          {(session.liveMode || "OFF") !== "OFF" && !isOwner && session.liveToken && (
            <Link
              to={`/call/${session.liveToken}?r=1`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive text-white text-[11px] font-bold"
            >
              <Radio className="w-3.5 h-3.5" /> Live zuschauen
            </Link>
          )}

          {isOwner && (
            <button
              onClick={() => setConfigOpen(true)}
              title="Besetzung, Thema und ihre Reaktionsweise festlegen"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-muted-foreground text-[11px] font-semibold hover:text-foreground transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" /> Konfigurieren
            </button>
          )}

          <button
            onClick={() => downloadSession(session, messages)}
            title="Die ganze Sitzung als Datei — Plan, Besetzung und Verlauf"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-muted-foreground text-[11px] font-semibold hover:text-foreground transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Herunterladen
          </button>

          <button
            onClick={saveAsTemplate}
            title="Dieses Setup als Vorlage sichern — Rollen, Stimmen, Modus"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-muted-foreground text-[11px] font-semibold hover:text-foreground transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5" /> Als Vorlage
          </button>

          {isOwner && session.status !== "DONE" && (
            <button onClick={endSession} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
              Sitzung beenden
            </button>
          )}
        </div>

        {isOwner && session.status !== "DONE" && (
          <div className="mt-3 pt-3 border-t border-border">
            <SessionControls
              roleSetup={session.roleSetup || "TANIA_THERAPIST"}
              onRole={switchRole}
              running={running}
              onRunning={(v) => { setRunCount(0); setRunning(v); }}
              regie={regie}
              onRegie={setRegie}
              disabled={sending}
            />
            {lastAi?.text && (
              <TherapyVisualize session={session} sceneText={lastAi.text} disabled={sending} />
            )}
          </div>
        )}

        {isOwner && (
          <RollenCharakter session={session} onUpdated={setSession} />
        )}

        <p className="text-xs text-muted-foreground mt-3">
          {session.anonymous ? "Anonym" : session.userName || "Unbekannt"}
        </p>
      </div>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="font-display text-lg text-foreground mb-1">Sitzung konfigurieren</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Wer dabei ist, worum es geht und wie {name} auf das reagiert, was du sagst.
          </p>
          <TherapyConfigMask
            session={session}
            creators={creators}
            onSave={saveConfig}
            onCancel={() => setConfigOpen(false)}
            saving={configSaving}
          />
        </DialogContent>
      </Dialog>

      <div className="rounded-2xl border border-border bg-card p-4 lg:p-6 mb-4">
        {therapyMessages.length === 0 && !sending ? (
          <p className="text-sm text-muted-foreground text-center py-8">Die Sitzung beginnt gleich …</p>
        ) : (
          <TherapyThread messages={therapyMessages} />
        )}

        {sending && (
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {name} überlegt …
          </div>
        )}

        {canWrite && isLast && lastAi?.suggestions?.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">Tania schlägt dir vor</p>
            <p className="text-[11px] text-muted-foreground mb-2">Das sind Vorschläge für dich. Klick eine oder mehrere — sie werden zu einer Nachricht verbunden.</p>
            <div className="flex flex-wrap gap-2">
              {lastAi.suggestions.map((s, i) => {
                const on = selectedSugs.includes(s);
                return (
                  <button
                    key={i}
                    onClick={() => toggleSug(s)}
                    disabled={sending}
                    className={cn(
                      "px-3.5 py-2 rounded-full border text-xs transition-colors disabled:opacity-50",
                      on ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {selectedSugs.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => { send(selectedSugs.join(" — ")); setSelectedSugs([]); }}
                  disabled={sending}
                  className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                >
                  {selectedSugs.length} kombiniert senden
                </button>
                <button onClick={() => setSelectedSugs([])} disabled={sending} className="text-[11px] text-muted-foreground hover:text-foreground">
                  Auswahl leeren
                </button>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {canWrite ? (
        <div className="rounded-2xl border border-border bg-card p-3">
          {regie ? (
            <div className="flex gap-2">
              <input
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && steer()}
                placeholder="Regie: wohin soll es gehen? Zum Beispiel „geh mehr auf die Kindheit ein“"
                className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-[15px] text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={steer}
                disabled={!direction.trim() || sending}
                className="px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex-shrink-0"
              >
                Richtung
              </button>
            </div>
          ) : (
          <>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Du sagst · schnell</p>
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
              onAudio={(url) => { lastAudioRef.current = url; }}
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
          </>
          )}
        </div>
      ) : session.visibility === "PUBLIC" ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-3">
          <p className="text-xs text-muted-foreground mb-2">
            Du liest mit. Wenn dir etwas durch den Kopf geht — wirf es ein. Tania darf es aufgreifen.
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

      {(isOwner || isGuest) && (
        <TherapySideChat session={session} messages={sideMessages} me={me} guestName={guestName} isGuest={isGuest} />
      )}
      </div>
    </div>
  );
}