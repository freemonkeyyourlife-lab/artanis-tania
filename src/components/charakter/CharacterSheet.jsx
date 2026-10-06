import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Save, AlertTriangle, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import VoiceInput from "@/components/VoiceInput";
import NeigungChips from "@/components/palette/NeigungChips";
import { PALETTE } from "@/lib/palette";
import { COMBINE_KINDS, modulesOfKind } from "@/lib/combine";
import { TEXT_FIELDS, characterGuard, emptyCharacter } from "@/lib/charakter";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Eine Figur anlegen oder ändern: dieselben sechs Felder für David und für
// Gäste. Jedes Textfeld lässt sich auch einsprechen statt tippen.
export default function CharacterSheet({ initial, me, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({ ...emptyCharacter(), ...(initial || {}) }));
  const [neigungen, setNeigungen] = useState([]);
  const [voices, setVoices] = useState([]);
  const [modules, setModules] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.entities.Neigung.filter({ active: true }, { sort: "level", limit: 50 })
      .then((page) => setNeigungen(page.items || []))
      .catch(() => setNeigungen([]));
    base44.entities.Voice.list("-created_date", 200)
      .then((list) => setVoices((list || []).filter((v) => v.active !== false)))
      .catch(() => setVoices([]));
    base44.entities.CharacterModule.filter({ active: true }, { sort: "order", limit: 200 })
      .then((page) => setModules(page.items || []))
      .catch(() => setModules([]));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const append = (k, text) => set(k, form[k] ? `${form[k]} ${text}` : text);

  const toggleNeigung = (key) =>
    set("neigungen", (form.neigungen || []).includes(key)
      ? form.neigungen.filter((k) => k !== key)
      : [...(form.neigungen || []), key]);

  const toggleModule = (id) =>
    set("moduleIds", (form.moduleIds || []).includes(id)
      ? form.moduleIds.filter((k) => k !== id)
      : [...(form.moduleIds || []), id]);

  const pickAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      set("avatar", res.file_url);
    } catch (e) {
      setError("Das Bild konnte nicht hochgeladen werden.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const problem = characterGuard(form);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        adultAge: Number(form.adultAge),
        createdByRole: form.createdByRole || (me?.role === "admin" ? "DAVID" : "GAST"),
        fictional: form.fictional !== false,
        sourceConsentVerified: !!form.sourceConsentVerified,
        appearance: form.appearance || "",
        art: form.art || "",
        behavior: form.behavior || "",
        understanding: form.understanding || "",
        personality: form.personality || "",
        description: form.description || "",
        neigungen: form.neigungen || [],
        voiceId: form.voiceId || "",
        moduleIds: form.moduleIds || [],
        avatar: form.avatar || "",
        images: form.images || [],
      };
      if (initial?.id) await base44.entities.Character.update(initial.id, data);
      else await base44.entities.Character.create(data);
      onSaved?.();
    } catch (e) {
      setError("Speichern hat nicht geklappt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-2xl border border-primary/30 p-5">
      <h2 className="font-display text-xl text-foreground">
        {initial?.id ? `"${initial.name}" bearbeiten` : "Neue Figur"}
      </h2>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
        <p className="text-xs text-amber-200/90">
          Nur fiktive Erwachsene (18+). Keine realen Personen — weder Aussehen noch Stimme — ohne
          ausdrückliche Freigabe.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Name</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="z. B. Amira" className={inputCls} />
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Alter (mindestens 18)</label>
          <input type="number" min="18" value={form.adultAge} onChange={(e) => set("adultAge", e.target.value)} placeholder="24" className={inputCls} />
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Wer legt sie an</label>
          <select value={form.createdByRole} onChange={(e) => set("createdByRole", e.target.value)} className={inputCls}>
            <option value="GAST">Gast</option>
            <option value="DAVID">David</option>
          </select>
        </div>

        <div className="flex items-end gap-4 pb-2">
          <div className="flex items-center gap-2">
            <input id="fictional" type="checkbox" checked={form.fictional !== false} onChange={(e) => set("fictional", e.target.checked)} className="h-4 w-4 accent-primary" />
            <label htmlFor="fictional" className="text-sm text-muted-foreground">fiktiv</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="consent" type="checkbox" checked={!!form.sourceConsentVerified} onChange={(e) => set("sourceConsentVerified", e.target.checked)} className="h-4 w-4 accent-primary" />
            <label htmlFor="consent" className="text-sm text-muted-foreground">Freigabe liegt vor</label>
          </div>
        </div>

        {TEXT_FIELDS.map((f) => (
          <div key={f.key} className="sm:col-span-2">
            <label className="mb-1.5 block text-xs text-muted-foreground">
              {f.label} <span className="opacity-60">— {f.hint}</span>
            </label>
            <textarea
              value={form[f.key] || ""}
              onChange={(e) => set(f.key, e.target.value)}
              rows={3}
              placeholder={f.placeholder}
              className={cn(inputCls, "resize-none")}
            />
            <div className="mt-2 flex items-center gap-2">
              <VoiceInput onResult={(t) => append(f.key, t)} />
              <span className="text-xs text-muted-foreground">Sprechen statt tippen</span>
            </div>
          </div>
        ))}

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs text-muted-foreground">
            Neigung <span className="opacity-60">— mehr als eine ist der Normalfall</span>
          </label>
          <NeigungChips
            items={neigungen.length ? neigungen : PALETTE}
            value={form.neigungen || []}
            onToggle={toggleNeigung}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs text-muted-foreground">Stimme aus deiner Stimmbank</label>
          <select value={form.voiceId} onChange={(e) => set("voiceId", e.target.value)} className={inputCls}>
            <option value="">Keine — Gerätestimme</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        {COMBINE_KINDS.map((k) => {
          const items = modulesOfKind(modules, k.id);
          if (!items.length) return null;
          return (
            <div key={k.id} className="sm:col-span-2">
              <label className="mb-1.5 block text-xs text-muted-foreground">
                {k.label} <span className="opacity-60">— {k.hint}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {items.map((m) => {
                  const on = (form.moduleIds || []).includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleModule(m.id)}
                      className={cn("glass-btn rounded-full px-3.5 py-1.5 text-[13px]", on && "glass-btn-accent")}
                    >
                      {m.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs text-muted-foreground">Bild der Figur</label>
          <div className="flex items-center gap-3">
            <label className="glass-btn inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" /> {uploading ? "Lädt …" : "Bild wählen"}
              <input type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
            </label>
            {form.avatar && <Image src={form.avatar} fittingType="fill" className="h-20 w-20 rounded-2xl" />}
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-bold text-destructive">{error}</p>}

      <div className="mt-5 flex gap-3">
        <button onClick={save} disabled={saving || uploading} className="glass-btn glass-btn-accent inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Speichert …" : "Speichern"}
        </button>
        <button onClick={onCancel} className="glass-btn rounded-full px-5 py-2.5 text-sm text-muted-foreground">
          Abbrechen
        </button>
      </div>
    </div>
  );
}