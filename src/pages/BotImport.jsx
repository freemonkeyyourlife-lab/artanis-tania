import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Download, FileJson, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseBotJson, SAMPLE_BOT } from "@/lib/botImport";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Die Import-Schnittstelle: eine fremde Bot- oder Agent-Vorlage als JSON
// hineinlegen — daraus wird eine Figur und ein Import-Baustein.
export default function BotImport() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [saving, setSaving] = useState(false);

  const read = (value) => {
    setText(value);
    setDone("");
    setParsed(null);
    if (!value.trim()) {
      setError("");
      return;
    }
    try {
      setParsed(parseBotJson(value));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };

  const pickFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    read(await file.text());
  };

  const take = async () => {
    if (!parsed) return;
    setSaving(true);
    try {
      const created = await base44.entities.Character.create(parsed.character);
      await base44.entities.CharacterModule.create({
        ...parsed.module,
        characterId: created?.id || "",
        active: true,
      });
      setDone(`"${parsed.character.name}" liegt jetzt in der Charakter-Werkstatt — Stimme und Neigungen dort noch fein einstellen.`);
      setParsed(null);
      setText("");
    } catch (e) {
      setError("Übernehmen hat nicht geklappt.");
    } finally {
      setSaving(false);
    }
  };

  const c = parsed?.character;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/charakter" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Zur Charakter-Werkstatt
      </Link>

      <h1 className="mt-4 font-display text-4xl text-foreground text-gloss">Bot / Agent importieren</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Fremde Vorlagen kommen als JSON — aus einem anderen Programm, aus einer Datei oder aus der
        Zwischenablage. Daraus wird eine Figur mit denselben sechs Feldern plus ein Import-Baustein,
        der sich im Baukasten weiterverwenden lässt.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="glass-btn inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm">
          <FileJson className="h-4 w-4" /> Datei wählen
          <input type="file" accept="application/json,.json,.txt" onChange={pickFile} className="hidden" />
        </label>
        <button
          onClick={() => read(SAMPLE_BOT)}
          className="glass-btn rounded-full px-5 py-2.5 text-sm text-muted-foreground"
        >
          Beispiel einsetzen
        </button>
        <Link to="/charakter" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Zur Charakter-Werkstatt
        </Link>
      </div>

      <textarea
        value={text}
        onChange={(e) => read(e.target.value)}
        rows={10}
        placeholder={SAMPLE_BOT}
        className={cn(inputCls, "mt-4 resize-none font-mono text-[12px] leading-relaxed")}
      />

      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-destructive">
          <AlertTriangle className="h-4 w-4" /> {error}
        </p>
      )}

      {parsed && (
        <div className="glass mt-5 rounded-2xl border border-border p-4">
          <div className="font-heading text-foreground">Das wurde erkannt</div>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ["Name", c.name],
              ["Alter", `${c.adultAge}`],
              ["Aussehen", c.appearance],
              ["Art", c.art],
              ["Benehmen", c.behavior],
              ["Verständnis", c.understanding],
              ["Neigung", (c.neigungen || []).join(", ")],
              ["Rahmen", c.description],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border p-2.5">
                <dt className="text-[11px] text-muted-foreground">{label}</dt>
                <dd className="text-[13px] text-foreground">{value || "—"}</dd>
              </div>
            ))}
          </dl>

          {parsed.notes.length > 0 && (
            <ul className="mt-3 space-y-1">
              {parsed.notes.map((n) => (
                <li key={n} className="text-[12px] text-muted-foreground">· {n}</li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-[12px] text-muted-foreground">
            Es werden nur fiktive Erwachsene (18+) übernommen. Reale Personen bleiben gesperrt, bis
            eine ausdrückliche Freigabe vorliegt.
          </p>

          <button
            onClick={take}
            disabled={saving}
            className="glass-btn glass-btn-accent mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> {saving ? "Übernimmt …" : "Übernehmen"}
          </button>
        </div>
      )}

      {done && (
        <p className="mt-4 flex items-center gap-2 text-sm font-bold text-primary">
          <Check className="h-4 w-4" /> {done}
        </p>
      )}
    </div>
  );
}