import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CHANNELS } from "@/lib/channels";

// Eine Kundin oder einen Kunden anlegen — mit den Namen, unter denen du sie
// auf den einzelnen Kanälen findest.
export default function ChannelContactForm({ contact, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    name: contact?.name || "",
    whatsapp: contact?.whatsapp || "",
    telegram: contact?.telegram || "",
    instagram: contact?.instagram || "",
    email: contact?.email || "",
    note: contact?.note || "",
  });

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...form, name: form.name.trim() });
  };

  return (
    <form onSubmit={submit} className="glass rounded-2xl border-2 border-border p-5">
      <p className="font-display text-xl text-foreground mb-4">
        {contact ? "Kontakt bearbeiten" : "Neuen Kontakt anlegen"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-[15px] font-bold text-foreground">Name</label>
          <Input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Wie du die Person nennst"
            className="mt-1.5 h-11 text-[15px] font-semibold"
          />
        </div>

        {CHANNELS.map((channel) => (
          <div key={channel.id}>
            <label className={`text-[15px] font-bold ${channel.color}`}>{channel.label}</label>
            <Input
              value={form[channel.field]}
              onChange={(event) => setForm({ ...form, [channel.field]: event.target.value })}
              placeholder={channel.placeholder}
              className="mt-1.5 h-11 text-[15px] font-semibold"
            />
          </div>
        ))}

        <div>
          <label className="text-[15px] font-bold text-foreground">E-Mail</label>
          <Input
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="optional"
            className="mt-1.5 h-11 text-[15px] font-semibold"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-[15px] font-bold text-foreground">Notiz</label>
          <Input
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            placeholder="Worum geht es bei dieser Person?"
            className="mt-1.5 h-11 text-[15px] font-semibold"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-5">
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
        >
          <Check className="w-4 h-4" /> Speichern
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground"
        >
          <X className="w-4 h-4" /> Abbrechen
        </button>
      </div>
    </form>
  );
}