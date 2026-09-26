import React from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Lock, Monitor, MonitorOff } from "lucide-react";
import { cn } from "@/lib/utils";

const ROOM_MODES = [
  { id: "OPEN", label: "Offen", hint: "Alle mit dem Link kommen rein" },
  { id: "WATCH", label: "Zuschauer", hint: "Neue schauen nur heimlich zu" },
  { id: "PRIVATE", label: "Privat", hint: "Raum geschlossen — niemand Neues kommt rein" },
];

export default function CallControls({
  micOn, camOn, toggleMic, toggleCam, onEnd,
  isHost, allowCam, allowMic, setGuestCam, setGuestMic,
  sharing, onToggleShare, mode, setMode,
}) {
  const micBlocked = !isHost && !allowMic;
  const camBlocked = !isHost && !allowCam;

  return (
    <div className="border-t border-border">
      {isHost && (
        <div className="px-4 py-3 border-b border-border space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Zugang</span>
            {ROOM_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                title={m.hint}
                className={cn("px-4 py-2 rounded-full text-xs font-semibold transition-colors", mode === m.id ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground")}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Gäste</span>
          <button
            onClick={() => setGuestCam(!allowCam)}
            className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors", allowCam ? "bg-elevated text-foreground" : "bg-destructive text-white")}
          >
            {allowCam ? <VideoIcon className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            Gäste-Kamera {allowCam ? "erlaubt" : "gesperrt"}
          </button>
          <button
            onClick={() => setGuestMic(!allowMic)}
            className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors", allowMic ? "bg-elevated text-foreground" : "bg-destructive text-white")}
          >
            {allowMic ? <Mic className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            Gäste-Mikrofon {allowMic ? "erlaubt" : "gesperrt"}
          </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 py-4">
        <button
          onClick={toggleMic}
          disabled={micBlocked}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-40", micOn ? "bg-elevated text-foreground" : "bg-destructive text-white")}
          title={micBlocked ? "Der Gastgeber hat Mikrofone gesperrt" : micOn ? "Mikrofon aus" : "Mikrofon an"}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleCam}
          disabled={camBlocked}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-40", camOn ? "bg-elevated text-foreground" : "bg-destructive text-white")}
          title={camBlocked ? "Der Gastgeber hat Kameras gesperrt" : camOn ? "Kamera aus" : "Kamera an"}
        >
          {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button
          onClick={onToggleShare}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", sharing ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground")}
          title={sharing ? "Bildschirm-Teilen beenden" : "Bildschirm teilen"}
        >
          {sharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>
        <button
          onClick={onEnd}
          className="w-14 h-14 rounded-full bg-destructive text-white flex items-center justify-center"
          title="Call verlassen"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}