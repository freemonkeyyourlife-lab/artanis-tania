import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Bot, ArrowLeft } from "lucide-react";
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
  const messagesEndRef = useRef(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const data = await base44.entities.Creator.list();
      setCreators(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;
    const creator = creators.find(c => c.id === activeChat);
    const chatKey = activeChat;
    const userMsg = { senderType: "HUMAN", text: input, createdAt: new Date().toISOString() };
    setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), userMsg] }));
    setInput("");
    setSending(true);

    try {
      const persona = PERSONA_MODES[chatMode];
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: persona.prompt + "\n\nThe user said: \"" + userMsg.text + "\"",
      });
      const aiText = typeof res === "string" ? res : (res.response || res.text || res.output || "I'll get back to you soon!");
      const aiMsg = { senderType: "AI", text: aiText, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));
    } catch (e) {
      const aiMsg = { senderType: "AI", text: "I'm here and ready to chat! What would you like to talk about?", createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));
    } finally {
      setSending(false);
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
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-border flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message..." className="flex-1 px-4 py-2.5 rounded-full bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
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