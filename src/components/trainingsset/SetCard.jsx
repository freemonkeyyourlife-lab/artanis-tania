import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import JSZip from "jszip";
import { Sparkles, UserPlus, Loader2, Trash2, Archive } from "lucide-react";

const sign = async (uri) => {
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: uri,
      expires_in: 3600,
    });
    return r.signed_url;
  } catch {
    return null;
  }
};

// Ein Set pro Person: eigene Bilder, erzeugte Bilder, Status und Aktionen.
export default function SetCard({ set, onChanged, onExtract }) {
  const [urls, setUrls] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const map = {};
      const all = [...(set.images || []), ...(set.generatedImages || [])];
      for (const u of all) {
        if (!map[u]) map[u] = u.startsWith("http") ? u : await sign(u);
      }
      setUrls(map);
    })();
  }, [set.images, set.generatedImages]);

  const count = (set.images || []).length;
  const generated = (set.generatedImages || []).length;
  const target = set.targetCount || 12;
  const ready = count + generated >= target;

  const fill = async () => {
    setBusy(true);
    try {
      const ref = (set.images || [])[0] || (set.generatedImages || [])[0];
      const refUrls = ref ? [urls[ref] || (ref.startsWith("http") ? ref : await sign(ref))] : [];
      const res = await base44.integrations.Core.GenerateImage({
        prompt:
          `Porträt einer Person namens ${set.personName}. ` +
          "Neue Pose, gleiche Person, fotorealistisch, neutraler Hintergrund, gleiches Licht. " +
          "Erwachsene Person, keine realen Personen.",
        existing_image_urls: refUrls,
      });
      if (res?.url) {
        const generatedImages = [...(set.generatedImages || []), res.url];
        const newCount = count + generatedImages.length;
        await base44.entities.TrainingSet.update(set.id, {
          generatedImages,
          status: newCount >= target ? "BEREIT" : "SAMMLUNG",
        });
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const removeImg = async (kind, idx) => {
    const arr = [...(set[kind] || [])];
    arr.splice(idx, 1);
    await base44.entities.TrainingSet.update(set.id, { [kind]: arr });
    onChanged();
  };

  // Alle Bilder des Sets als ZIP — zum Mitnehmen zu einem Trainingsserver.
  const exportZip = async () => {
    setBusy(true);
    try {
      const zip = new JSZip();
      const all = [...(set.images || []), ...(set.generatedImages || [])];
      let i = 0;
      for (const u of all) {
        const url = u.startsWith("http") ? u : urls[u] || (await sign(u));
        if (!url) continue;
        const blob = await (await fetch(url)).blob();
        zip.file(`bild_${String(i + 1).padStart(2, "0")}.jpg`, blob);
        i += 1;
      }
      if (i === 0) return;
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = `${set.personName}-trainingsset.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-elevated p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg text-foreground">{set.personName}</h3>
          <p className="text-xs text-muted-foreground">
            {count} eigene · {generated} erzeugt · Ziel {target} ·{" "}
            <span className={ready ? "text-emerald-400" : "text-amber-400"}>
              {ready ? "bereit" : "zu wenig"}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fill}
            disabled={busy || (count === 0 && generated === 0)}
            className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Set auffüllen
          </button>
          <button
            onClick={() => onExtract(set)}
            className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" /> Zu Charakter
          </button>
          <button
            onClick={exportZip}
            disabled={busy || (count === 0 && generated === 0)}
            className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
            Als ZIP
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {(set.images || []).map((u, i) => (
          <div key={`u${i}`} className="relative h-24 w-full overflow-hidden rounded-xl bg-background">
            {urls[u] ? (
              <Image src={urls[u]} fittingType="fill" className="h-full w-full" />
            ) : (
              <div className="h-full w-full animate-pulse" />
            )}
            <button
              onClick={() => removeImg("images", i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {(set.generatedImages || []).map((u, i) => (
          <div
            key={`g${i}`}
            className="relative h-24 w-full overflow-hidden rounded-xl bg-background ring-1 ring-primary/40"
          >
            <Image src={u} fittingType="fill" className="h-full w-full" />
            <button
              onClick={() => removeImg("generatedImages", i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}