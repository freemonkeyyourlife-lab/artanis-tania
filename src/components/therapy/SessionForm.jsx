import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { ROLE_SETUPS, THERAPY_MODES, INTENSITIES } from "@/lib/therapyPrompts";
import VoiceInput from "@/components/VoiceInput";

const OptionRow = ({ options, value, onChange }) => (
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

export default function SessionForm({ onCreated }) {
  const [roleSetup, setRoleSetup] = useState("TRIANIA_THERAPIST");
  const [mode, setMode] = useState("GUIDED");
  const [intensity, setIntensity] = useState("TIEF");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [anonymous, setAnonymous] = useState(false);
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!topic.trim()) {
      setError("Schreib hin, was heute raus soll.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const me = await base44.auth.me();
      const session = await base44.entities.TherapySession.create({
        userId: me.id,
        userName: anonymous ? "Anonym" : (me.full_name || me.email),
        anonymous,
        roleSetup,
        mode,
        intensity,
        visibility,
        topic: topic.trim(),
        goal: goal.trim(),
        status: "OPEN",
      });
      onCreated(session);
    } catch (e) {
      console.error(e);
      setError("Die Sitzung konnte nicht angelegt werden.");
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 lg:p-6 space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Wer führt?</p>
        <OptionRow options={ROLE_SETUPS} value={roleSetup} onChange={setRoleSetup} />
      </div>

      <div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Was soll heute raus?</p>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          placeholder="Schreib es hin, wie es in dir klingt. Kein schönes Deutsch nötig — genau so, wie du es denkst."
          className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
        />
        <div className="flex items-center gap-2 mt-2">
          <VoiceInput onResult={(t) => setTopic((prev) => (prev ? prev + " " + t : t))} />
          <span className="text-xs text-muted-foreground">
            Sprich es einfach aus — wird direkt in die Beschreibung übernommen.
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Und was erhoffst du dir davon? (optional)"
            className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <VoiceInput onResult={(t) => setGoal((prev) => (prev ? prev + " " + t : t))} title="Erhofftes per Stimme sagen" />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Wie soll sie laufen?</p>
        <OptionRow options={THERAPY_MODES} value={mode} onChange={setMode} />
        <p className="mt-2 text-xs text-muted-foreground">{THERAPY_MODES.find((m) => m.value === mode)?.hint}</p>
      </div>

      <div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Wie hart?</p>
        <OptionRow options={INTENSITIES} value={intensity} onChange={setIntensity} />
        <p className="mt-2 text-xs text-muted-foreground">{INTENSITIES.find((i) => i.value === intensity)?.hint}</p>
      </div>

      <div>
        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Wer darf mitlesen?</p>
        <OptionRow
          options={[
            { value: "PUBLIC", label: "Öffentlich", hint: "Andere können mitlesen und Gedanken einwerfen." },
            { value: "PRIVATE", label: "Vertraulich", hint: "Nur du siehst die Sitzung." },
          ]}
          value={visibility}
          onChange={setVisibility}
        />
        {visibility === "PUBLIC" && (
          <button
            type="button"
            onClick={() => setAnonymous((v) => !v)}
            className={cn(
              "mt-3 px-3.5 py-2 rounded-full border text-sm transition-colors",
              anonymous ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {anonymous ? "Anonym ✓" : "Anonym bleiben"}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        onClick={submit}
        disabled={saving}
        className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
      >
        {saving ? "Sitzung wird vorbereitet …" : "Sitzung starten"}
      </button>
    </div>
  );
}