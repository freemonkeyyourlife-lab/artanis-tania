import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Save, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import {
  CONTEST_CATEGORIES,
  CONTEST_FREQUENCIES,
  CONTEST_STATUSES,
  CONTEST_VISIBILITIES,
  MEDIA_TYPES,
  toLocalInput,
  endForStart,
} from "@/lib/contests";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

const slugify = (s) =>
  (s || "").toLowerCase().trim().replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function Section({ title, hint, children }) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{title}</p>
      {hint && <p className="text-[11px] text-muted-foreground mb-3">{hint}</p>}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", !hint && "mt-3")}>{children}</div>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ id, label, checked, onChange, hint }) {
  return (
    <label htmlFor={id} className="flex items-start gap-2.5 cursor-pointer">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0" />
      <span>
        <span className="text-sm text-foreground block">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground block">{hint}</span>}
      </span>
    </label>
  );
}

export default function ContestForm({ initial, onSaved, onCancel }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    rules: initial?.rules || "",
    category: initial?.category || "BEST_LOOKING",
    customCategory: initial?.customCategory || "",
    frequency: initial?.frequency || "WEEKLY",
    status: initial?.status || "DRAFT",
    mediaType: initial?.mediaType || "IMAGE",
    startsAt: toLocalInput(initial?.startsAt),
    endsAt: toLocalInput(initial?.endsAt),
    autoRepeat: initial?.autoRepeat ?? true,
    round: initial?.round ?? 1,
    visibility: initial?.visibility || "REGISTERED",
    entriesOpen: initial?.entriesOpen ?? true,
    maxEntriesPerUser: initial?.maxEntriesPerUser ?? 1,
    entryFeeCoins: initial?.entryFeeCoins ?? 0,
    allowAnonymousEntries: initial?.allowAnonymousEntries ?? false,
    autoApproveEntries: initial?.autoApproveEntries ?? true,
    votingEnabled: initial?.votingEnabled ?? true,
    votesPerUser: initial?.votesPerUser ?? 1,
    juryMode: initial?.juryMode ?? false,
    prizeDescription: initial?.prizeDescription || "",
    prizeCoins: initial?.prizeCoins ?? 0,
    prizeGold: initial?.prizeGold ?? false,
    prizeCustom: initial?.prizeCustom || "",
    coverImage: initial?.coverImage || "",
    tags: (initial?.tags || []).join(", "),
    featured: initial?.featured ?? false,
    published: initial?.published ?? false,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      set("coverImage", res.file_url);
    } catch (err) {
      toast({ title: "Upload fehlgeschlagen", variant: "destructive" });
    }
    e.target.value = "";
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Titel fehlt", description: "Gib dem Wettbewerb einen Namen.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: form.title.trim(),
        slug: slugify(form.title),
        description: form.description,
        rules: form.rules,
        category: form.category,
        customCategory: form.customCategory,
        frequency: form.frequency,
        status: form.status,
        mediaType: form.mediaType,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        autoRepeat: form.autoRepeat,
        round: Number(form.round) || 1,
        visibility: form.visibility,
        entriesOpen: form.entriesOpen,
        maxEntriesPerUser: Number(form.maxEntriesPerUser) || 1,
        entryFeeCoins: Number(form.entryFeeCoins) || 0,
        allowAnonymousEntries: form.allowAnonymousEntries,
        autoApproveEntries: form.autoApproveEntries,
        votingEnabled: form.votingEnabled,
        votesPerUser: Number(form.votesPerUser) || 1,
        juryMode: form.juryMode,
        prizeDescription: form.prizeDescription,
        prizeCoins: Number(form.prizeCoins) || 0,
        prizeGold: form.prizeGold,
        prizeCustom: form.prizeCustom,
        coverImage: form.coverImage,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        featured: form.featured,
        published: form.published,
      };
      if (initial?.id) await base44.entities.Contest.update(initial.id, data);
      else await base44.entities.Contest.create(data);
      toast({ title: initial?.id ? "Wettbewerb gespeichert" : "Wettbewerb erstellt" });
      onSaved?.();
    } catch (e) {
      toast({ title: "Fehler", description: "Konnte nicht speichern.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-6 space-y-4">
      <h2 className="font-display text-xl text-foreground">
        {initial?.id ? `"${initial.title}" bearbeiten` : "Neuen Wettbewerb anlegen"}
      </h2>

      <Section title="Grundlagen">
        <Field label="Titel" wide>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="z. B. Wichse im Gesicht — Runde 4" className={inputCls} />
        </Field>
        <Field label="Kategorie">
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
            {CONTEST_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Eigener Kategoriename (nur bei Eigene Kategorie)">
          <input value={form.customCategory} onChange={(e) => set("customCategory", e.target.value)} placeholder="z. B. Bestes Stöhnen" className={inputCls} />
        </Field>
        <Field label="Beschreibung" wide>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Worum geht es?" className={cn(inputCls, "resize-none")} />
        </Field>
        <Field label="Regeln" wide>
          <textarea value={form.rules} onChange={(e) => set("rules", e.target.value)} rows={3} placeholder="Was ist erlaubt, was nicht? Wie gewinnt man?" className={cn(inputCls, "resize-none")} />
        </Field>
        <Field label="Tags (mit Komma getrennt)" wide>
          <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="oral, amateur, outdoor" className={inputCls} />
        </Field>
      </Section>

      <Section title="Zeitraum & Rhythmus">
        <Field label="Rhythmus">
          <select value={form.frequency} onChange={(e) => { set("frequency", e.target.value); if (form.startsAt) set("endsAt", endForStart(e.target.value, form.startsAt)); }} className={inputCls}>
            {CONTEST_FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
            {CONTEST_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Start">
          <input type="datetime-local" value={form.startsAt} onChange={(e) => { set("startsAt", e.target.value); if (form.autoRepeat) set("endsAt", endForStart(form.frequency, e.target.value)); }} className={inputCls} />
        </Field>
        <Field label="Ende">
          <input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Runde (Nummer)">
          <input type="number" min="1" value={form.round} onChange={(e) => set("round", e.target.value)} className={inputCls} />
        </Field>
        <div className="flex items-end pb-1">
          <Toggle id="contest-repeat" label="Automatisch wiederholen" hint="Ende wird aus Start + Rhythmus berechnet" checked={form.autoRepeat} onChange={(v) => set("autoRepeat", v)} />
        </div>
      </Section>

      <Section title="Teilnahme" hint="Wer darf mitmachen, wie oft und was darf hochgeladen werden.">
        <Field label="Sichtbarkeit">
          <select value={form.visibility} onChange={(e) => set("visibility", e.target.value)} className={inputCls}>
            {CONTEST_VISIBILITIES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Erlaubte Medien">
          <select value={form.mediaType} onChange={(e) => set("mediaType", e.target.value)} className={inputCls}>
            {MEDIA_TYPES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Max. Beiträge pro Nutzer">
          <input type="number" min="1" value={form.maxEntriesPerUser} onChange={(e) => set("maxEntriesPerUser", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Startgebühr in Coins (0 = gratis)">
          <input type="number" min="0" value={form.entryFeeCoins} onChange={(e) => set("entryFeeCoins", e.target.value)} className={inputCls} />
        </Field>
        <Toggle id="contest-open" label="Einsendungen offen" checked={form.entriesOpen} onChange={(v) => set("entriesOpen", v)} />
        <Toggle id="contest-anon" label="Anonyme Beiträge erlaubt" checked={form.allowAnonymousEntries} onChange={(v) => set("allowAnonymousEntries", v)} />
        <Toggle id="contest-approve" label="Beiträge sofort sichtbar" hint="Aus = du gibst jeden Beitrag erst frei" checked={form.autoApproveEntries} onChange={(v) => set("autoApproveEntries", v)} />
      </Section>

      <Section title="Abstimmung">
        <Toggle id="contest-voting" label="Öffentliche Abstimmung" checked={form.votingEnabled} onChange={(v) => set("votingEnabled", v)} />
        <Toggle id="contest-jury" label="Jury-Modus" hint="Aus = Publikum entscheidet, an = du bestimmst den Gewinner" checked={form.juryMode} onChange={(v) => set("juryMode", v)} />
        <Field label="Stimmen pro Nutzer">
          <input type="number" min="1" value={form.votesPerUser} onChange={(e) => set("votesPerUser", e.target.value)} className={inputCls} />
        </Field>
      </Section>

      <Section title="Gewinn">
        <Field label="Gewinnbeschreibung" wide>
          <textarea value={form.prizeDescription} onChange={(e) => set("prizeDescription", e.target.value)} rows={2} placeholder="z. B. Ein persönliches Video nach Wunsch" className={cn(inputCls, "resize-none")} />
        </Field>
        <Field label="Gewinn in Coins">
          <input type="number" min="0" value={form.prizeCoins} onChange={(e) => set("prizeCoins", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Eigener Gewinn">
          <input value={form.prizeCustom} onChange={(e) => set("prizeCustom", e.target.value)} placeholder="z. B. Freimonat" className={inputCls} />
        </Field>
        <Toggle id="contest-gold" label="Gewinner wird Gold-Member" hint="Alles gratis, dauerhaft" checked={form.prizeGold} onChange={(v) => set("prizeGold", v)} />
      </Section>

      <Section title="Darstellung">
        <Field label="Titelbild" wide>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ImagePlus className="w-4 h-4" /> Bild wählen
              <input type="file" accept="image/*" onChange={uploadCover} className="hidden" />
            </label>
            {form.coverImage && (
              <div className="relative">
                <Image src={form.coverImage} fittingType="fill" className="w-20 h-12 rounded-lg" />
                <button onClick={() => set("coverImage", "")} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white text-xs leading-none">×</button>
              </div>
            )}
          </div>
        </Field>
        <Toggle id="contest-featured" label="Hervorheben" hint="Erscheint oben und größer" checked={form.featured} onChange={(v) => set("featured", v)} />
        <Toggle id="contest-published" label="Veröffentlicht" hint="Aus = nur du siehst ihn im Studio" checked={form.published} onChange={(v) => set("published", v)} />
      </Section>

      <div className="flex gap-3 pt-1">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Speichert …" : "Speichern"}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  );
}