import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import UploadZone from "@/components/trainingsset/UploadZone";
import SetCard from "@/components/trainingsset/SetCard";
import { ArrowRight, Loader2 } from "lucide-react";

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

// Trainingsset: Upload von überall → pro Person sortieren → bei zu wenig
// Bildern Set auffüllen → daraus einen Charakter ziehen.
export default function Trainingsset() {
  const [pool, setPool] = useState([]);
  const [poolUrls, setPoolUrls] = useState({});
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPerson, setNewPerson] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const page = await base44.entities.TrainingSet.filter(
      {},
      { sort: "-created_date", limit: 100 }
    );
    setSets(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    (async () => {
      const map = {};
      for (const p of pool) {
        if (!poolUrls[p.uri] && p.type === "IMAGE") {
          map[p.uri] = await sign(p.uri);
        }
      }
      if (Object.keys(map).length) setPoolUrls((m) => ({ ...m, ...map }));
    })();
  }, [pool]);

  const onUploaded = (uri, type, name) => {
    setPool((p) => [...p, { uri, type, name }]);
  };

  const assignOne = async (uri) => {
    const person = (newPerson[uri] || "").trim();
    if (!person) return;
    const item = pool.find((p) => p.uri === uri);
    setBusy(true);
    try {
      let target = sets.find((s) => s.personName === person);
      if (!target) {
        target = await base44.entities.TrainingSet.create({
          personName: person,
          name: `Set ${person}`,
          images: [],
          generatedImages: [],
          sourceMedia: [],
          targetCount: 12,
        });
      }
      const images =
        item.type === "IMAGE" ? [...(target.images || []), uri] : target.images || [];
      const sourceMedia =
        item.type === "VIDEO" ? [...(target.sourceMedia || []), uri] : target.sourceMedia || [];
      await base44.entities.TrainingSet.update(target.id, {
        images,
        sourceMedia,
        avatar: target.avatar || (item.type === "IMAGE" ? uri : target.avatar),
      });
      setPool((p) => p.filter((x) => x.uri !== uri));
      await load();
    } finally {
      setBusy(false);
    }
  };

  const extract = async (set) => {
    setBusy(true);
    try {
      const refUri = (set.images || [])[0];
      const refUrl = refUri ? await sign(refUri) : null;
      let appearance = "";
      if (refUrl) {
        const r = await base44.integrations.Core.InvokeLLM({
          prompt:
            "Beschreibe das Aussehen der Person auf diesem Bild in 2-3 Sätzen, auf Deutsch. Erwachsene Person.",
          file_urls: [refUrl],
        });
        appearance = typeof r === "string" ? r : String(r || "");
      }
      await base44.entities.Character.create({
        name: set.personName,
        adultAge: 25,
        appearance,
        avatar: refUri || "",
        images: set.images || [],
        fictional: true,
        createdByRole: "DAVID",
      });
      await base44.entities.TrainingSet.update(set.id, { status: "BEREIT" });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-4xl text-foreground text-gloss">Trainingsset</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Bilder und Videos von überall hochladen, pro Person sortieren, bei zu wenig Bildern ein
        Set auffüllen und daraus einen Charakter ziehen.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <UploadZone onUploaded={onUploaded} />

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-heading text-foreground">Pool — noch nicht zugeordnet</h2>
          {pool.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Lade Bilder hoch, dann ordne sie hier einer Person zu.
            </p>
          ) : (
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto scrollbar-hide">
              {pool.map((p) => (
                <div key={p.uri} className="flex items-center gap-3 rounded-xl bg-elevated p-2">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                    {p.type === "IMAGE" && poolUrls[p.uri] ? (
                      <Image src={poolUrls[p.uri]} fittingType="fill" className="h-full w-full" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        {p.type}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      list="persons"
                      value={newPerson[p.uri] ?? ""}
                      onChange={(e) =>
                        setNewPerson((m) => ({ ...m, [p.uri]: e.target.value }))
                      }
                      placeholder="Person eintippen oder wählen"
                      className="w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground"
                    />
                    <datalist id="persons">
                      {sets.map((s) => (
                        <option key={s.id} value={s.personName} />
                      ))}
                    </datalist>
                  </div>
                  <button
                    onClick={() => assignOne(p.uri)}
                    disabled={busy || !(newPerson[p.uri] || "").trim()}
                    className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                    Zu
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="font-heading text-foreground">Sets pro Person</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Lade …</p>
        ) : sets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Sets — ordne Bilder aus dem Pool einer Person zu.
          </p>
        ) : (
          sets.map((s) => (
            <SetCard key={s.id} set={s} onChanged={load} onExtract={extract} />
          ))
        )}
      </section>
    </div>
  );
}