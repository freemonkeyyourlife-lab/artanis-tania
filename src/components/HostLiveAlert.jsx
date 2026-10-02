import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Radio, X } from "lucide-react";
import { fetchLiveRoom } from "@/lib/liveRoom";

const KEY = "liveAlertSeen";

// Überall in der App: Hinweis, sobald der Gastgeber live geht.
export default function HostLiveAlert() {
  const [room, setRoom] = useState(null);
  const [seen, setSeen] = useState(() => {
    try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; }
  });
  const { pathname } = useLocation();

  useEffect(() => {
    let unsubscribe;
    let alive = true;
    (async () => {
      try {
        const current = await fetchLiveRoom();
        if (alive) setRoom(current);
      } catch (error) {
        // Zu viele Anfragen — der Hinweis kommt später über die Live-Verbindung.
      }
      unsubscribe = base44.entities.LiveRoom.subscribe((event) => {
        if (event.data) setRoom(event.data);
      });
      if (!alive) unsubscribe?.();
    })();
    return () => { alive = false; unsubscribe?.(); };
  }, []);

  const dismiss = () => {
    const stamp = room?.startedAt || "1";
    try { localStorage.setItem(KEY, stamp); } catch (e) { /* ignore */ }
    setSeen(stamp);
  };

  if (!room?.isLive) return null;
  // Im Call selbst braucht es den Hinweis nicht.
  if (pathname.startsWith("/call")) return null;
  if (room.startedAt && room.startedAt === seen) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md">
      {/* Die ganze Meldung ist der Weg hinein — kein Umweg über die Navigation. */}
      <Link
        to={`/call/${room.token}`}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl glass-strong border border-red-500/40 accent-glow-strong hover:border-red-500/70 transition-colors"
      >
        <span className="relative flex w-2.5 h-2.5 flex-shrink-0">
          <span className="absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-75 animate-ping" />
          <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-red-500" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {room.hostName || "Der Gastgeber"} ist jetzt live
          </p>
          <p className="text-xs text-muted-foreground">Kamera läuft — antippen und direkt dabei sein.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-500 text-white text-xs font-semibold flex-shrink-0">
          <Radio className="w-3.5 h-3.5" /> Rein
        </span>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(); }}
          title="Ausblenden"
          className="text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </Link>
    </div>
  );
}