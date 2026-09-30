import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, ArrowLeft, Loader2, Mic, Square, Volume2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import TakeoverSwitch from "@/components/leitstand/TakeoverSwitch";
import VoiceReplyBar from "@/components/leitstand/VoiceReplyBar";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";
import { useToast } from "@/components/ui/use-toast";
import CopyRoomLinkButton from "@/components/call/CopyRoomLinkButton";

// Hier schreibst du als der Charakter — jede Zeile kommt beim Gast als Nachricht der Figur an.
export default function LeitstandChat({ conversation, messages, onChanged, onBack, inCall }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const { toast } = useToast();

  // Im Call-Fenster ist weniger Platz — dort größere Schrift und größere
  // Knöpfe, damit man beim Zuschauen ohne Anstrengung mitlesen kann.
  const bubble = cn("rounded-2xl", inCall ? "max-w-[88%] px-4 py-3 text-[15px] leading-relaxed" : "max-w-[75%] px-4 py-3 text-sm leading-relaxed");
  const action = inCall ? "w-11 h-11" : "w-10 h-10";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { setText(""); }, [conversation.id]);

  const setHandler = async (value) => {
    await base44.entities.Conversation.update(conversation.id, { handledBy: value });
    onChanged?.();
  };

  // Selbst sprechen statt tippen: die Aufnahme wird in die Stimme des
  // Charakters umgewandelt und geht als Sprachnachricht beim Gast an.
  const recorder = useVoiceRecorder(async (fileUri) => {
    if (!conversation.voiceProfileId) {
      toast({ title: "Erst eine Stimme wählen", description: "Im Streifen über der Eingabe legst du fest, wie der Charakter klingt.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const profile = await base44.entities.Voice.get(conversation.voiceProfileId);
      const res = await base44.functions.invoke("voiceConvert", {
        fileUri,
        voiceId: profile?.externalVoiceId || "",
        baseVoice: profile?.baseVoice || "honey",
        mood: profile?.mood,
        intensity: profile?.intensity,
        ending: profile?.ending,
      });
      if (res.data?.error) throw new Error(res.data.error);
      await base44.entities.Message.create({
        conversationId: conversation.id,
        sender: conversation.creatorName || "Charakter",
        senderType: "AI",
        text: "",
        humanOverride: true,
        voiceNote: true,
        attachments: [{ type: "audio", url: res.data.url, file_uri: res.data.file_uri }],
      });
      await base44.entities.Conversation.update(conversation.id, {
        waitingSince: null,
        lastMessageAt: new Date().toISOString(),
      });
      onChanged?.();
    } catch (e) {
      toast({ title: "Umwandeln hat nicht geklappt", description: e.message || "Bitte noch einmal versuchen.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  });

  // voiceOnly: diese Zeile geht als Sprachnachricht raus, ohne Text daneben.
  const send = async (voiceOnly = false) => {
    const value = text.trim();
    if (!value || sending) return;
    if (voiceOnly && !conversation.voiceProfileId) return;
    setSending(true);
    try {
      await base44.entities.Message.create({
        conversationId: conversation.id,
        sender: conversation.creatorName || "Charakter",
        senderType: "AI",
        text: value,
        humanOverride: true,
        voiceNote: voiceOnly,
      });
      await base44.entities.Conversation.update(conversation.id, {
        waitingSince: null,
        lastMessageAt: new Date().toISOString(),
      });
      setText("");
      onChanged?.();
    } finally {
      setSending(false);
    }
  };

  const media = (msg) => {
    const items = msg.attachments?.length ? msg.attachments : (msg.attachment ? [{ type: "image", url: msg.attachment }] : []);
    return items.filter((it) => it.type === "image" && it.url);
  };

  const audios = (msg) => (msg.attachments || []).filter((it) => it.type === "audio" && it.url);

  return (
    <>
      <div className="p-4 border-b border-border flex items-center gap-3">
        <button onClick={onBack} className="lg:hidden flex-shrink-0"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium text-foreground truncate", inCall ? "text-[15px]" : "text-sm")}>{conversation.userName || "Gast"}</p>
          <p className={cn("text-muted-foreground truncate", inCall ? "text-[13px]" : "text-xs")}>
            {conversation.handledBy === "HUMAN" ? "Du bist dran — die KI hält sich raus" : "KI antwortet, wenn du 2 Minuten nicht reagierst"}
          </p>
        </div>
        <CopyRoomLinkButton />
        <TakeoverSwitch value={conversation.handledBy} onChange={setHandler} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.senderType === "HUMAN" ? "justify-start" : "justify-end")}>
            <div className={cn(bubble, m.senderType === "HUMAN" ? "bg-elevated text-foreground" : "bg-primary text-primary-foreground")}>
              {media(m).map((it, i) => (
                <Image key={i} src={it.url} fittingType="fill" className={cn("rounded-2xl mb-2", inCall ? "w-52 h-52" : "w-48 h-48")} />
              ))}
              {audios(m).map((it, i) => (
                <audio key={i} controls src={it.url} className={cn("max-w-full mb-2", inCall ? "w-64" : "w-56")} />
              ))}
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <VoiceReplyBar conversation={conversation} onChanged={onChanged} />

      <div className={cn("flex", inCall ? "p-3.5 gap-2.5" : "p-4 gap-2")}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={recorder.recording ? "Aufnahme läuft — Mikrofon tippen zum Senden" : recorder.busy ? "Wird umgewandelt …" : `Antworten als ${conversation.creatorName || "Charakter"} …`}
          className={cn("flex-1 px-4 rounded-full bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50", inCall ? "py-3 text-[15px]" : "py-2.5 text-base")}
        />
        <button
          onClick={() => send(true)}
          disabled={!text.trim() || sending || !conversation.voiceProfileId}
          title={conversation.voiceProfileId ? "Diesen Text als Sprachnachricht sprechen" : "Erst oben eine Stimme wählen"}
          className={cn(action, "rounded-full bg-elevated border border-border text-primary flex items-center justify-center disabled:opacity-40 flex-shrink-0")}
        >
          <Volume2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => recorder.toggle("meine-stimme.webm")}
          disabled={sending || recorder.busy}
          title={conversation.voiceProfileId ? "Selbst sprechen — geht mit der Stimme des Charakters beim Gast an" : "Erst oben eine Stimme wählen"}
          className={cn(action, "rounded-full border flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40", recorder.recording ? "bg-red-500 border-red-500 text-white animate-pulse" : "bg-elevated border-border text-primary")}
        >
          {recorder.busy ? <Loader2 className="w-5 h-5 animate-spin" /> : recorder.recording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          onClick={() => send()}
          disabled={!text.trim() || sending}
          className={cn(action, "rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0")}
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </>
  );
}