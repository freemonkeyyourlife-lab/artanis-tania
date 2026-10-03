import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MessageSquare, Send, ShieldCheck, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isGodMode, subscribeGodMode } from "@/lib/godMode";
import { getViewAs, setViewAs, subscribeViewAs, testUsers } from "@/lib/viewAs";
import { useFocus, useFocusTracker } from "@/lib/godFocus";

// Die Konsole am rechten Rand: sie schreibt mit, auf welcher Seite du bist und
// worüber deine Maus gerade steht. Du tippst hinein, was du meinst — die Notiz
// hängt an genau dieser Stelle. Sie bleibt auch in der Nutzer-Ansicht stehen,
// damit du beim Chat-Testen reden kannst, ohne den Platz zu verlassen.
export default function GuideConsole() {
  const [god, setGod] = useState(isGodMode);
  const [viewAs, setView] = useState(getViewAs);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState([]);

  const visible = isAdmin && (god || !!viewAs);
  const focus = useFocus();
  const page = window.location.pathname;

  useFocusTracker(visible && !god);

  useEffect(() => subscribeGodMode(() => setGod(isGodMode())), []);
  useEffect(() => subscribeViewAs(() => setView(getViewAs())), []);
  useEffect(() => {
    base44.auth
      .me()
      .then((u) => setIsAdmin(u?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  const load = () =>
    base44.entities.DesignNote.filter({ page }, { sort: "-created_date", limit: 30 })
      .then((res) => setNotes(res.items))
      .catch(() => setNotes([]));

  useEffect(() => {
    if (!open || !visible) return;
    load();
    window.addEventListener("artanis:design-note", load);
    return () => window.removeEventListener("artanis:design-note", load);
  }, [open, visible, page]);

  if (!visible) return null;

  const users = testUsers();
  const normalUser = users.find((u) => u.memberStatus !== "GOLD") || users[0];

  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await base44.entities.DesignNote.create({
        page,
        kind: focus ? "ELEMENT" : "PAGE",
        label: focus?.label || page,
        tag: focus?.tag || "",
        note: text.trim(),
      });
      setText("");
      load();
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Konsole öffnen"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[85] glass-strong rounded-l-2xl border-2 border-r-0 border-primary/40 px-2 py-4 flex flex-col items-center gap-2 hover:border-primary transition-colors"
      >
        <MessageSquare className="w-5 h-5 text-primary" />
        <span className="text-[11px] font-bold tracking-wider" style={{ writingMode: "vertical-rl" }}>
          KONSOLE
        </span>
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-[380px] max-w-[92vw] z-[85] glass-strong border-l-2 border-primary/40 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <p className="text-[13px] font-bold uppercase tracking-wider text-foreground">Konsole</p>
          <span className="px-2 py-0.5 rounded-full bg-elevated border border-border text-[11px] font-bold text-muted-foreground">
            {viewAs ? "Nutzer-Ansicht" : "God Mode"}
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-7 h-7 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-3 border-b-2 border-border space-y-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Du bist hier</p>
          <p className="text-[14px] font-bold text-primary break-all">{page}</p>
        </div>
        <div className="rounded-xl bg-elevated border border-border px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Maus steht auf</p>
          <p className={cn("text-[13px] font-semibold", focus ? "text-foreground" : "text-muted-foreground")}>
            {focus ? focus.label : "noch nichts — fahr über die Stelle, die du meinst"}
          </p>
        </div>
      </div>

      <div className="px-4 py-3 border-b-2 border-border">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          }}
          rows={3}
          placeholder="Was meinst du hier? (⌘/Ctrl + Enter zum Senden)"
          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
        />
        <div className="flex items-center gap-1.5 mt-2">
          <button
            onClick={send}
            disabled={!text.trim() || busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Senden
          </button>
          <button
            onClick={() => setViewAs(viewAs ? null : normalUser)}
            disabled={!viewAs && !normalUser}
            title={viewAs ? "Zurück zu deiner Ansicht" : "Die App als normaler Nutzer testen"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            {viewAs ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
            {viewAs ? "Zurück zu mir" : "Als Nutzer"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Was du hier schon gesagt hast
        </p>
        {notes.length === 0 ? (
          <p className="text-[13px] font-semibold text-muted-foreground">Noch nichts notiert.</p>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-xl bg-elevated border border-border p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary break-all">
                  {n.kind === "PAGE" ? "Seite" : n.label || "Element"}
                </p>
                <p className="text-[13px] font-semibold text-foreground mt-1 whitespace-pre-wrap">{n.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}