import React from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Monitor, MonitorOff, MonitorUp } from "lucide-react";
import { cn } from "@/lib/utils";
import PaymentLinkDialog from "@/components/pay/PaymentLinkDialog";

const ROOM_MODES = [
  { id: "OPEN", label: "Offen", hint: "Alle mit dem Link kommen rein" },
  { id: "WATCH", label: "Zuschauer", hint: "Neue schauen nur heimlich zu" },
  { id: "PRIVATE", label: "Privat", hint: "Raum geschlossen — herein kommt nur, wer einen persönlichen Einladungslink hat" },
];

export default function CallControls({
  micOn, camOn, toggleMic, toggleCam, onEnd,
  isHost, sharing, onToggleShare, onSwitchShare, mode, setMode,
}) {
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
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          onClick={toggleMic}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", micOn ? "bg-elevated text-foreground" : "bg-destructive text-white")}
          title={micOn ? "Mikrofon aus" : "Mikrofon an"}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleCam}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", camOn ? "bg-elevated text-foreground" : "bg-destructive text-white")}
          title={camOn ? "Kamera aus" : "Kamera an"}
        >
          {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button
          onClick={onToggleShare}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", sharing ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground")}
          title={sharing ? "Bildschirm-Teilen beenden" : "Bildschirm teilen — dein Kamerabild bleibt dabei sichtbar"}
        >
          {sharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>
        {sharing && onSwitchShare && (
          <button
            onClick={onSwitchShare}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-elevated text-foreground transition-colors"
            title="Anderen Bildschirm zeigen — das Teilen läuft dabei weiter"
          >
            <MonitorUp className="w-5 h-5" />
          </button>
        )}
        <PaymentLinkDialog className="w-12 h-12" />
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