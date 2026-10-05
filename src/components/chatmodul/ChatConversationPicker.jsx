import React, { useEffect, useState } from "react";
import { MessageSquarePlus, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setChatModule } from "@/lib/chatModule";

const when = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.toLocaleDateString("de-DE")} ${d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
};

// Die Gespräche, die hier schon laufen — sie lassen sich mit einem Klick in das
// Modul holen und dort weiterführen.
export default function ChatConversationPicker({ currentId, onPicked }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Conversation.filter({}, "-lastMessageAt", 50);
      setItems(list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Gespräche aus der Plattform
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Ein Gespräch auswählen — es läuft dann hier weiter, mit allem, was bisher geschrieben
            wurde.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="max-h-64 space-y-1.5 overflow-y-auto">
        <button
          onClick={() => {
            setChatModule({ conversationId: "" });
            onPicked?.();
          }}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm",
            !currentId ? "border-primary text-primary" : "border-border text-muted-foreground"
          )}
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0" />
          Eigenes Gespräch des Moduls
        </button>

        {items.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setChatModule({ conversationId: c.id });
              onPicked?.();
            }}
            className={cn(
              "w-full rounded-xl border px-3 py-2 text-left",
              currentId === c.id ? "border-primary" : "border-border"
            )}
          >
            <div className="truncate text-sm font-bold text-foreground">
              {c.creatorName || c.participantName || c.userName || "Gespräch"}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {c.participantId || ""} {c.lastMessageAt ? `· ${when(c.lastMessageAt)}` : ""}
            </div>
          </button>
        ))}

        {!loading && !items.length && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Noch keine Gespräche vorhanden.
          </p>
        )}
      </div>
    </div>
  );
}