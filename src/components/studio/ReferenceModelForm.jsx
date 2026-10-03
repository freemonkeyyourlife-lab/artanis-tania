import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Upload, Loader2, X } from "lucide-react";
import { inputCls } from "@/lib/narratorUi";

const KINDS = [
  { value: "FRAU", label: "Frau" },
  { value: "MANN", label: "Mann" },
  { value: "PAAR", label: "Paar" },
  { value: "GRUPPE", label: "Gruppe" },
];

const empty = { name: "", kind: "FRAU", useFor: "", bodyNote: "", tags: [], images: [] };

// Ein Vorbild anlegen oder ändern: Bilder hochladen, darunter schreiben, wofür
// sie taugt — damit daraus später ein Baustein wird.
export default function ReferenceModelForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial ? { ...empty, ...initial } : empty);
  const [tagText, setTagText] = useState((initial?.tags || []).join(", "));
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    const urls = [];
    for (const f of files) {
      const res = await base44.integrations.Core.UploadPublicFile({ file: f });
      urls.push(res.file_url);
    }
    setForm((f) => ({ ...f, images: [...f.images, ...urls], avatar: f.avatar || urls[0] }));
    setBusy(false);
    e.target.value = "";
  };

  const save = async () => {
    if (!form.name.trim()) return;
    const tags = tagText.split(",").map((t) => t.trim()).filter(Boolean);
    const data = { ...form, tags, avatar: form.avatar || form.images[0] || "" };
    if (initial?.id) await base44.entities.ReferenceModel.update(initial.id, data);
    else await base44.entities.ReferenceModel.create(data);
    onSaved();
  };

  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-card p-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[13px] font-bold text-muted-foreground">Name</label>
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="z. B. Vorbild 1" />
        </div>
        <div>
          <label className="text-[13px] font-bold text-muted-foreground">Art</label>
          <select className={inputCls} value={form.kind} onChange={(e) => set("kind", e.target.value)}>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="text-[13px] font-bold text-muted-foreground">Wofür verwendbar</label>
        <textarea className={inputCls} rows={2} value={form.useFor} onChange={(e) => set("useFor", e.target.value)} placeholder="z. B. Urlaubsflirt, Strand, frech" />
      </div>

      <div className="mt-3">
        <label className="text-[13px] font-bold text-muted-foreground">Körper & Auftreten</label>
        <textarea className={inputCls} rows={2} value={form.bodyNote} onChange={(e) => set("bodyNote", e.target.value)} placeholder="z. B. groß, kurvig, lange dunkle Haare" />
      </div>

      <div className="mt-3">
        <label className="text-[13px] font-bold text-muted-foreground">Schlagworte (mit Komma getrennt)</label>
        <input className={inputCls} value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="urlaub, strand, frech" />
      </div>

      <div className="mt-4">
        <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? "Lädt …" : "Bilder hochladen"}
          <input type="file" accept="image/*" multiple onChange={pick} className="hidden" />
        </label>
        {form.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {form.images.map((url) => (
              <div key={url} className="relative group">
                <Image src={url} fittingType="fill" className="w-20 h-20 rounded-xl" />
                <button
                  onClick={() => set("images", form.images.filter((u) => u !== url))}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-5">
        <button onClick={save} disabled={!form.name.trim()} className="px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-50">
          Speichern
        </button>
        <button onClick={onCancel} className="px-6 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground">
          Abbrechen
        </button>
      </div>
    </div>
  );
}