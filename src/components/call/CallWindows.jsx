import React, { useEffect, useState } from "react";
import { Plus, Minus, RotateCcw, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import CallChat from "@/components/call/CallChat";
import CallStagePanel from "@/components/call/CallStagePanel";
import CallBotPanel from "@/components/call/CallBotPanel";
import CallSharePanel from "@/components/call/CallSharePanel";
import CallGuestInvites from "@/components/call/CallGuestInvites";
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

export default function CallWindows({ messages, mySeat, onSend, onSendVoice, token, roomNumber, rooms, isHost, onOpen, onNewRoom, invites, onCreateInvite, onRevokeInvite, stage, stageLines, onOpenStage, onCloseStage, onSayStage }) {
  const [cfg, setCfg] = useState(() => loadWindows());
  const [tab, setTab] = useState(() => loadWindows().open[0] || "chat");
  const wide = useWide();

  useEffect(() => subscribeWindows(() => setCfg(loadWindows())), []);

  // Einladen darf nur der Gastgeber — bei allen anderen bleiben die Fenster zum
  // Teilen und zu den Gäste-Links deshalb gar nicht erst in der Liste.
  const order = isHost ? cfg.order : cfg.order.filter((id) => id !== "share" && id !== "guests");
  const openIds = order.filter((id) => cfg.open.includes(id));
  const closedIds = order.filter((id) => !cfg.open.includes(id));
  const active = openIds.includes(tab) ? tab : openIds[0] || null;

  const content = (id) =>
    id === "chat" ? (
      <CallChat messages={messages} mySeat={mySeat} onSend={onSend} onSendVoice={onSendVoice} />
    ) : id === "stage" ? (
      <CallStagePanel
        stage={stage}
        stageLines={stageLines}
        mySeat={mySeat}
        isHost={isHost}
        onOpen={onOpenStage}
        onClose={onCloseStage}
        onSay={onSayStage}
      />
    ) : id === "guests" ? (
      <CallGuestInvites token={token} roomNumber={roomNumber} invites={invites} onCreate={onCreateInvite} onRevoke={onRevokeInvite} />
    ) : id === "share" ? (
      <CallSharePanel token={token} roomNumber={roomNumber} rooms={rooms} isHost={isHost} onOpen={onOpen} onNewRoom={onNewRoom} />
    ) : (
      <CallBotPanel token={token} roomNumber={roomNumber} isHost={isHost} />
    );

  const titleOf = (id) => WINDOW_DEFS.find((w) => w.id === id)?.title || id;
  const hintOf = (id) => WINDOW_DEFS.find((w) => w.id === id)?.hint || "";

  const bar = (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border flex-shrink-0 overflow-x-auto scrollbar-hide">
      <span className="text-[13px] font-bold text-muted-foreground whitespace-nowrap">Fenster</span>
      <button type="button" onClick={() => setTextSize(cfg.textSize - 1)} disabled={cfg.textSize <= MIN_TEXT} className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center text-muted-foreground disabled:opacity-40 flex-shrink-0" title="Schrift kleiner">
        <Minus className="w-4 h-4" />
      </button>
      <span className="inline-flex items-center gap-1 text-[13px] text-muted-foreground whitespace-nowrap">
        <Type className="w-4 h-4" /> {cfg.textSize}
      </span>
      <button type="button" onClick={() => setTextSize(cfg.textSize + 1)} disabled={cfg.textSize >= MAX_TEXT} className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center text-muted-foreground disabled:opacity-40 flex-shrink-0" title="Schrift größer">
        <Plus className="w-4 h-4" />
      </button>
      {closedIds.map((id) => (
        <button key={id} type="button" onClick={() => openWindow(id)} className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-elevated border border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground whitespace-nowrap flex-shrink-0">
          <Plus className="w-3.5 h-3.5" /> {titleOf(id)}
        </button>
      ))}
      <button type="button" onClick={resetWindows} className="ml-auto w-9 h-9 rounded-full bg-elevated flex items-center justify-center text-muted-foreground flex-shrink-0" title="Fenster-Anordnung zurücksetzen">
        <RotateCcw className="w-4 h-4" />
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
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border overflow-x-auto scrollbar-hide flex-shrink-0">
          {openIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn("px-4 py-2.5 rounded-full text-[14px] font-bold whitespace-nowrap flex-shrink-0", active === id ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground")}
            >
              {titleOf(id)}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0 p-3">
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
      <div className="flex-1 min-h-0 flex flex-col gap-3 p-3 overflow-y-auto">
        {openIds.map((id) => (
          <CallWindowFrame key={id} id={id} title={titleOf(id)} hint={hintOf(id)} wide>
            {content(id)}
          </CallWindowFrame>
        ))}
        <button type="button" onClick={() => closeWindow(openIds[openIds.length - 1])} className="text-[13px] text-muted-foreground hover:text-foreground py-1.5 flex-shrink-0">
          letztes Fenster schließen
        </button>
      </div>
    </div>
  );
}