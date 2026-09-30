import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { Upload, X, Save, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import VoiceInput from "@/components/VoiceInput";
import CharacterVoiceBox from "@/components/studio/CharacterVoiceBox";

const PERSONA_TYPES = [
  { value: "SOLO_FEMALE", label: "Frau (solo)" },
  { value: "SOLO_MALE", label: "Mann (solo)" },
  { value: "SHEMALE", label: "Shemale / Trans" },
  { value: "COUPLE", label: "Paar" },
  { value: "GROUP", label: "Gruppe (mehrere)" },
];
const CATEGORIES = [
  { value: "AI_MODEL", label: "KI-Modell" },
  { value: "REAL", label: "Real" },
];
const STATUSES = ["AI_AVAILABLE", "ONLINE", "LIVE", "BUSY", "AWAY", "OFFLINE", "SCHEDULED"];
const VOICES = [
  { value: "river", label: "River — ruhig, neutral" },
  { value: "honey", label: "Honey — warm, weich" },
  { value: "sunny", label: "Sunny — hell, fröhlich" },
  { value: "storm", label: "Storm — fest, autoritär" },
  { value: "spark", label: "Spark — energisch, schnell" },
];

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

export default function CharacterForm({ initial, onSaved, onCancel }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    stageName: initial?.stageName || "",
    personaType: initial?.personaType || "SOLO_FEMALE",
    creatorCategory: initial?.creatorCategory || "AI_MODEL",
    age: initial?.age ?? "",
    tagline: initial?.tagline || "",
    bio: initial?.bio || "",
    topics: (initial?.topics || []).join(", "),
    tags: (initial?.tags || []).join(", "),
    onlineStatus: initial?.onlineStatus || "AI_AVAILABLE",
    voice: initial?.voice || "river",
    voiceProfileId: initial?.voiceProfileId || "",
    featured: initial?.featured || false,
    active: initial ? initial.active !== false : true,
    avatar: initial?.avatar || "",
    banner: initial?.banner || "",
    referenceImages: initial?.referenceImages || [],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadFile = async (file) => {
    const res = await base44.integrations.Core.UploadPublicFile({ file });
    return res.file_url;
  };

  const pickSingle = (field) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { set(field, await uploadFile(file)); }
    catch (err) { toast({ title: "Upload fehlgeschlagen", variant: "destructive" }); }
    finally { setUploading(false); e.target.value = ""; }
  };

  // Mehrere Bilder auf einmal: das erste wird das Hauptbild, alle weiteren sind Referenzen.
  const pickMany = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadFile(f));
      setForm((f) => {
        const rest = [...urls];
        let avatar = f.avatar;
        if (!avatar && rest.length) avatar = rest.shift();
        return { ...f, avatar, referenceImages: [...f.referenceImages, ...rest] };
      });
    } catch (err) { toast({ title: "Upload fehlgeschlagen", variant: "destructive" }); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const pickRefs = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadFile(f));
      set("referenceImages", [...form.referenceImages, ...urls]);
    } catch (err) { toast({ title: "Upload fehlgeschlagen", variant: "destructive" }); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const removeRef = (url) => set("referenceImages", form.referenceImages.filter((u) => u !== url));

  const save = async () => {
    if (!form.stageName.trim()) {
      toast({ title: "Name fehlt", description: "Bitte gib dem Charakter einen Namen.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = {
        stageName: form.stageName.trim(),
        personaType: form.personaType,
        creatorCategory: form.creatorCategory,
        tagline: form.tagline,
        bio: form.bio,
        topics: form.topics.split(",").map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        onlineStatus: form.onlineStatus,
        voice: form.voice,
        voiceProfileId: form.voiceProfileId,
        featured: form.featured,
        active: form.active,
        avatar: form.avatar,
        banner: form.banner || form.avatar,
        referenceImages: form.referenceImages,
      };
      if (form.age !== "" && form.age !== null) data.age = Number(form.age);
      if (initial?.id) await base44.entities.Creator.update(initial.id, data);
      else await base44.entities.Creator.create(data);
      toast({ title: initial?.id ? "Charakter gespeichert" : "Charakter erstellt" });
      onSaved?.();
    } catch (e) {
      toast({ title: "Fehler", description: "Konnte nicht speichern.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-6">
      <h2 className="font-display text-xl text-foreground mb-5">
        {initial?.id ? `"${initial.stageName}" bearbeiten` : "Neuen Charakter erstellen"}
      </h2>

      <div className="flex items-start gap-2 mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200/90">
          Nutze nur eigene oder KI-generierte Bilder. Keine Fotos realer Personen verwenden.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
          <input value={form.stageName} onChange={(e) => set("stageName", e.target.value)} placeholder="z. B. Lena" className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Typ</label>
          <select value={form.personaType} onChange={(e) => set("personaType", e.target.value)} className={inputCls}>
            {PERSONA_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Kategorie</label>
          <select value={form.creatorCategory} onChange={(e) => set("creatorCategory", e.target.value)} className={inputCls}>
            {CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Alter</label>
          <input type="number" min="18" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="z. B. 27" className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
          <select value={form.onlineStatus} onChange={(e) => set("onlineStatus", e.target.value)} className={inputCls}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Stimme (für Sprachnachrichten)</label>
          <select value={form.voice} onChange={(e) => set("voice", e.target.value)} className={inputCls}>
            {VOICES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>

        <CharacterVoiceBox value={form.voiceProfileId} onChange={(id) => set("voiceProfileId", id)} />

        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Tagline</label>
          <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Kurzer Spruch unter dem Namen" className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Bio / Persönlichkeit</label>
          <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={4} placeholder="Wie ist der Charakter? Aussehen, Art, Vorlieben … — tippen oder sprechen" className={cn(inputCls, "resize-none")} />
          <div className="flex items-center gap-2 mt-2">
            <VoiceInput onResult={(t) => set("bio", form.bio ? form.bio + " " + t : t)} />
            <span className="text-xs text-muted-foreground">Sprechen statt tippen — wird zu Text</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Themen (Komma-getrennt)</label>
          <input value={form.topics} onChange={(e) => set("topics", e.target.value)} placeholder="Exhibitionismus, Macht, Spritzen" className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Tags (Komma-getrennt)</label>
          <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="frech, devot, lesbisch" className={inputCls} />
        </div>

        {/* Images */}
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Bilder — so viele du willst</label>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Upload className="w-4 h-4" /> {uploading ? "Lädt …" : "Bilder wählen (mehrere)"}
            <input type="file" accept="image/*" multiple onChange={pickMany} className="hidden" />
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            Wähle 5–10 Bilder auf einmal: Das erste wird das Hauptbild, alle weiteren sind Referenzen, damit sie in jedem Chat-Bild gleich aussieht.
          </p>
          {form.avatar && (
            <div className="flex items-center gap-3 mt-3">
              <Image src={form.avatar} fittingType="fill" className="w-32 h-32 rounded-2xl" />
              <div>
                <p className="text-sm text-foreground">Hauptbild</p>
                <label className="cursor-pointer text-xs text-primary hover:underline">
                  anderes wählen
                  <input type="file" accept="image/*" onChange={pickSingle("avatar")} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Banner</label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Upload className="w-4 h-4" /> {uploading ? "Lädt …" : "Bild wählen"}
              <input type="file" accept="image/*" onChange={pickSingle("banner")} className="hidden" />
            </label>
            {form.banner && <Image src={form.banner} fittingType="fill" className="w-40 h-24 rounded-2xl" />}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Weitere Referenzbilder ({form.referenceImages.length}) — mindestens 5, gern 10</label>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Upload className="w-4 h-4" /> {uploading ? "Lädt …" : "Bilder hinzufügen"}
            <input type="file" accept="image/*" multiple onChange={pickRefs} className="hidden" />
          </label>
          {form.referenceImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.referenceImages.map((url) => (
                <div key={url} className="relative">
                  <Image src={url} fittingType="fill" className="w-24 h-24 rounded-2xl" />
                  <button onClick={() => removeRef(url)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs leading-none">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <input id="featured" type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 accent-primary" />
            <label htmlFor="featured" className="text-sm text-muted-foreground">Featured (hervorgehoben)</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="w-4 h-4 accent-primary" />
            <label htmlFor="active" className="text-sm text-muted-foreground">Aktiv (sichtbar & anwählbar)</label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={save} disabled={saving || uploading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Speichert …" : "Speichern"}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  );
}