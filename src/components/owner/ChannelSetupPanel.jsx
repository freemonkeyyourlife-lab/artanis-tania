import React from "react";
import { Save, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CHANNELS } from "@/lib/channels";

// Deine eigenen Namen auf den Kanälen — einmal eintragen, danach verlinkt die
// App dich überallhin richtig.
export default function ChannelSetupPanel({ value, onChange, onSave, saving }) {
  return (
    <div className="glass rounded-2xl border-2 border-border p-5">
      <p className="font-display text-xl text-foreground mb-1">Deine eigenen Kanäle</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4">
        Einmal eintragen. Danach weiß die App, unter welchem Namen du erreichbar bist, und legt dir
        die passenden Links an.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((channel) => (
          <div key={channel.id}>
            <label className={`text-[15px] font-bold ${channel.color}`}>{channel.label}</label>
            <Input
              value={value[channel.field] || ""}
              onChange={(event) => onChange({ ...value, [channel.field]: event.target.value })}
              placeholder={channel.placeholder}
              className="mt-1.5 h-11 text-[15px] font-semibold"
            />
            <p className="text-[12px] font-semibold text-muted-foreground mt-1">{channel.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label className="text-[15px] font-bold text-foreground">Deine E-Mail für Kunden</label>
        <Input
          value={value.ownerEmail || ""}
          onChange={(event) => onChange({ ...value, ownerEmail: event.target.value })}
          placeholder="du@beispiel.de"
          className="mt-1.5 h-11 max-w-sm text-[15px] font-semibold"
        />
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
      >
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Speichert …" : "Speichern"}
      </button>
    </div>
  );
}