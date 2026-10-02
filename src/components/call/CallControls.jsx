import React from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Monitor, MonitorOff, MonitorUp, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import PaymentLinkDialog from "@/components/pay/PaymentLinkDialog";
import DevicePicker from "@/components/call/DevicePicker";

const ROOM_MODES = [
  { id: "OPEN", label: "Offen", hint: "Alle mit dem Link kommen rein" },
  { id: "WATCH", label: "Zuschauer", hint: "Neue schauen nur heimlich zu" },
  { id: "PRIVATE", label: "Privat", hint: "Raum geschlossen — herein kommt nur, wer einen persönlichen Einladungslink hat" },
];

export default function CallControls({
  micOn, camOn, toggleMic, toggleCam, onEnd,
  isHost, sharing, onToggleShare, onAddScreen, onRemoveScreen, screens, mode, setMode,
  devices, activeDevice, onPickDevice, onListDevices,
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

      {sharing && screens?.length > 0 && (
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {screens.length === 1 ? "Bildschirm geteilt — weitere möglich" : `${screens.length} Bildschirme geteilt`}
          </span>
          {screens.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-elevated border border-border text-xs font-semibold text-foreground">
              {s.label}
              <button
                onClick={() => onRemoveScreen?.(s.id)}
                title={`${s.label} nicht mehr zeigen`}
                className="w-5 h-5 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            onClick={onAddScreen}
            title="Weiteren Bildschirm dazunehmen — alle werden zusammen gezeigt"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Weiterer Bildschirm
          </button>
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
          title={sharing ? "Bildschirm-Teilen beenden" : "Bildschirm teilen — mehrere Bildschirme gleichzeitig, dein Kamerabild bleibt sichtbar"}
        >
          {sharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>
        {sharing && onAddScreen && (
          <button
            onClick={onAddScreen}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-elevated text-foreground transition-colors"
            title="Weiteren Bildschirm dazunehmen — alle werden zusammen gezeigt"
          >
            <MonitorUp className="w-5 h-5" />
          </button>
        )}
        <DevicePicker
          devices={devices}
          activeDevice={activeDevice}
          onPick={onPickDevice}
          onOpen={onListDevices}
          className="w-12 h-12"
        />
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