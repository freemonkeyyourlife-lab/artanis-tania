import React, { useEffect, useRef, useState } from "react";
import { Send, Volume2, VolumeX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import useVoicePlayer from "@/hooks/useVoicePlayer";

export default function CallChat({ messages, mySeat, onSend }) {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState([]);
  const [voiceId, setVoiceId] = useState(() => localStorage.getItem("callReadAloudVoice") || "");
  const [readAloud, setReadAloud] = useState(false);
  const endRef = useRef(null);
  const spokenRef = useRef(0);

  const voice = voices.find((v) => v.id === voiceId) || voices[0] || null;
  const { speak, halt } = useVoicePlayer(voice);

  useEffect(() => {
    base44.entities.Voice.filter({ active: true }, "-created_date")
      .then((list) => setVoices(list))
      .catch(() => { /* Gäste ohne Konto hören einfach über den Browser */ });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Vorlesen: nur was die anderen schreiben, und nur das Neue.
  useEffect(() => {
    if (!readAloud) {
      spokenRef.current = messages.length;
      return;
    }
    if (messages.length <= spokenRef.current) return;
    const fresh = messages.slice(spokenRef.current).filter((m) => m.seat !== mySeat);
    spokenRef.current = messages.length;
    if (fresh.length > 0) speak(fresh.map((m) => m.text).join(". "));
  }, [messages, readAloud, mySeat, speak]);

  useEffect(() => {
    if (!readAloud) halt();
  }, [readAloud, halt]);

  const pickVoice = (id) => {
    setVoiceId(id);
    localStorage.setItem("callReadAloudVoice", id);
  };

  const submit = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setReadAloud((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors",
            readAloud ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
          )}
          title="Neue Nachrichten laut vorlesen"
        >
          {readAloud ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          Vorlesen {readAloud ? "an" : "aus"}
        </button>
        {voices.length > 0 && (
          <select
            value={voice?.id || ""}
            onChange={(e) => pickVoice(e.target.value)}
            className="flex-1 min-w-0 px-3 py-1.5 rounded-full bg-elevated border border-border text-[11px] font-semibold text-muted-foreground focus:outline-none focus:border-primary/50"
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-6 px-4">
            Noch keine Nachrichten — alles, was du hier schreibst, sehen alle im Call sofort.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.seat === mySeat;
          return (
            <div
              key={i}
              className={cn(
                "max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words",
                mine ? "bg-primary text-primary-foreground ml-auto" : "bg-elevated text-foreground"
              )}
            >
              {!mine && <p className="text-[11px] font-semibold opacity-70 mb-0.5">{m.name || "Gast"}</p>}
              {m.text}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nachricht an alle…"
          className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          title="Senden"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}