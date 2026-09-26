import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GroupChat({ group, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const data = await base44.entities.GroupMessage.filter({ groupId: group.id }, "created_date", 50);
        setMessages(data);
      } catch (e) { console.error(e); }
    };
    init();
  }, [group.id]);

  useEffect(() => {
    const unsubscribe = base44.entities.GroupMessage.subscribe((event) => {
      if (event.type !== "create" || event.data?.groupId !== group.id) return;
      setMessages((prev) => prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]);
    });
    return unsubscribe;
  }, [group.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const text = input;
    setInput("");
    setSending(true);
    try {
      const msg = await base44.entities.GroupMessage.create({
        groupId: group.id,
        senderId: user.id,
        senderName: user.full_name || user.email,
        senderType: "HUMAN",
        text
      });
      setMessages(prev => [...prev, msg]);
      await base44.entities.ChatGroup.update(group.id, { lastActivity: new Date().toISOString() });
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack}><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
        <div className="flex-1">
          <h1 className="font-display text-xl text-foreground">{group.title}</h1>
          <p className="text-xs text-muted-foreground">{group.memberCount || 0} Mitglieder</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card flex flex-col h-[calc(100vh-240px)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2", msg.senderId === user?.id ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[70%] px-4 py-2.5 rounded-2xl text-sm", msg.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground")}>
                {msg.senderId !== user?.id && <p className="text-xs text-muted-foreground mb-0.5">{msg.senderName}</p>}
                {msg.text}
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">Noch keine Nachrichten — fang einfach an!</p>}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-border flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Nachricht schreiben..." className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none" />
          <button onClick={sendMessage} disabled={!input.trim() || sending} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}