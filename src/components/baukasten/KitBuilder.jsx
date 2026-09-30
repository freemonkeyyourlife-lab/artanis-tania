import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Save, Loader2, Search, Check, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { kindLabel, blockMedia, syncSharedBlocks } from "@/lib/baukasten";

// Aus Bausteinen wird ein Paket. Du wählst aus, was reingehört, legst ein
// Titelbild fest und entscheidest, ob andere es nachbauen dürfen.
export default function KitBuilder({ initial, blocks, presetIds = [], onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    personaName: initial?.personaName || "",
    description: initial?.description || "",
    tags: initial?.tags || [],
    shared: initial?.shared || false,
    cover: initial?.cover || "",
    blockIds: initial?.blockIds || presetIds,
  });
  const [query, setQuery] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const shown = blocks.filter((b) => {
    if (!query.trim()) return true;
    const hay = [b.title, b.personaName, b.situation, ...(b.tags || []), ...(b.activeVariants || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  const toggleBlock = (id) =>
    set({
      blockIds: form.blockIds.includes(id)
        ? form.blockIds.filter((x) => x !== id)
        : [...form.blockIds, id],
    });

  const covers = blocks
    .filter((b) => form.blockIds.includes(b.id))
    .flatMap((b) => blockMedia(b))
    .filter((m) => m.type === "IMAGE");

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || form.tags.includes(value)) return;
    set({ tags: [...form.tags, value] });
    setTagInput("");
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError("Gib dem Baukasten einen Namen.");
      return;
    }
    if (!form.blockIds.length) {
      setError("Wähle mindestens einen Baustein aus.");
      return;
    }
    setSaving(true);
    setError("");
    const data = { ...form, name: form.name.trim() };
    try {
      if (initial?.id) await base44.entities.BuildKit.update(initial.id, data);
      else await base44.entities.BuildKit.create(data);
      await syncSharedBlocks(data.blockIds, form.shared);
      onSaved();
    } catch (e) {
      setError("Speichern hat nicht geklappt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-primary/40 p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl text-foreground">
          {initial?.id ? "Baukasten ändern" : "Neuer Baukasten"}
        </p>
        <button
          onClick={onCancel}
          className="w-9 h-9 rounded-full bg-elevated text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-[14px] font-bold text-foreground">Name</label>
          <Input
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Zum Beispiel: Nachmittag am Fenster"
            className="mt-1.5 h-11 text-[15px] font-semibold"
          />
        </div>
        <div>
          <label className="text-[14px] font-bold text-foreground">Für wen</label>
          <Input
            value={form.personaName}
            onChange={(e) => set({ personaName: e.target.value })}
            placeholder="Dein Name oder der deiner Partnerin"
            className="mt-1.5 h-11 text-[15px] font-semibold"
          />
        </div>
      </div>

      <div>
        <label className="text-[14px] font-bold text-foreground">Beschreibung</label>
        <textarea
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={2}
          placeholder="Worum es in diesem Paket geht."
          className="mt-1.5 w-full rounded-2xl border-2 border-input bg-transparent px-4 py-3 text-[15px] font-semibold text-foreground resize-none focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <label className="text-[14px] font-bold text-foreground">
            Bausteine ({form.blockIds.length} ausgewählt)
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen"
              className="h-10 pl-9 w-56 text-[14px] font-semibold"
            />
          </div>
        </div>

        {blocks.length === 0 ? (
          <p className="text-[14px] font-semibold text-muted-foreground">
            Noch keine Bausteine da — leg zuerst welche an.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 max-h-[420px] overflow-y-auto pr-1">
            {shown.map((b) => {
              const on = form.blockIds.includes(b.id);
              const cover = blockMedia(b)[0];
              return (
                <button
                  key={b.id}
                  onClick={() => toggleBlock(b.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition-colors",
                    on ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                >
                  {cover?.type === "IMAGE" ? (
                    <Image src={cover.url} fittingType="fill" className="w-14 h-14 rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-elevated flex-shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-foreground truncate">{b.title}</span>
                    <span className="block text-[12px] font-semibold text-muted-foreground truncate">
                      {kindLabel(b.blockKind)}
                      {b.situation ? ` · ${b.situation}` : ""}
                    </span>
                  </span>
                  {on && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {covers.length > 0 && (
        <div>
          <label className="text-[14px] font-bold text-foreground">Titelbild</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {covers.slice(0, 12).map((m) => (
              <button
                key={m.url}
                onClick={() => set({ cover: form.cover === m.url ? "" : m.url })}
                className={cn(
                  "rounded-2xl border-2 overflow-hidden transition-colors",
                  form.cover === m.url ? "border-primary" : "border-border hover:border-primary/50"
                )}
              >
                <Image src={m.url} fittingType="fill" className="w-24 h-24" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-[14px] font-bold text-foreground">Schlagworte</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {form.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-[13px] font-bold text-foreground">
              {tag}
              <button onClick={() => set({ tags: form.tags.filter((t) => t !== tag) })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2 max-w-md">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            placeholder="Schlagwort"
            className="h-11 text-[15px] font-semibold"
          />
          <button
            onClick={addTag}
            className="w-11 h-11 rounded-xl bg-elevated border border-border text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={() => set({ shared: !form.shared })}
        className={cn(
          "w-full text-left rounded-2xl border-2 p-4 transition-colors",
          form.shared ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
        )}
      >
        <span className="flex items-center gap-2 font-display text-[16px] text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          {form.shared ? "Andere dürfen das nachbauen" : "Bleibt privat"}
        </span>
        <span className="block text-[13px] font-semibold text-muted-foreground mt-1">
          Freigegeben heißt: die Bausteine dieses Pakets werden sichtbar und können übernommen werden.
        </span>
      </button>

      {error && <p className="text-[14px] font-bold text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Speichert …" : "Baukasten speichern"}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}