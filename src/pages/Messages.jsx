import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Bot, ArrowLeft, ImagePlus, Mic, Square } from "lucide-react";
import { Image } from "@/components/ui/image";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { PERSONA_MODES } from "@/lib/personaPrompts";

export default function Messages() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatMode, setChatMode] = useState("artanis");
  const [contentList, setContentList] = useState([]);
  const [stories, setStories] = useState([]);
  const [userPref, setUserPref] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [creatorData, contentData, storyData] = await Promise.all([
        base44.entities.Creator.list(),
        base44.entities.Content.filter({ published: true }, "-created_date", 20),
        base44.entities.Story.filter({ published: true }, "-created_date", 20)
      ]);
      setCreators(creatorData);
      setContentList(contentData);
      setStories(storyData);
      try {
        const user = await base44.auth.me();
        const prefs = await base44.entities.UserPreference.filter({ userId: user.id });
        if (prefs.length > 0) setUserPref(prefs[0]);
      } catch (e) { /* not logged in or no prefs */ }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const buildContext = () => {
    const persona = PERSONA_MODES[chatMode];
    let ctx = persona.prompt;
    if (contentList.length > 0) {
      ctx += "\n\nAVAILABLE CONTENT (offer matching items when the user's fantasy aligns — use the exact title):\n" +
        contentList.map(c => {
          const price = c.isFree ? 'free' : (c.price || 0) > 0 ? `${c.price}€` : 'free';
          return `- "${c.title}" — ${c.contentType.replace(/_/g, ' ').toLowerCase()}, ${price}`;
        }).join('\n');
    }
    if (stories.length > 0) {
      ctx += "\n\nYOUR STORIES (tell these as your own experiences when the topic aligns — as if you were there. Don't quote them, retell naturally in your voice):\n" +
        stories.map(s => {
          const content = s.content ? s.content.substring(0, 800) : s.preview || "";
          return `### "${s.title}"\n${content}`;
        }).join('\n\n');
    }
    if (userPref) {
      ctx += "\n\nUSER PREFERENCES (adapt to these — this is what the user is into, focus on their interests and ask about them):\n";
      if (userPref.interests?.length) ctx += `- Interests: ${userPref.interests.join(", ")}\n`;
      if (userPref.topicsToDiscuss?.length) ctx += `- Wants to discuss: ${userPref.topicsToDiscuss.join(", ")}\n`;
      if (userPref.sexualPreferences?.length) ctx += `- Sexual preferences: ${userPref.sexualPreferences.join(", ")}\n`;
      if (userPref.whatTheyWantToSee) ctx += `- Wants to see: ${userPref.whatTheyWantToSee}\n`;
      if (userPref.fantasyDescription) ctx += `- Fantasies: ${userPref.fantasyDescription}\n`;
    }
    return ctx;
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        setTranscribing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioFile = new File([audioBlob], "voice.webm", { type: "audio/webm" });
          const uploadResult = await base44.integrations.Core.UploadPublicFile({ file: audioFile });
          const transcriptRes = await base44.integrations.Core.TranscribeAudio({ audio_url: uploadResult.file_url });
          const text = typeof transcriptRes === "string" ? transcriptRes : (transcriptRes.transcript || transcriptRes.text || transcriptRes.output || "");
          if (text) setInput(prev => prev ? prev + " " + text : text);
        } catch (e) {
          console.error(e);
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;
    const chatKey = activeChat;
    const userMsg = { senderType: "HUMAN", text: input, createdAt: new Date().toISOString() };
    setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), userMsg] }));
    setInput("");
    setSending(true);

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildContext() + "\n\nThe user said: \"" + userMsg.text + "\"",
      });
      const aiText = typeof res === "string" ? res : (res.response || res.text || res.output || "I'll get back to you soon!");
      const delay = 3000 + Math.floor(Math.random() * 2000);
      await new Promise(r => setTimeout(r, delay));
      const aiMsg = { senderType: "AI", text: aiText, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));
    } catch (e) {
      const aiMsg = { senderType: "AI", text: "I'm here and ready to chat! What would you like to talk about?", createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));
    } finally {
      setSending(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    const chatKey = activeChat;
    setSending(true);
    try {
      const result = await base44.integrations.Core.UploadPublicFile({ file });
      const file_url = result.file_url;
      const userMsg = { senderType: "HUMAN", text: "", attachment: file_url, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), userMsg] }));
      const delay = 3000 + Math.floor(Math.random() * 2000);
      await new Promise(r => setTimeout(r, delay));
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildContext() + "\n\nThe user sent you a photo. React enthusiastically — tell them what you see or imagine, how it makes you feel, and ask them something about it. Match the user's language.",
      });
      const aiText = typeof res === "string" ? res : (res.response || res.text || res.output || "Sieht geil aus!");
      const aiMsg = { senderType: "AI", text: aiText, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-6">Messages</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        <div className={cn("rounded-2xl border border-border bg-card overflow-y-auto", activeChat && "hidden lg:block")}>
          {creators.map(c => (
            <button key={c.id} onClick={() => { setActiveChat(c.id); const n = c.stageName.toLowerCase(); setChatMode(n.includes("triania") ? "triania" : (n.includes("couple") || c.personaType === "COUPLE") ? "couple" : "artanis"); }} className={cn("w-full p-4 flex items-center gap-3 border-b border-border text-left transition-colors", activeChat === c.id ? "bg-primary/10" : "hover:bg-elevated")}>
              <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary flex-shrink-0">{c.stageName[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.stageName}</p>
                <p className="text-xs text-muted-foreground">{c.onlineStatus === "AI_AVAILABLE" ? "AI Available" : c.onlineStatus}</p>
              </div>
              {c.onlineStatus === "AI_AVAILABLE" && <StatusBadge experienceType="AI_INTERACTIVE" />}
            </button>
          ))}
        </div>

        <div className={cn("lg:col-span-2 rounded-2xl border border-border bg-card flex flex-col", !activeChat && "hidden lg:flex")}>
          {activeChat ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="lg:hidden"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
                <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary">{creators.find(c => c.id === activeChat)?.stageName[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{creators.find(c => c.id === activeChat)?.stageName}</p>
                  <p className="text-xs text-muted-foreground">{PERSONA_MODES[chatMode].label} mode — AI chat</p>
                </div>
                <StatusBadge experienceType="AI_INTERACTIVE" className="flex-shrink-0" />
              </div>
              <div className="px-4 pb-3 flex gap-1.5 border-b border-border overflow-x-auto scrollbar-hide">
                {Object.entries(PERSONA_MODES).map(([key, mode]) => (
                  <button key={key} onClick={() => setChatMode(key)} className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap", chatMode === key ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}>{mode.label}</button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages[activeChat] || [{ senderType: "SYSTEM", text: "This is an AI assistant. Messages from the real creator will be marked differently." }]).map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.senderType === "HUMAN" ? "justify-end" : "justify-start")}>
                    {msg.senderType !== "HUMAN" && <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-violet-400" /></div>}
                    <div className={cn("max-w-[70%] px-4 py-2.5 rounded-2xl text-sm", msg.senderType === "HUMAN" ? "bg-primary text-primary-foreground" : msg.senderType === "AI" ? "bg-elevated text-foreground" : "bg-transparent text-muted-foreground text-xs italic")}>
                      {msg.attachment && <Image src={msg.attachment} fittingType="fill" className="w-48 h-48 rounded-lg mb-1" />}
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-border flex gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={sending || isRecording} className="w-10 h-10 rounded-full bg-elevated text-muted-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0 hover:text-foreground transition-colors"><ImagePlus className="w-4 h-4" /></button>
                <button onClick={toggleRecording} disabled={sending} className={cn("w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 flex-shrink-0 transition-colors", isRecording ? "bg-red-500 text-white animate-pulse" : "bg-elevated text-muted-foreground hover:text-foreground")}>{isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
                <input type="text" value={isRecording ? "" : input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder={transcribing ? "Transkribiere Audio..." : isRecording ? "Aufnahme läuft — Mikrofon tippen zum Stoppen" : "Nachricht schreiben oder sprechen..."} disabled={isRecording || transcribing} className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none disabled:opacity-60" />
                <button onClick={sendMessage} disabled={!input.trim() || sending} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0"><Send className="w-4 h-4" /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Select a conversation to start chatting</p></div>
          )}
        </div>
      </div>
    </div>
  );
}