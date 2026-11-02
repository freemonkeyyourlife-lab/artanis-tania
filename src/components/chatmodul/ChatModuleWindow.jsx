import React, { useEffect, useRef, useState } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAT_MODES, CHAT_LAYOUTS, getChatModule, subscribeChatModule, handleFor } from "@/lib/chatModule";
import { Image as ImageIcon } from "@/components/ui/image";
import ChatSpeakButton from "@/components/chatmodul/ChatSpeakButton";
import ChatImageTools from "@/components/chatmodul/ChatImageTools";
import ChatCastPicker from "@/components/chatmodul/ChatCastPicker";
import { speakText, speakSequence } from "@/lib/chatVoice";
import { readMood, moodFor, setMoodFor, moodLabels } from "@/lib/chatMood";
import { castFor, setCastFor, castPrompt, splitCast, voiceForName } from "@/lib/chatCast";

const SYSTEM =
  "Du bist der Assistent dieses Chat-Moduls. Antworte knapp, hilfreich und in der Sprache des Nutzers.";

// Das Chatfenster selbst: ein Gespräch, das an dieselben Daten andockt wie die
// Plattform — und auf Wunsch denselben Weg nach Telegram nimmt.
export default function ChatModuleWindow() {
  const [settings, setSettings] = useState(getChatModule());
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mood, setMood] = useState(null);
  const [cast, setCast] = useState([]);
  const endRef = useRef(null);

  useEffect(() => subscribeChatModule(setSettings), []);

  // Die Stimmung kommt mit dem Gespräch zurück — sie liegt am Gerät.
  useEffect(() => setMood(moodFor(conv?.id)), [conv?.id]);

  // Die Besetzung gehört zum Gespräch — sie kommt mit ihm zurück.
  useEffect(() => setCast(castFor(conv?.id)), [conv?.id]);

  const changeCast = (next) => {
    setCast(next);
    setCastFor(conv?.id, next);
  };

  // Vorlesen: mit Besetzung spricht jede Figur mit ihrer eigenen Stimme.
  const speakReply = (reply) => {
    if (cast.length) {
      speakSequence(
        splitCast(reply, cast).map((b) => ({
          text: b.text,
          voiceName: voiceForName(cast, b.name).voiceName || settings.voiceName,
          voiceId: voiceForName(cast, b.name).voiceId || settings.voiceId,
        }))
      );
      return;
    }
    speakText(reply, { voiceName: settings.voiceName, voiceId: settings.voiceId });
  };

  // Das Gespräch holen oder anlegen. Ändert sich die Spiegelung, wandert es mit.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await base44.auth.me().catch(() => null);
      if (cancelled) return;
      // Ein gewähltes Gespräch aus der Plattform hat Vorrang — es läuft hier weiter.
      if (settings.conversationId) {
        const picked = await base44.entities.Conversation.get(settings.conversationId).catch(() => null);
        if (picked) {
          if (!cancelled) setConv(picked);
          return;
        }
      }

      const handle = handleFor(settings, user?.id);
      const found = await base44.entities.Conversation.filter({ participantId: handle }, "-created_date", 1);
      let c = found[0];
      if (!c) {
        c = await base44.entities.Conversation.create({
          userId: user?.id || handle,
          userName: user?.full_name || user?.email || "Chat-Modul",
          participantId: handle,
          participantName: settings.mirrorToTelegram ? "Telegram" : "Chat-Modul",
          creatorName: "Chat-Modul",
          conversationType: "AI",
          lastMessageAt: new Date().toISOString(),
        });
      }
      if (!cancelled) setConv(c);
    })();
    return () => {
      cancelled = true;
    };
  }, [settings.conversationId, settings.mirrorToTelegram, settings.telegramChatId]);

  // Nachrichten laden und live mitlaufen lassen — auch das, was von Telegram kommt.
  useEffect(() => {
    if (!conv) return;
    let alive = true;
    const load = async () => {
      const page = await base44.entities.Message.filter({ conversationId: conv.id }, "-created_date", 100);
      if (alive) setMessages((page || []).slice().reverse());
    };
    load();
    const unsub = base44.entities.Message.subscribe((e) => {
      if (e.data?.conversationId === conv.id) load();
    });
    return () => {
      alive = false;
      unsub?.();
    };
  }, [conv?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  // Im KI-Modus antwortet das Modell — über das gewählte Modell, sonst mit der Standard-KI.
  const answer = async (userText, conversationId, current) => {
    const history = messages
      .slice(-12)
      .map((m) => `${m.senderType === "HUMAN" ? "Nutzer" : "Assistent"}: ${m.text || ""}`)
      .join("\n");
    const prompt = (history ? "BISHERIGES GESPRÄCH:\n" + history + "\n\n" : "") + "Nutzer sagt: " + userText;

    const system =
      SYSTEM +
      castPrompt(cast) +
      (current?.tone ? `\n\nSTIMMUNG — so sprichst du jetzt:\n${current.tone}` : "");
    let reply = "";
    if (settings.modelId) {
      try {
        const res = await base44.functions.invoke("hfChat", {
          modelId: settings.modelId,
          system,
          prompt,
        });
        reply = res.data?.text || "";
      } catch (e) {
        reply = "";
      }
    }
    if (!reply) {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: `${system}\n\n${prompt}` });
      reply = typeof res === "string" ? res : res?.response || res?.text || "";
    }
    if (!reply) return;

    await base44.entities.Message.create({
      conversationId,
      sender: "Assistent",
      senderType: "AI",
      text: reply,
      channel: "PLATFORM",
    });
    await base44.entities.Conversation.update(conversationId, { lastMessageAt: new Date().toISOString() });
    if (settings.autoSpeak) speakReply(reply);
  };

  const send = async () => {
    const body = text.trim();
    if (!body || !conv || busy) return;
    setText("");
    setError("");
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const outgoing = await base44.entities.Message.create({
        conversationId: conv.id,
        sender: "Ich",
        senderType: "HUMAN",
        text: body,
        channel: "PLATFORM",
      });

      // Im manuellen Modus wartet das Gespräch auf dich — im KI-Modus läuft es weiter.
      await base44.entities.Conversation.update(conv.id, {
        lastMessageAt: now,
        handledBy: settings.mode === CHAT_MODES.MANUAL ? "HUMAN" : "AI",
        waitingSince: settings.mode === CHAT_MODES.MANUAL ? now : null,
      });

      // Spiegeln: derselbe Weg wie jeder Telegram-Chat der Plattform.
      if (settings.mirrorToTelegram) {
        base44.functions
          .invoke("telegramForward", { messageId: outgoing.id })
          .catch(() => setError("Nach Telegram ging es gerade nicht raus."));
      }

      if (settings.mode === CHAT_MODES.AI) {
        // Erst hören, wo das Gespräch steht — daraus antwortet das Modell.
        let current = mood;
        if (settings.autoMood) {
          try {
            current = await readMood([...messages, { senderType: "HUMAN", text: body }]);
            setMood(current);
            setMoodFor(conv.id, current);
          } catch (e) {
            current = mood;
          }
        }
        await answer(body, conv.id, current);
      }
    } catch (e) {
      setError(e?.message || "Senden hat nicht geklappt.");
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const full = settings.layout === CHAT_LAYOUTS.FULLSCREEN;

  return (
    <div
      className="flex flex-col overflow-hidden border border-border bg-card"
      style={{
        borderRadius: `${settings.radius}px`,
        height: full ? "calc(100vh - 40px)" : "70vh",
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: settings.accent }}>
          {settings.mode === CHAT_MODES.AI ? "Chatbot" : "Manuell"}
        </span>
        <div className="flex items-center gap-2">
          <ChatCastPicker cast={cast} onChange={changeCast} accent={settings.accent} />
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            {settings.mirrorToTelegram && settings.telegramChatId
              ? `gespiegelt nach Telegram · ${settings.telegramChatId}`
              : "nur hier"}
          </span>
        </div>
      </div>

      {mood?.moodIds?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-1.5">
          {moodLabels(mood).map((label) => (
            <span
              key={label}
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${settings.accent}22`, color: settings.accent }}
            >
              {label}
            </span>
          ))}
          {mood.summary && (
            <span className="ml-1 truncate text-[11px] text-muted-foreground">{mood.summary}</span>
          )}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!messages.length && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Noch nichts gesagt. Schreib unten die erste Nachricht.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderType === "HUMAN";
          // Mit Besetzung wird die Antwort in Zeilen zerlegt — wer sagt was.
          const blocks = !mine && cast.length ? splitCast(m.text, cast) : null;
          return (
            <div key={m.id} className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}>
              {!mine && <Bot className="mt-1 h-4 w-4 shrink-0" style={{ color: settings.accent }} />}
              <div
                className={cn(
                  "max-w-[80%] px-3.5 py-2 text-sm",
                  mine ? "text-primary-foreground" : "bg-elevated text-foreground"
                )}
                style={{
                  borderRadius: `${Math.max(settings.radius - 4, 6)}px`,
                  ...(mine ? { backgroundColor: settings.accent } : {}),
                }}
              >
                {blocks ? (
                  <div className="space-y-2">
                    {blocks.map((b, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="min-w-0">
                          {b.name && (
                            <p
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color: settings.accent }}
                            >
                              {b.name}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap">{b.text}</p>
                        </div>
                        <ChatSpeakButton
                          text={b.text}
                          voiceName={voiceForName(cast, b.name).voiceName || settings.voiceName}
                          voiceId={voiceForName(cast, b.name).voiceId || settings.voiceId}
                          accent={settings.accent}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                )}
                {(m.attachments || [])
                  .filter((a) => a?.type === "image" && a.url)
                  .map((a, i) => (
                    <ImageIcon
                      key={i}
                      src={a.url}
                      alt=""
                      className="mt-2 max-h-64 w-full rounded-xl object-cover"
                    />
                  ))}
                {(m.attachments || [])
                  .filter((a) => a?.type === "video" && a.url)
                  .map((a, i) => (
                    <video
                      key={`v${i}`}
                      src={a.url}
                      controls
                      className="mt-2 max-h-64 w-full rounded-xl object-cover"
                    />
                  ))}
              </div>
              {!mine && !blocks && (
                <ChatSpeakButton
                  text={m.text}
                  voiceName={settings.voiceName}
                  voiceId={settings.voiceId}
                  accent={settings.accent}
                />
              )}
              {mine && <User className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
            </div>
          );
        })}
        {busy && settings.mode === CHAT_MODES.AI && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> denkt nach …
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="px-4 pb-1 text-xs text-destructive">{error}</p>}

      <ChatImageTools
        accent={settings.accent}
        moodStyle={mood?.imageStyle}
        onImage={async (url, prompt) => {
          await base44.entities.Message.create({
            conversationId: conv.id,
            sender: "Assistent",
            senderType: "AI",
            text: prompt,
            attachments: [{ type: "image", url }],
            channel: "PLATFORM",
          });
          await base44.entities.Conversation.update(conv.id, {
            lastMessageAt: new Date().toISOString(),
          });
        }}
        onVideo={async (url, prompt) => {
          await base44.entities.Message.create({
            conversationId: conv.id,
            sender: "Assistent",
            senderType: "AI",
            text: prompt,
            attachments: [{ type: "video", url }],
            channel: "PLATFORM",
          });
          await base44.entities.Conversation.update(conv.id, {
            lastMessageAt: new Date().toISOString(),
          });
        }}
      />

      <div className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Nachricht schreiben … (Enter sendet, Shift+Enter neue Zeile)"
          className="min-h-[46px] resize-none"
          rows={1}
        />
        <Button onClick={send} disabled={busy || !text.trim()} className="h-[46px] w-[46px] shrink-0 p-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}