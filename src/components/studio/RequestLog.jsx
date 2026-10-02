import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, RefreshCw, Lightbulb, MessagesSquare, ShoppingCart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SOURCES = [
  { id: "ALLE", label: "Alle" },
  { id: "COMMUNITY", label: "Community" },
  { id: "CHAT", label: "Chat" },
  { id: "KAUF", label: "Kauf" },
];

const SOURCE_LOOK = {
  COMMUNITY: { icon: Lightbulb, label: "Community", to: "/community" },
  CHAT: { icon: MessagesSquare, label: "Chat", to: "/leitstand" },
  KAUF: { icon: ShoppingCart, label: "Kauf", to: "/admin" },
};

const COMMUNITY_STATUS = {
  NEW: { label: "Neu", tone: "bg-primary/20 text-primary" },
  REVIEWED: { label: "Gesehen", tone: "bg-muted text-muted-foreground" },
  PLANNED: { label: "Geplant", tone: "bg-violet-600/25 text-violet-300" },
  RECORDED: { label: "Gedreht", tone: "bg-amber-500/20 text-amber-300" },
  CREATED: { label: "Erstellt", tone: "bg-emerald-600/20 text-emerald-400" },
  DECLINED: { label: "Abgelehnt", tone: "bg-destructive/15 text-destructive" },
};

const TX_STATUS = {
  PENDING: { label: "Offen", tone: "bg-amber-500/20 text-amber-300" },
  PAID: { label: "Bezahlt", tone: "bg-emerald-600/20 text-emerald-400" },
  FAILED: { label: "Fehlgeschlagen", tone: "bg-destructive/15 text-destructive" },
  REFUNDED: { label: "Erstattet", tone: "bg-muted text-muted-foreground" },
  CHARGEBACK: { label: "Rückbuchung", tone: "bg-destructive/15 text-destructive" },
};

const REQUEST_KIND = {
  VIDEO_IDEA: "Video-Idee",
  PHOTO_IDEA: "Foto-Idee",
  STORY_IDEA: "Story-Idee",
  LIVE_TOPIC: "Live-Thema",
  INTERACTIVE_IDEA: "Interaktiv-Idee",
  QUESTION: "Frage",
  CUSTOM_REQUEST: "Sonderwunsch",
  DISCUSSION_TOPIC: "Diskussionsthema",
  SEXUAL_DIRECTION: "Richtung",
};

const TX_KIND = {
  FREE: "Gratis",
  PPV: "Einzelbild",
  VIP: "VIP",
  TIP: "Trinkgeld",
  BOOKING: "Buchung",
  PRIVATE_SESSION: "Private Sitzung",
  INTERACTIVE_PURCHASE: "Interaktiv-Kauf",
  CUSTOM_CONTENT: "Wunschinhalt",
  COIN_PURCHASE: "Coins",
};

const asArray = (res) => (Array.isArray(res) ? res : res?.items || []);

const when = (d) =>
  d ? new Date(d).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

// Ein Log über alle Anfragen: Wünsche aus der Community, wartende Gäste im Chat
// und Kauf-Anfragen. Es hält sich selbst aktuell.
export default function RequestLog() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("ALLE");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const timer = useRef(null);

  useEffect(() => { load(tick > 0); }, [tick]);

  // Kommt etwas Neues herein, holt sich das Log es kurz danach von selbst nach.
  useEffect(() => {
    const bump = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setTick((n) => n + 1), 2500);
    };
    const subs = [
      base44.entities.CommunityRequest.subscribe(bump),
      base44.entities.Conversation.subscribe(bump),
      base44.entities.Transaction.subscribe(bump),
    ];
    return () => {
      clearTimeout(timer.current);
      subs.forEach((u) => u && u());
    };
  }, []);

  const load = async (silent) => {
    if (!silent) setLoading(true);
    try {
      const [wishes, chats, buys] = await Promise.all([
        base44.entities.CommunityRequest.list("-created_date", 150),
        base44.entities.Conversation.filter(
          { conversationType: "AI", waitingSince: { $exists: true } },
          { sort: "-waitingSince", limit: 150 }
        ),
        base44.entities.Transaction.list("-created_date", 150),
      ]);

      const next = [
        ...asArray(wishes).map((r) => ({
          key: `C|${r.id}`,
          source: "COMMUNITY",
          title: r.title || "Anfrage",
          tag: REQUEST_KIND[r.type] || "",
          sub: `${r.userName || "Jemand"}${r.creatorName ? ` → ${r.creatorName}` : ""}${
            r.votes ? ` · ${r.votes} Stimmen` : ""
          }`,
          at: r.created_date,
          status: COMMUNITY_STATUS[r.status] || COMMUNITY_STATUS.NEW,
        })),
        ...(chats.items || []).map((c) => ({
          key: `H|${c.id}`,
          source: "CHAT",
          title: `${c.userName || "Ein Gast"} will mit ${c.creatorName || "einem Charakter"} chatten`,
          tag: "",
          sub: c.notifiedAt ? `benachrichtigt ${when(c.notifiedAt)}` : "noch nicht benachrichtigt",
          at: c.lastGuestMessageAt || c.waitingSince,
          status:
            c.handledBy === "HUMAN"
              ? { label: "Übernommen", tone: "bg-emerald-600/20 text-emerald-400" }
              : { label: "Wartet", tone: "bg-amber-500/20 text-amber-300" },
        })),
        ...asArray(buys).map((t) => ({
          key: `T|${t.id}`,
          source: "KAUF",
          title: `${t.amount} ${t.currency || "EUR"}`,
          tag: TX_KIND[t.type] || t.type || "",
          sub: "Anfrage aus dem Chat",
          at: t.created_date,
          status: TX_STATUS[t.status] || TX_STATUS.PENDING,
        })),
      ].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

      setEntries(next);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const counts = {
    ALLE: entries.length,
    COMMUNITY: entries.filter((e) => e.source === "COMMUNITY").length,
    CHAT: entries.filter((e) => e.source === "CHAT").length,
    KAUF: entries.filter((e) => e.source === "KAUF").length,
  };
  const visible = entries.filter((e) => filter === "ALLE" || e.source === filter);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-xl text-foreground mb-1">Anfragen-Log</h2>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Alles, was hereinkommt, in einer Zeitleiste: Wünsche aus der Community, Gäste, die im Chat auf dich warten,
            und Kauf-Anfragen. Das Log hält sich selbst aktuell.
          </p>
        </div>
        <button
          onClick={() => setTick((n) => n + 1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-elevated border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Neu laden
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-colors",
              filter === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label} ({counts[s.id]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">Hier ist gerade nichts.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((e) => {
            const look = SOURCE_LOOK[e.source];
            const Icon = look.icon;
            return (
              <div key={e.key} className="flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border">
                <span className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{e.title}</p>
                    {e.tag && (
                      <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                        {e.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {look.label} · {when(e.at)}
                    {e.sub ? ` · ${e.sub}` : ""}
                  </p>
                </div>
                <span className={cn("px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap", e.status.tone)}>
                  {e.status.label}
                </span>
                <Link
                  to={look.to}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-background border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                >
                  Öffnen <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}