import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { ROLE_SETUPS, THERAPY_MODES, INTENSITIES, SESSION_FORMATS, LIVE_MODES } from "@/lib/therapyPrompts";
import TherapistPicker from "@/components/therapy/TherapistPicker";
import CastPicker from "@/components/therapy/CastPicker";
import TherapyPlanFields from "@/components/therapy/TherapyPlanFields";

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

const Section = ({ label, hint, children }) => (
  <div>
    <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">{label}</p>
    {children}
    {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
  </div>
);

const Line = ({ value, onChange, placeholder, className }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={cn("px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50", className)}
  />
);

// Du baust die Sitzung: Therapeutin, Thema, Ablauf, Besetzung, Ort, Vereinbarung,
// Serie, Live und Sichtbarkeit. Sie führt nur noch aus, was hier steht.
export default function SessionForm({ onCreated }) {
  const [therapists, setTherapists] = useState([]);
  const [creators, setCreators] = useState([]);

  const [format, setFormat] = useState("EINZEL");
  const [seriesTitle, setSeriesTitle] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("1");
  const [episodeCount, setEpisodeCount] = useState("3");
  const [roleSetup, setRoleSetup] = useState("TANIA_THERAPIST");
  const [therapist, setTherapist] = useState({ id: "", name: "Tania", age: "", type: "", avatar: "" });
  const [plan, setPlan] = useState({ topic: "", goal: "", agenda: "", style: "", role: "", location: "", clientAge: "", agreement: "" });
  const [mode, setMode] = useState("GUIDED");
  const [intensity, setIntensity] = useState("TIEF");
  const [cast, setCast] = useState([]);
  const [visibility, setVisibility] = useState("PUBLIC");
  const [liveMode, setLiveMode] = useState("OFF");
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [t, c] = await Promise.all([
          base44.entities.Therapist.filter({ active: { $ne: false } }, "-created_date", 50),
          base44.entities.Creator.filter({ active: { $ne: false } }, "stageName", 200),
        ]);
        setTherapists(t);
        setCreators(c);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const setField = (key, value) => setPlan((p) => ({ ...p, [key]: value }));

  const submit = async () => {
    if (!plan.topic.trim()) {
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
        format,
        seriesTitle: format === "SERIE" ? seriesTitle.trim() : "",
        episodeNumber: Number(episodeNumber) || 1,
        episodeCount: format === "SERIE" ? (Number(episodeCount) || undefined) : undefined,
        topic: plan.topic.trim(),
        goal: plan.goal.trim(),
        agenda: plan.agenda.trim(),
        location: plan.location.trim(),
        clientAge: plan.clientAge.trim(),
        agreement: plan.agreement.trim(),
        therapistId: therapist.id,
        therapistName: therapist.name || "Tania",
        therapistAvatar: therapist.avatar,
        therapistAge: Number(therapist.age) || undefined,
        therapistType: therapist.type,
        therapistStyle: plan.style.trim(),
        therapistRole: plan.role.trim(),
        cast,
        liveMode,
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
    <div className="rounded-2xl border border-border bg-card p-5 lg:p-6 space-y-6">
      <Section label="Einzeln oder als Serie?" hint={SESSION_FORMATS.find((f) => f.value === format)?.hint}>
        <OptionRow options={SESSION_FORMATS} value={format} onChange={setFormat} />
        {format === "SERIE" && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Line value={seriesTitle} onChange={setSeriesTitle} placeholder="Titel der Serie" className="flex-1 min-w-[200px]" />
            <Line value={episodeNumber} onChange={setEpisodeNumber} placeholder="Folge" className="w-24" />
            <Line value={episodeCount} onChange={setEpisodeCount} placeholder="von Folgen" className="w-32" />
          </div>
        )}
      </Section>

      <Section label="Wer führt?">
        <OptionRow options={ROLE_SETUPS} value={roleSetup} onChange={setRoleSetup} />
      </Section>

      <Section label="Die Therapeutin" hint="Nimm Tania, eine bestehende oder leg deine eigene an — mit Foto, Alter, Fachrichtung und Ton.">
        <TherapistPicker
          therapist={therapist}
          onChange={setTherapist}
          therapists={therapists}
          onSaved={(t) => setTherapists((prev) => [t, ...prev])}
        />
      </Section>

      <TherapyPlanFields plan={plan} setField={setField} />

      <Section label="Wie läuft die Sitzung?" hint={THERAPY_MODES.find((m) => m.value === mode)?.hint}>
        <OptionRow options={THERAPY_MODES} value={mode} onChange={setMode} />
      </Section>

      <Section label="Wie hart?" hint={INTENSITIES.find((i) => i.value === intensity)?.hint}>
        <OptionRow options={INTENSITIES} value={intensity} onChange={setIntensity} />
      </Section>

      <Section label="Wer ist dabei?" hint="Anwesende sitzen mit im Raum und reden mit. Informierte kennt die Therapeutin aus deinen Erzählungen — sie holt sie herein, wenn du sie bringst.">
        <CastPicker creators={creators} value={cast} onChange={setCast} />
      </Section>

      <Section label="Wer darf zuschauen?">
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
      </Section>

      <Section label="Live zuschauen?" hint="Du gehst im Video-Call auf Sendung, die Zuschauer öffnen denselben Raum von der Sitzungsseite aus.">
        <OptionRow options={LIVE_MODES} value={liveMode} onChange={setLiveMode} />
      </Section>

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