import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Loader2, Send, Terminal, Check, AlertTriangle, X, Eraser } from "lucide-react";
import VoiceInput from "@/components/VoiceInput";
import { sendUiCommand } from "@/lib/ownerUi";
import { getRooms } from "@/lib/callRooms";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Erstelle einen Charakter namens Luna, 27, verspielt, mit der Stimme Honey",
  "Erstelle eine Stimme, ruhig und langsam",
  "Öffne den Bot-Chat daneben",
  "Verschiebe dieses Fenster nach rechts",
  "Blende den Menüpunkt Storys aus",
];

// Die zentrale Befehls-Eingabe. Sprache oder Tippen — das Gesprochene landet
// zuerst als Text im Feld, damit du es vor dem Absenden noch ändern kannst.
export default function OwnerCommandBar() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);

  const push = (entry) => setLog((prev) => [{ id: `${Date.now()}-${Math.random()}`, ...entry }, ...prev]);

  // Persönliche, umkehrbare Fenster-Befehle führt die App direkt aus.
  const applyClient = (plan) => {
    const { action, params } = plan;
    const inCall = window.location.pathname.startsWith("/call/");
    if (action === "open_call") {
      const room = getRooms()[0];
      if (params.voiceId) localStorage.setItem("callReadAloudVoice", params.voiceId);
      sendUiCommand("open_panel", { panel: "chat" });
      navigate(`/call/${room.token}?r=${room.number}`);
      return plan.summary;
    }
    if (action === "set_call_voice") {
      if (params.voiceId) localStorage.setItem("callReadAloudVoice", params.voiceId);
      sendUiCommand(action, params);
      return plan.summary;
    }
    if (action === "open_panel" && !inCall) {
      // Die Fenster liegen im Videocall — dort gehören sie hin.
      const room = getRooms()[0];
      sendUiCommand(action, params);
      navigate(`/call/${room.token}?r=${room.number}`);
      return `${plan.summary} Dafür öffne ich dir den Videocall — dort liegen die Fenster.`;
    }
    sendUiCommand(action, params);
    return plan.summary;
  };

  const confirmPlan = async (plan) => {
    setPending(null);
    setBusy(true);
    try {
      const res = await base44.functions.invoke("ownerCommand", { confirm: true, plan });
      const data = res.data || {};
      if (!data.ok) {
        push({ kind: "error", title: "Hat nicht geklappt", text: data.error || "Unbekannter Fehler." });
      } else if (data.client) {
        push({ kind: "done", title: "Erledigt", text: applyClient(plan) });
      } else {
        push({ kind: "done", title: "Erledigt", text: data.message });
      }
    } catch (e) {
      push({ kind: "error", title: "Hat nicht geklappt", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const ask = async (value) => {
    const command = String(value ?? text).trim();
    if (!command || busy) return;
    setText("");
    setBusy(true);
    try {
      const res = await base44.functions.invoke("ownerCommand", { text: command });
      const plan = res.data?.plan;
      if (!plan) {
        push({ kind: "error", title: "Keine Antwort", text: "Der Befehl konnte nicht gelesen werden." });
        return;
      }
      if (plan.setupRequired) {
        push({ kind: "setup", title: "Einrichtung erforderlich", text: plan.setupRequired, command });
        return;
      }
      if (plan.missing?.length) {
        push({ kind: "question", title: "Ich brauche noch etwas", text: plan.missing.join(" "), command });
        return;
      }
      if (plan.action === "answer") {
        push({ kind: "info", title: "Das kann ich nicht", text: plan.summary, command });
        return;
      }
      if (plan.needsConfirm) {
        setPending({ plan, command });
        return;
      }
      if (plan.client) {
        push({ kind: "done", title: "Erledigt", text: applyClient(plan), command });
        return;
      }
      // Echte Datensätze (Charakter, Stimme, Zuordnung) werden direkt angelegt.
      await confirmPlan(plan);
      push({ kind: "note", title: "Ohne Rückfrage ausgeführt", text: `„${command}“ — anlegen ist jederzeit umkehrbar.`, command });
    } catch (e) {
      push({ kind: "error", title: "Hat nicht geklappt", text: e.message, command });
    } finally {
      setBusy(false);
    }
  };

  const tone = {
    done: "border-emerald-500/40 bg-emerald-500/10",
    question: "border-amber-500/40 bg-amber-500/10",
    setup: "border-amber-500/40 bg-amber-500/10",
    error: "border-destructive/40 bg-destructive/10",
    info: "border-border bg-elevated",
    note: "border-border bg-elevated",
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl border-2 border-border p-5">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="w-5 h-5 text-primary" />
          <p className="font-display text-xl text-foreground">Sag einfach, was du willst</p>
        </div>
        <p className="text-[15px] font-semibold text-muted-foreground mb-4">
          Tippen oder reinsprechen. Gesprochenes landet zuerst als Text im Feld — du kannst es vor dem Absenden noch ändern.
          Das Mikrofon startet nur, wenn du es antippst, und nimmt nicht dauerhaft auf.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <VoiceInput onResult={(t) => setText(t)} disabled={busy} title="Befehl reinsprechen" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Zum Beispiel: Erstelle einen Charakter namens Luna, 27, mit der Stimme Honey"
            className="flex-1 min-w-[240px] px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <button onClick={() => ask()} disabled={busy || !text.trim()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-sm font-bold disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Ausführen
          </button>
          {text && (
            <button onClick={() => setText("")} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full glass-btn text-sm font-semibold text-muted-foreground" title="Eingabe verwerfen">
              <Eraser className="w-4 h-4" /> Abbrechen
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => ask(e)} disabled={busy} className="px-3 py-1.5 rounded-full bg-elevated border border-border text-[12px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50">
              {e}
            </button>
          ))}
        </div>
      </div>

      {pending && (
        <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-5">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-lg text-foreground">Das gilt für alle — bitte bestätigen</p>
              <p className="text-[14px] font-semibold text-foreground/90 mt-1">{pending.plan.summary}</p>
            </div>
          </div>
          {pending.plan.effects?.length > 0 && (
            <ul className="ml-7 mb-3 space-y-1">
              {pending.plan.effects.map((e, i) => (
                <li key={i} className="text-[13px] font-semibold text-muted-foreground">• {e}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 ml-7">
            <button onClick={() => confirmPlan(pending.plan)} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-sm font-bold">
              <Check className="w-4 h-4" /> Ja, jetzt anwenden
            </button>
            <button onClick={() => { setPending(null); push({ kind: "info", title: "Abgebrochen", text: "Es wurde nichts geändert." }); }} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full glass-btn text-sm font-bold text-muted-foreground">
              <X className="w-4 h-4" /> Lieber nicht
            </button>
          </div>
        </div>
      )}

      {busy && !pending && (
        <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Ich schaue, was ich tun kann …
        </p>
      )}

      <div className="space-y-2">
        {log.map((entry) => (
          <div key={entry.id} className={cn("rounded-2xl border p-4", tone[entry.kind])}>
            <p className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">{entry.title}</p>
            {entry.command && <p className="text-[13px] font-semibold text-muted-foreground mt-1">„{entry.command}“</p>}
            <p className="text-[15px] font-semibold text-foreground mt-1">{entry.text}</p>
          </div>
        ))}
        {log.length === 0 && (
          <p className="text-[14px] font-semibold text-muted-foreground">
            Noch nichts ausgeführt. Was ich nicht kann, sage ich dir — statt es stillschweigend zu versuchen.
          </p>
        )}
      </div>
    </div>
  );
}