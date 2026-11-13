import React from "react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const CHARAKTERE = [
  { id: "HEISS", label: "Heiß" },
  { id: "DENKERISCH", label: "Denkerisch" },
  { id: "FAKTISCH", label: "Faktisch" },
  { id: "KALT", label: "Kalt" },
];

const TEMPI = [
  { id: 1, label: "langsam" },
  { id: 2, label: "mittel" },
  { id: 3, label: "schnell" },
];

const VOICES = [
  { value: "storm", label: "Tief" },
  { value: "river", label: "Ruhig" },
  { value: "honey", label: "Warm" },
  { value: "sunny", label: "Hell" },
  { value: "spark", label: "Schnell" },
];

const chip = (on) =>
  cn(
    "px-2.5 py-1 rounded-full border text-[11px] font-bold transition-colors",
    on ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground"
  );

// Charakter & Tempo jeder Rolle einzeln einstellen und jederzeit wechseln —
// heiß, wenn es abgeht, denkerisch für die Therapeutin, faktisch dazwischen.
// Gilt ab der nächsten Antwort.
export default function RollenCharakter({ session, onUpdated }) {
  const name = (session?.therapistName || "Tania").trim();
  const actor = session?.actor?.active ? session.actor : null;
  const present = (session?.cast || []).filter((c) => c.mode === "PRESENT");

  const save = async (patch) => {
    try {
      const updated = await base44.entities.TherapySession.update(session.id, patch);
      onUpdated?.(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const setActor = (fields) => save({ actor: { ...session.actor, ...fields } });
  const setCast = (id, fields) =>
    save({ cast: (session.cast || []).map((c) => (c.id === id ? { ...c, ...fields } : c)) });

  const Row = ({ label, charakter, tempo, voice, onChar, onTempo, onVoice }) => (
    <div className="py-2 border-t border-border first:border-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {CHARAKTERE.map((c) => (
          <button key={c.id} type="button" onClick={() => onChar(c.id)} className={chip(charakter === c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {TEMPI.map((t) => (
          <button key={t.id} type="button" onClick={() => onTempo(t.id)} className={chip(tempo === t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {VOICES.map((v) => (
          <button key={v.value} type="button" onClick={() => onVoice(v.value)} className={chip(voice === v.value)}>
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 mb-4">
      <p className="text-[13px] font-bold text-foreground mb-1">Charakter & Tempo jeder Rolle</p>
      <p className="text-[11px] text-muted-foreground mb-1">
        Jeder einzeln — heiß, wenn's abgeht, denkerisch für die Therapeutin, faktisch dazwischen. Jederzeit wechselbar, gilt ab der nächsten Antwort.
      </p>
      <Row
        label={`Therapeutin · ${name}`}
        charakter={session.therapistCharakter}
        tempo={session.therapistTempo || 2}
        voice={session.therapistVoice || "honey"}
        onChar={(v) => save({ therapistCharakter: session.therapistCharakter === v ? "" : v })}
        onTempo={(v) => save({ therapistTempo: v })}
        onVoice={(v) => save({ therapistVoice: v })}
      />
      {actor && (
        <Row
          label={`Akteur · ${actor.name || "Er"}`}
          charakter={actor.charakter}
          tempo={actor.tempo || 2}
          voice={actor.voice || "storm"}
          onChar={(v) => setActor({ charakter: actor.charakter === v ? "" : v })}
          onTempo={(v) => setActor({ tempo: v })}
          onVoice={(v) => setActor({ voice: v })}
        />
      )}
      {present.map((m) => (
        <Row
          key={m.id}
          label={m.name}
          charakter={m.charakter}
          tempo={m.tempo || 2}
          voice={m.voice || "river"}
          onChar={(v) => setCast(m.id, { charakter: m.charakter === v ? "" : v })}
          onTempo={(v) => setCast(m.id, { tempo: v })}
          onVoice={(v) => setCast(m.id, { voice: v })}
        />
      ))}
    </div>
  );
}