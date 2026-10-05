import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listVoices } from "@/lib/chatSpeak";
import {
  CHAT_MODES,
  CHAT_MODE_LABEL,
  CHAT_LAYOUTS,
  getChatModule,
  setChatModule,
} from "@/lib/chatModule";

const ACCENTS = ["#e29578", "#c87d55", "#8b5cf6", "#0ea5e9", "#22c55e", "#f43f5e"];

// Die Einstellungen: Modus, Optik und der Telegram-Weg. Alles wirkt sofort.
export default function ChatModuleSettings() {
  const [s, setS] = useState(getChatModule());
  const [voices, setVoices] = useState(listVoices());
  const set = (patch) => setS(setChatModule(patch));

  // Die Stimmen des Geräts treffen erst nach und nach ein.
  useEffect(() => {
    const read = () => setVoices(listVoices());
    read();
    window.speechSynthesis?.addEventListener("voiceschanged", read);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", read);
  }, []);

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-4">
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Wer antwortet
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.values(CHAT_MODES).map((m) => (
            <button
              key={m}
              onClick={() => set({ mode: m })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-bold",
                s.mode === m ? "border-primary text-primary" : "border-border text-muted-foreground"
              )}
            >
              {CHAT_MODE_LABEL[m]}
            </button>
          ))}
        </div>
        {s.mode === CHAT_MODES.AI && (
          <div className="mt-3">
            <Input
              value={s.modelId}
              onChange={(e) => set({ modelId: e.target.value })}
              placeholder="Modell-Kennung (leer = Standard-KI)"
            />
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Optik
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => set({ accent: c })}
              title={c}
              className={cn(
                "h-7 w-7 rounded-full border-2",
                s.accent === c ? "border-foreground" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <span className="ml-2 text-xs text-muted-foreground">Ecken</span>
          <input
            type="range"
            min="4"
            max="28"
            value={s.radius}
            onChange={(e) => set({ radius: Number(e.target.value) })}
            className="w-28"
          />
          <button
            onClick={() =>
              set({
                layout: s.layout === CHAT_LAYOUTS.BUBBLE ? CHAT_LAYOUTS.FULLSCREEN : CHAT_LAYOUTS.BUBBLE,
              })
            }
            className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground"
          >
            {s.layout === CHAT_LAYOUTS.BUBBLE ? "Fenster" : "Vollbild"}
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Stimme
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={s.autoSpeak ? "default" : "outline"}
            onClick={() => set({ autoSpeak: !s.autoSpeak })}
          >
            {s.autoSpeak ? "Antworten vorlesen" : "Nicht vorlesen"}
          </Button>
          <select
            value={s.voiceName}
            onChange={(e) => set({ voiceName: e.target.value })}
            className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-foreground"
          >
            <option value="">Standard-Stimme</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Vorgelesen wird mit der Stimme dieses Geräts — ohne Umweg über einen Dienst, also ohne
          Kosten. Jede Antwort hat außerdem einen Lautsprecher zum Antippen.
        </p>
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Spiegelung nach Telegram
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={s.mirrorToTelegram ? "default" : "outline"}
            onClick={() => set({ mirrorToTelegram: !s.mirrorToTelegram })}
          >
            {s.mirrorToTelegram ? "Spiegelung an" : "Spiegelung aus"}
          </Button>
          <Input
            value={s.telegramChatId}
            onChange={(e) => set({ telegramChatId: e.target.value.trim() })}
            placeholder="Telegram Chat-ID"
            className="max-w-[220px]"
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Ist die Spiegelung an, ist es derselbe Chat: was du hier schreibst, geht nach Telegram —
          und was dort geschrieben wird, steht hier. Die Chat-ID findest du, indem du deinem Bot
          einmal schreibst; sie steht dann im Leitstand.
        </p>
      </div>
    </div>
  );
}