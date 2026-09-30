import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ROLE_SETUPS, THERAPY_MODES, INTENSITIES } from "@/lib/therapyPrompts";
import CastPicker from "@/components/therapy/CastPicker";
import VoiceInput from "@/components/VoiceInput";

const Block = ({ step, label, hint, children }) => (
  <div className="rounded-2xl border border-border bg-background p-4">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0">{step}</span>
      <p className="text-[13px] font-bold text-foreground">{label}</p>
    </div>
    {hint && <p className="text-[11px] text-muted-foreground mb-3">{hint}</p>}
    {children}
  </div>
);

const Pills = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        title={o.hint}
        className={cn(
          "px-3.5 py-2 rounded-full border text-sm transition-colors",
          value === o.value
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-elevated border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Area = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={rows}
    placeholder={placeholder}
    className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
  />
);

const Line = ({ value, onChange, placeholder }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-4 py-2.5 rounded-full bg-card border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
  />
);

const VOICES = [
  { value: "storm", label: "Tief & fest" },
  { value: "river", label: "Ruhig" },
  { value: "honey", label: "Warm" },
  { value: "sunny", label: "Hell" },
  { value: "spark", label: "Schnell" },
];

// Die Konfigurations-Maske der Sitzung: wer dabei ist, worum es geht und wie
// die Therapeutin auf das reagiert, was du sagst. Gilt ab der nächsten Antwort.
export default function TherapyConfigMask({ session, creators = [], onSave, onCancel, saving }) {
  const [cast, setCast] = useState(session.cast || []);
  const [actor, setActor] = useState({
    name: "", age: "", setting: "", voice: "storm", active: false,
    ...(session.actor || {}),
    age: session.actor?.age ? String(session.actor.age) : "",
  });
  const [topic, setTopic] = useState(session.topic || "");
  const [goal, setGoal] = useState(session.goal || "");
  const [agenda, setAgenda] = useState(session.agenda || "");
  const [style, setStyle] = useState(session.therapistStyle || "");
  const [role, setRole] = useState(session.therapistRole || "");
  const [mode, setMode] = useState(session.mode || "GUIDED");
  const [intensity, setIntensity] = useState(session.intensity || "TIEF");
  const [roleSetup, setRoleSetup] = useState(session.roleSetup || "TRIANIA_THERAPIST");
  const [therapistVoice, setTherapistVoice] = useState(session.therapistVoice || "honey");

  const present = cast.filter((c) => c.mode === "PRESENT");
  const informed = cast.filter((c) => c.mode === "INFORMED");

  return (
    <div className="space-y-3">
      <Block step="1" label="Wer ist anwesend?" hint="Jeder Klick schaltet weiter: nicht dabei → anwesend → informiert. Anwesende sitzen im Raum und reden mit, Informierte kennt sie nur aus deinen Erzählungen.">
        <CastPicker creators={creators} value={cast} onChange={setCast} />
        {(present.length > 0 || informed.length > 0) && (
          <p className="text-[11px] text-muted-foreground mt-2">
            {present.length > 0 && <>Im Raum: <span className="text-primary font-semibold">{present.map((c) => c.name).join(", ")}</span>. </>}
            {informed.length > 0 && <>Nur erwähnt: {informed.map((c) => c.name).join(", ")}.</>}
          </p>
        )}
      </Block>

      <Block
        step="2"
        label="Dein Akteur — der Mann in der Sitzung"
        hint="Zwei, drei Sätze, wie er ist. Dann lässt du ihn laufen: er redet, sie antwortet, immer im Wechsel. Du hörst zu und gibst die Richtung vor."
      >
        <button
          type="button"
          onClick={() => setActor((a) => ({ ...a, active: !a.active }))}
          className={cn(
            "mb-3 px-3.5 py-2 rounded-full border text-sm transition-colors",
            actor.active ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {actor.active ? "Akteur spielt mit ✓" : "Akteur dazuholen"}
        </button>
        <div className="flex gap-2 mb-2">
          <Line value={actor.name} onChange={(v) => setActor((a) => ({ ...a, name: v }))} placeholder="Sein Name" />
          <input
            value={actor.age}
            onChange={(e) => setActor((a) => ({ ...a, age: e.target.value }))}
            placeholder="Alter"
            className="w-24 px-4 py-2.5 rounded-full bg-card border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <Area
          value={actor.setting}
          onChange={(v) => setActor((a) => ({ ...a, setting: v }))}
          placeholder="Sein Setting in zwei, drei Sätzen: wer er ist, wie er redet, was er will, wie weit er geht."
        />
        <div className="flex items-center gap-2 mt-2 mb-3">
          <VoiceInput onResult={(t) => setActor((a) => ({ ...a, setting: a.setting ? a.setting + " " + t : t }))} title="Sein Setting sprechen" />
          <span className="text-[11px] text-muted-foreground">Oder reinsprechen — wird direkt übernommen.</span>
        </div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">Seine Stimme</p>
        <Pills options={VOICES} value={actor.voice} onChange={(v) => setActor((a) => ({ ...a, voice: v }))} />
      </Block>

      <Block step="3" label="Worum geht es?" hint="Das Thema ist gesetzt — sie bleibt dran, auch wenn du ausweichst.">
        <Area value={topic} onChange={setTopic} placeholder="Was soll heute raus? Schreib es hin, wie es in dir klingt." />
        <div className="flex items-center gap-2 mt-2">
          <VoiceInput onResult={(t) => setTopic((prev) => (prev ? prev + " " + t : t))} title="Thema sprechen statt tippen" />
          <span className="text-[11px] text-muted-foreground">Sprich es einfach aus — wird direkt übernommen.</span>
        </div>
        <div className="flex gap-2 mt-2">
          <Line value={goal} onChange={setGoal} placeholder="Und was erhoffst du dir davon? (optional)" />
          <VoiceInput onResult={(t) => setGoal((prev) => (prev ? prev + " " + t : t))} title="Erhofftes per Stimme sagen" />
        </div>
        <div className="mt-3">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">Wie soll es laufen?</p>
          <Area value={agenda} onChange={setAgenda} rows={2} placeholder="z.B. Erst der Anfang, dann die Sitzungen, die etwas verändert haben, dann die Leute, die dabei waren." />
        </div>
      </Block>

      <Block step="4" label="Wie soll sie auf dich reagieren?" hint="Ton, Tempo und Härte — hier bestimmst du, wie sie auf deine Inputs antwortet.">
        <Area value={style} onChange={setStyle} placeholder="z.B. ruhig, sehr direkt, wenig Gegenfragen, dafür genaue Beobachtungen. Kein Therapeuten-Sprech." />
        <div className="flex items-center gap-2 mt-2 mb-3">
          <VoiceInput onResult={(t) => setStyle((prev) => (prev ? prev + " " + t : t))} title="Reaktionsweise sprechen" />
          <span className="text-[11px] text-muted-foreground">Oder einfach reinsprechen, wie sie klingen soll.</span>
        </div>
        <div className="mb-3">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">Welche Rolle nimmt sie ein?</p>
          <Line value={role} onChange={setRole} placeholder="z.B. die Ärztin, die damals alles mitgeschrieben hat — streng, aber gerecht." />
        </div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">Wie arbeitet sie?</p>
        <Pills options={THERAPY_MODES} value={mode} onChange={setMode} />
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mt-3 mb-1.5">Wie hart?</p>
        <Pills options={INTENSITIES} value={intensity} onChange={setIntensity} />
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mt-3 mb-1.5">Ihre Stimme</p>
        <Pills options={VOICES} value={therapistVoice} onChange={setTherapistVoice} />
      </Block>

      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Wer führt?</p>
        <Pills options={ROLE_SETUPS} value={roleSetup} onChange={setRoleSetup} />
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="px-5 py-3 rounded-full bg-elevated text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors">
          Abbrechen
        </button>
        <button
          onClick={() => onSave({
            cast,
            actor: { ...actor, age: Number(actor.age) || undefined },
            topic,
            goal,
            agenda,
            therapistStyle: style,
            therapistRole: role,
            mode,
            intensity,
            roleSetup,
            therapistVoice,
          })}
          disabled={saving || !topic.trim()}
          className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Wird übernommen …" : "Übernehmen — gilt ab der nächsten Antwort"}
        </button>
      </div>
    </div>
  );
}