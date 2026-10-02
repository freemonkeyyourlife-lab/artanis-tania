import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bot, Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const RANGES = [
  { id: "today", label: "Heute" },
  { id: "7", label: "7 Tage" },
  { id: "30", label: "30 Tage" },
  { id: "all", label: "Alles" },
];

const PAGE = 50;

// Was die KI geantwortet hat, während du weg warst — jede Antwort mit Uhrzeit,
// Charakter und Gegenüber, nach Tagen geordnet.
export default function AiLogbook() {
  const [range, setRange] = useState("7");
  const [items, setItems] = useState([]);
  const [convs, setConvs] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);

  const buildQuery = () => {
    const q = { senderType: "AI", humanOverride: { $ne: true } };
    if (range === "today") q.created_date = { $gte: moment().startOf("day").toISOString() };
    else if (range !== "all") q.created_date = { $gte: moment().subtract(Number(range), "days").startOf("day").toISOString() };
    return q;
  };

  useEffect(() => { load(); }, [range]);

  const load = async () => {
    setLoading(true);
    try {
      const [page, convList] = await Promise.all([
        base44.entities.Message.filter(buildQuery(), { sort: "-created_date", limit: PAGE }),
        base44.entities.Conversation.list("-lastMessageAt", 300),
      ]);
      setItems(page.items || []);
      setCursor(page.next_cursor || null);
      setHasMore(!!page.has_more);
      setConvs(convList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!cursor || more) return;
    setMore(true);
    try {
      const page = await base44.entities.Message.filter(buildQuery(), { sort: "-created_date", limit: PAGE, cursor });
      setItems((prev) => [...prev, ...(page.items || [])]);
      setCursor(page.next_cursor || null);
      setHasMore(!!page.has_more);
    } catch (e) {
      console.error(e);
    } finally {
      setMore(false);
    }
  };

  const convById = useMemo(() => new Map(convs.map((c) => [c.id, c])), [convs]);

  const days = useMemo(() => {
    const out = [];
    for (const m of items) {
      const key = moment(m.created_date).format("YYYY-MM-DD");
      let group = out[out.length - 1];
      if (!group || group.key !== key) {
        group = {
          key,
          label: moment(m.created_date).calendar(null, {
            sameDay: "[Heute]",
            lastDay: "[Gestern]",
            lastWeek: "dddd",
            sameElse: "DD.MM.YYYY",
          }),
          entries: [],
        };
        out.push(group);
      }
      group.entries.push(m);
    }
    return out;
  }, [items]);

  const todayCount = items.filter((m) => moment(m.created_date).isSame(moment(), "day")).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="font-display text-xl text-foreground">KI-Logbuch</h2>
          <p className="text-xs text-muted-foreground">
            Jede Antwort, die der Bot geschrieben hat, während du weg warst. Heute: {todayCount}.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-xs font-bold text-foreground"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Aktualisieren
        </button>
      </div>

      <div className="flex flex-wrap gap-2 my-5">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition-colors",
              range === r.id ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Bot className="w-6 h-6" />
          <p className="text-sm">In diesem Zeitraum hat die KI nichts geschrieben.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <div key={day.key}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {day.label} · {day.entries.length}
              </p>
              <div className="space-y-3">
                {day.entries.map((m) => {
                  const conv = convById.get(m.conversationId);
                  return (
                    <div key={m.id} className="rounded-2xl border border-border bg-elevated p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-600/20 text-violet-300 text-[11px] font-semibold uppercase tracking-wider">
                          <Bot className="w-3 h-3" /> KI
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {m.sender || conv?.creatorName || "Charakter"}
                        </span>
                        {conv?.userName && (
                          <span className="text-xs text-muted-foreground">an {conv.userName}</span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {moment(m.created_date).format("HH:mm")}
                        </span>
                      </div>
                      <p className="text-[15px] text-foreground whitespace-pre-line leading-relaxed">{m.text}</p>
                      {m.suggestions?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {m.suggestions.map((s, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      <Link
                        to="/messages"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-primary hover:underline"
                      >
                        Zum Chat <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={more}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-sm font-bold text-foreground disabled:opacity-50"
              >
                {more && <Loader2 className="w-4 h-4 animate-spin" />} Ältere Antworten laden
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}