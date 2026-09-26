import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import LiveStreamForm from "@/components/studio/LiveStreamForm";

const PLATFORM_LABEL = {
  STRIPCHAT: "Stripchat",
  CHATURBATE: "Chaturbate",
  CAM4: "CAM4",
  BONGACAMS: "BongaCams",
  MYFREECAMS: "MyFreeCams",
  ANDERE: "Andere",
};

const STATUS_LABEL = { OFFLINE: "Offline", SCHEDULED: "Geplant", LIVE: "Live", ENDED: "Beendet" };

export default function LiveManager() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { setStreams(await base44.entities.LiveStream.list("-created_date")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const remove = async (s) => {
    if (!window.confirm(`"${s.title}" wirklich löschen?`)) return;
    await base44.entities.LiveStream.delete(s.id);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          <Plus className="w-4 h-4" /> Neuer Live-Stream
        </button>
      </div>

      {editing && (
        <div className="mb-6">
          <LiveStreamForm
            initial={editing === "new" ? null : editing}
            onSaved={() => { setEditing(null); load(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {streams.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">
          Noch kein Live-Stream — leg deinen Stripchat-Raum an, dann sehen alle in der App, wann du live bist.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {streams.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${s.status === "LIVE" ? "bg-red-500/90 text-white" : "bg-elevated text-muted-foreground"}`}>
                      {STATUS_LABEL[s.status] || s.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {PLATFORM_LABEL[s.platform] || s.platform}
                    {s.embedUrl ? " · mit Embed" : ""}
                  </p>
                  {s.roomUrl && <p className="text-xs text-muted-foreground mt-1 truncate">{s.roomUrl}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setEditing(s)} className="w-9 h-9 rounded-full bg-elevated border border-border text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(s)} className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}