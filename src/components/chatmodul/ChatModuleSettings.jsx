import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listVoices } from "@/lib/chatSpeak";
import { base44 } from "@/api/base44Client";
import ChatConversationPicker from "@/components/chatmodul/ChatConversationPicker";
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
  const [pool, setPool] = useState([]);
  const [models, setModels] = useState([]);
  const [newModel, setNewModel] = useState("");
  const [adding, setAdding] = useState(false);
  const set = (patch) => setS(setChatModule(patch));

  // Die Modelle, die in der App schon liegen — plus alles, was hier dazukommt.
  useEffect(() => {
    base44.entities.TextModel.filter({}, "-created_date", 200)
      .then((list) => setModels(list || []))
      .catch(() => setModels([]));
  }, []);

  const addModel = async () => {
    const modelId = newModel.trim();
    if (!modelId) return;
    setAdding(true);
    try {
      const created = await base44.entities.TextModel.create({
        name: modelId.split("/").pop(),
        modelId,
        note: "Im Chat-Modul aufgenommen",
      });
      setModels((cur) => [...cur, created]);
      setNewModel("");
    } finally {
      setAdding(false);
    }
  };

  // Die Stimmen aus dem Pool der App — jede davon lässt sich hier anhängen.
  useEffect(() => {
    base44.entities.VoiceModel.filter({}, "order", 100)
      .then((list) => setPool((list || []).filter((v) => v.enabled !== false)))
      .catch(() => setPool([]));
  }, []);

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
          <div className="mt-3 space-y-2">
            <select
              value={s.modelId}
              onChange={(e) => set({ modelId: e.target.value })}
              className="h-9 w-full max-w-[360px] rounded-xl border border-border bg-card px-3 text-xs text-foreground"
            >
              <option value="">Standard-KI (ohne eigenes Modell)</option>
              {models.map((m) => (
                <option key={m.id} value={m.modelId}>
                  {m.name}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Modell-Kennung einfügen, z. B. meta-llama/Llama-3.3-70B-Instruct"
                className="max-w-[360px]"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addModel}
                disabled={adding || !newModel.trim()}
              >
                {adding ? "…" : "Modell aufnehmen"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Einfach die Kennung einfügen und aufnehmen — das Modell steht danach überall in der
              App zur Verfügung, nicht nur hier.
            </p>
          </div>
        )}
      </div>

      <ChatConversationPicker currentId={s.conversationId} onPicked={() => setS(getChatModule())} />

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
            <option value="">Gerätestimme (kostenlos)</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Stimme aus dem Pool</span>
          <select
            value={s.voiceModelId}
            onChange={(e) => set({ voiceModelId: e.target.value })}
            className="h-9 max-w-[280px] rounded-xl border border-border bg-card px-3 text-xs text-foreground"
          >
            <option value="">Keine — Gerätestimme nutzen</option>
            {pool.map((v) => (
              <option key={v.id} value={v.modelId}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Ist eine Pool-Stimme gewählt, klingt das Vorlesen wie im Studio. Ohne sie spricht das
          Gerät — ohne Kosten. Jede Antwort hat außerdem einen Lautsprecher zum Antippen.
        </p>
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Stimmung
        </div>
        <Button
          size="sm"
          variant={s.autoMood ? "default" : "outline"}
          onClick={() => set({ autoMood: !s.autoMood })}
        >
          {s.autoMood ? "Stimmung wird mitgelesen" : "Stimmung aus"}
        </Button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Ist es an, liest das Modul nach jeder Nachricht, wo das Gespräch steht. Der Ton der
          Antworten und der Stil des nächsten Bildes richten sich danach. Die Stimmung steht als
          kleine Reihe über dem Gespräch.
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