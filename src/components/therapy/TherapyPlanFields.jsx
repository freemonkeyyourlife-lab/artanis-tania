import React from "react";
import VoiceInput from "@/components/VoiceInput";

const Box = ({ label, hint, children }) => (
  <div>
    <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">{label}</p>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>}
  </div>
);

const Area = ({ value, onChange, placeholder, rows = 2 }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={rows}
    placeholder={placeholder}
    className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
  />
);

const Line = ({ value, onChange, placeholder }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
  />
);

// Alles, was die Sitzung ausmacht: Thema, Ablauf, wie sie antwortet, wo ihr
// seid und was vereinbart ist. Du bestimmst das — nicht die KI.
export default function TherapyPlanFields({ plan, setField }) {
  return (
    <div className="space-y-5">
      <Box label="Was soll heute raus?">
        <Area value={plan.topic} onChange={(v) => setField("topic", v)} rows={3} placeholder="Schreib es hin, wie es in dir klingt. Kein schönes Deutsch nötig — genau so, wie du es denkst." />
        <div className="flex items-center gap-2 mt-2">
          <VoiceInput onResult={(t) => setField("topic", plan.topic ? plan.topic + " " + t : t)} />
          <span className="text-xs text-muted-foreground">Sprich es einfach aus — wird direkt übernommen.</span>
        </div>
        <div className="flex gap-2 mt-2">
          <Line value={plan.goal} onChange={(v) => setField("goal", v)} placeholder="Und was erhoffst du dir davon? (optional)" />
          <VoiceInput onResult={(t) => setField("goal", plan.goal ? plan.goal + " " + t : t)} title="Erhofftes per Stimme sagen" />
        </div>
      </Box>

      <Box label="Wie soll es laufen?" hint="Erzähl den Ablauf so, wie du ihn haben willst — sie hält sich daran.">
        <Area value={plan.agenda} onChange={(v) => setField("agenda", v)} rows={3} placeholder="z.B. Erst der Anfang der Therapie, dann die Sitzungen, die etwas verändert haben, dann die Leute, die dabei waren, und am Ende: was geblieben ist." />
      </Box>

      <Box label="Wie soll sie antworten?" hint="Ton, Tempo, Wortwahl — hier bestimmst du, wie sie redet.">
        <Area value={plan.style} onChange={(v) => setField("style", v)} rows={2} placeholder="z.B. ruhig, sehr direkt, wenig Fragen zurück, dafür genaue Beobachtungen. Kein Therapeuten-Sprech." />
      </Box>

      <Box label="Welche Rolle nimmt sie ein?">
        <Area value={plan.role} onChange={(v) => setField("role", v)} rows={2} placeholder="z.B. die Ärztin, die damals alles mitgeschrieben hat — streng, aber gerecht. Oder: eine, die selbst dabei war." />
      </Box>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Box label="Wo seid ihr?">
          <Line value={plan.location} onChange={(v) => setField("location", v)} placeholder="z.B. ihre Praxis, abends, nur eine Lampe an" />
        </Box>
        <Box label="Wie alt bist du dabei?">
          <Line value={plan.clientAge} onChange={(v) => setField("clientAge", v)} placeholder="z.B. 34 — oder: damals 22, heute 36" />
        </Box>
      </div>

      <Box label="Die Vereinbarung" hint="Was gilt für diese Sitzung? Sie wird nicht neu verhandelt.">
        <Area value={plan.agreement} onChange={(v) => setField("agreement", v)} rows={2} placeholder="z.B. Alles bleibt hier. Keine Ausflüchte. Was gesagt wird, wird zu Ende gesagt." />
      </Box>
    </div>
  );
}