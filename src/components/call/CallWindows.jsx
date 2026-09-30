import React, { useEffect, useState } from "react";
import { Plus, Minus, RotateCcw, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import CallChat from "@/components/call/CallChat";
import CallBotPanel from "@/components/call/CallBotPanel";
import CallSharePanel from "@/components/call/CallSharePanel";
import CallWindowFrame from "@/components/call/CallWindowFrame";
import {
  WINDOW_DEFS, MIN_TEXT, MAX_TEXT, loadWindows, openWindow, closeWindow,
  setTextSize, resetWindows, subscribeWindows,
} from "@/lib/callWindows";

// Mehrere Fenster gleichzeitig: jedes hat eigenen Verlauf, eigene Eingabe und
// eigenen Scroll-Stand. Auf schmalen Displays wird daraus eine Umschaltung,
// damit sich nichts übereinanderlegt.
function useWide() {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => setWide(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return wide;
}

export default function CallWindows({ messages, mySeat, onSend, onSendVoice, token, roomNumber, rooms, isHost, onOpen, onNewRoom }) {
  const [cfg, setCfg] = useState(() => loadWindows());
  const [tab, setTab] = useState(() => loadWindows().open[0] || "chat");
  const wide = useWide();

  useEffect(() => subscribeWindows(() => setCfg(loadWindows())), []);

  const openIds = cfg.order.filter((id) => cfg.open.includes(id));
  const closedIds = cfg.order.filter((id) => !cfg.open.includes(id));
  const active = openIds.includes(tab) ? tab : openIds[0] || null;

  const content = (id) =>
    id === "chat" ? (
      <CallChat messages={messages} mySeat={mySeat} onSend={onSend} onSendVoice={onSendVoice} />
    ) : id === "share" ? (
      <CallSharePanel token={token} roomNumber={roomNumber} rooms={rooms} isHost={isHost} onOpen={onOpen} onNewRoom={onNewRoom} />
    ) : (
      <CallBotPanel />
    );

  const titleOf = (id) => WINDOW_DEFS.find((w) => w.id === id)?.title || id;
  const hintOf = (id) => WINDOW_DEFS.find((w) => w.id === id)?.hint || "";

  const bar = (
    <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border flex-shrink-0 overflow-x-auto scrollbar-hide">
      <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">Fenster</span>
      <button type="button" onClick={() => setTextSize(cfg.textSize - 1)} disabled={cfg.textSize <= MIN_TEXT} className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-muted-foreground disabled:opacity-40 flex-shrink-0" title="Schrift kleiner">
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
        <Type className="w-3 h-3" /> {cfg.textSize}
      </span>
      <button type="button" onClick={() => setTextSize(cfg.textSize + 1)} disabled={cfg.textSize >= MAX_TEXT} className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-muted-foreground disabled:opacity-40 flex-shrink-0" title="Schrift größer">
        <Plus className="w-3.5 h-3.5" />
      </button>
      {closedIds.map((id) => (
        <button key={id} type="button" onClick={() => openWindow(id)} className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-elevated border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground whitespace-nowrap flex-shrink-0">
          <Plus className="w-3 h-3" /> {titleOf(id)}
        </button>
      ))}
      <button type="button" onClick={resetWindows} className="ml-auto w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-muted-foreground flex-shrink-0" title="Fenster-Anordnung zurücksetzen">
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  if (openIds.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-card border-l border-border" style={{ zoom: cfg.textSize / 13 }}>
        {bar}
        <p className="p-4 text-xs text-muted-foreground">
          Alle Fenster sind zu. Oben holst du sie zurück — nichts wurde gelöscht.
        </p>
      </div>
    );
  }

  if (!wide) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-card border-l border-border" style={{ zoom: cfg.textSize / 13 }}>
        {bar}
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border overflow-x-auto scrollbar-hide flex-shrink-0">
          {openIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn("px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap flex-shrink-0", active === id ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground")}
            >
              {titleOf(id)}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 p-2">
          <CallWindowFrame id={active} title={titleOf(active)} hint={hintOf(active)} wide={false}>
            {content(active)}
          </CallWindowFrame>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border-l border-border" style={{ zoom: cfg.textSize / 13 }}>
      {bar}
      <div className="flex-1 min-h-0 flex flex-col gap-2 p-2 overflow-y-auto">
        {openIds.map((id) => (
          <CallWindowFrame key={id} id={id} title={titleOf(id)} hint={hintOf(id)} wide>
            {content(id)}
          </CallWindowFrame>
        ))}
        <button type="button" onClick={() => closeWindow(openIds[openIds.length - 1])} className="text-[11px] text-muted-foreground hover:text-foreground py-1 flex-shrink-0">
          letztes Fenster schließen
        </button>
      </div>
    </div>
  );
}