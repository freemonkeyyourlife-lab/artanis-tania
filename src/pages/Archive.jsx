import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Download, MessageSquare, Stethoscope, Archive as ArchiveIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ArchiveRow from "@/components/archive/ArchiveRow";
import ChatTranscript from "@/components/archive/ChatTranscript";
import TherapyThread from "@/components/therapy/TherapyThread";
import SessionPlan from "@/components/therapy/SessionPlan";
import { downloadSession } from "@/lib/therapyExport";
import { downloadChat } from "@/lib/chatExport";

const TABS = [
  { value: "therapy", label: "Sprechstunde", icon: Stethoscope },
  { value: "chat", label: "Chats", icon: MessageSquare },
];

const THERAPY_STATUS = [
  { value: "ALLE", label: "Alle" },
  { value: "OPEN", label: "Offen" },
  { value: "DONE", label: "Beendet" },
];

const CHAT_KINDS = [
  { value: "ALLE", label: "Alle" },
  { value: "AI", label: "KI-Chats" },
  { value: "HUMAN", label: "Direktchats" },
];

const when = (iso) =>
  iso ? new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
      active ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);

export default function Archive() {
  const [allowed, setAllowed] = useState(null);
  const [tab, setTab] = useState("therapy");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALLE");
  const [kind, setKind] = useState("ALLE");
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ therapy: 0, chat: 0 });
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (me?.role !== "admin") { setAllowed(false); return; }
        setAllowed(true);
        const [therapy, chat] = await Promise.all([
          base44.entities.TherapySession.count({}),
          base44.entities.Conversation.count({}),
        ]);
        setCounts({ therapy, chat });
      } catch (e) {
        setAllowed(false);
      }
    })();
  }, []);

  // Die Liste kommt immer frisch vom Server — je nach Tab, Suche und Filter.
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const rx = { $regex: query.trim(), $options: "i" };
        let list;
        if (tab === "therapy") {
          const q = {};
          if (query.trim()) q.$or = [{ topic: rx }, { userName: rx }, { therapistName: rx }];
          if (status !== "ALLE") q.status = status;
          list = await base44.entities.TherapySession.filter(q, "-created_date", 100);
        } else {
          const q = {};
          if (query.trim()) q.$or = [{ userName: rx }, { creatorName: rx }, { participantName: rx }];
          if (kind !== "ALLE") q.conversationType = kind;
          list = await base44.entities.Conversation.filter(q, "-lastMessageAt", 100);
        }
        if (!cancelled) {
          setRows(list);
          setActiveId(null);
          setMessages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [allowed, tab, query, status, kind]);

  // Der komplette Verlauf des angeklickten Eintrags.
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    let cancelled = false;
    setLoadingMsgs(true);
    (async () => {
      try {
        const list = tab === "therapy"
          ? await base44.entities.TherapyMessage.filter({ sessionId: activeId }, "created_date", 500)
          : await base44.entities.Message.filter({ conversationId: activeId }, "created_date", 500);
        if (!cancelled) setMessages(list);
      } finally {
        if (!cancelled) setLoadingMsgs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeId, tab]);

  if (allowed === null) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!allowed) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Dieser Bereich ist nur für Admins.</p></div>;
  }

  const active = rows.find((r) => r.id === activeId) || null;
  const mediaCount = (list) => list.reduce((n, m) => n + (m.attachments?.length || (m.attachment ? 1 : 0)), 0);

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-foreground mb-2 flex items-center gap-2">
          <ArchiveIcon className="w-7 h-7 text-primary" /> Archiv
        </h1>
        <p className="text-sm text-muted-foreground">
          Jede geführte Sitzung und jeder Chat — komplett mit Bildern, Videos und Sprachnachrichten. Nichts wird gelöscht.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); setSearch(""); setQuery(""); }}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors",
              tab === t.value ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
            <span className="text-[11px] opacity-70">{counts[t.value]}</span>
          </button>
        ))}

        <div className="flex-1 min-w-[220px] flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "therapy" ? "Thema, Gast oder Therapeutin …" : "Gast oder Gesprächspartner …"}
            className="flex-1 bg-transparent text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {(tab === "therapy" ? THERAPY_STATUS : CHAT_KINDS).map((f) => (
          <Chip
            key={f.value}
            active={(tab === "therapy" ? status : kind) === f.value}
            onClick={() => (tab === "therapy" ? setStatus(f.value) : setKind(f.value))}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)]">
        <div className={cn("rounded-2xl border border-border bg-card overflow-hidden flex flex-col", active && "hidden lg:flex")}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Einträge</span>
            <span className="text-[11px] text-muted-foreground">{rows.length} angezeigt</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10 px-4">Nichts gefunden.</p>
            ) : (
              rows.map((r) =>
                tab === "therapy" ? (
                  <ArchiveRow
                    key={r.id}
                    active={r.id === activeId}
                    title={r.topic || "Ohne Thema"}
                    subtitle={`${r.anonymous ? "Anonym" : r.userName || "Unbekannt"} · ${r.therapistName || "Tania"}`}
                    meta={when(r.created_date)}
                    badge={r.status === "DONE" ? "beendet" : "offen"}
                    onClick={() => setActiveId(r.id)}
                  />
                ) : (
                  <ArchiveRow
                    key={r.id}
                    active={r.id === activeId}
                    title={r.userName || "Gast"}
                    subtitle={r.conversationType === "HUMAN" ? `Direktchat · ${r.participantName || "?"}` : `KI-Chat · ${r.creatorName || "?"}`}
                    meta={when(r.lastMessageAt || r.created_date)}
                    badge={r.conversationType === "HUMAN" ? "direkt" : "KI"}
                    onClick={() => setActiveId(r.id)}
                  />
                )
              )
            )}
          </div>
        </div>

        <div className={cn("lg:col-span-2 rounded-2xl border border-border bg-card flex flex-col overflow-hidden", !active && "hidden lg:flex")}>
          {active ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <button onClick={() => setActiveId(null)} className="lg:hidden text-xs text-muted-foreground">Zurück</button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {tab === "therapy" ? active.topic || "Ohne Thema" : `${active.userName || "Gast"} · ${active.creatorName || active.participantName || ""}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {messages.length} Nachrichten · {mediaCount(messages)} Medien
                  </p>
                </div>
                <button
                  onClick={() => (tab === "therapy" ? downloadSession(active, messages) : downloadChat(active, messages))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Herunterladen
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                {loadingMsgs && messages.length === 0 ? (
                  <div className="flex justify-center py-16"><div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-16">Hier wurde nichts geschrieben.</p>
                ) : tab === "therapy" ? (
                  <>
                    <SessionPlan session={active} />
                    <div className="mt-4">
                      <TherapyThread messages={messages} />
                    </div>
                  </>
                ) : (
                  <ChatTranscript messages={messages} userName={active.userName} />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center px-6 text-center">
              <p className="text-sm text-muted-foreground">Links einen Eintrag auswählen — der komplette Verlauf steht dann hier.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}