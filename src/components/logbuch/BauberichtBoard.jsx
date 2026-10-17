import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { CheckCircle2, CircleDashed, AlertTriangle, Upload, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Das grüne Licht: jeder Block des Bauauftrags 2530 steht hier mit seinem
// Stand — fertig grün, teilweise gelb, offen grau. Und mit Belegfeld: du
// lädst den Screenshot hoch, er bleibt am Block hängen (stored privately).
const LIGHT = {
  FERTIG: { Icon: CheckCircle2, text: "text-emerald-400", ring: "ring-emerald-400/40", label: "Fertig" },
  TEILWEISE: { Icon: AlertTriangle, text: "text-amber-400", ring: "ring-amber-400/40", label: "Teilweise" },
  OFFEN: { Icon: CircleDashed, text: "text-muted-foreground", ring: "ring-border", label: "Offen" },
};

export default function BauberichtBoard() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proofUrls, setProofUrls] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const page = await base44.entities.Baubericht.filter({}, { sort: "order", limit: 100 });
    setBlocks(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  // Belege liegen privat — zum Anzeigen wird pro Bild ein kurzlebiger Link geholt.
  useEffect(() => {
    (async () => {
      const map = {};
      for (const block of blocks) {
        for (let i = 0; i < (block.proofImages || []).length; i += 1) {
          try {
            const res = await base44.integrations.Core.CreateFileSignedUrl({
              file_uri: block.proofImages[i],
              expires_in: 3600,
            });
            map[`${block.id}:${i}`] = res.signed_url;
          } catch (e) {
            /* einzelner Beleg nicht lesbar — der Rest bleibt */
          }
        }
      }
      setProofUrls(map);
    })();
  }, [blocks]);

  const addProof = async (block, file) => {
    if (!file) return;
    setBusyId(block.id);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const proofImages = [...(block.proofImages || []), file_uri];
      await base44.entities.Baubericht.update(block.id, { proofImages });
      setBlocks((cur) => cur.map((b) => (b.id === block.id ? { ...b, proofImages } : b)));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Lade den Baubericht …</p>;
  }

  const done = blocks.filter((b) => b.status === "FERTIG").length;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-foreground">Abschlussbericht 2530</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Jeder Block mit seinem Stand — und einem Feld für den Beleg-Screenshot.
          </p>
        </div>
        <p className="text-sm font-bold text-emerald-400">
          {done} von {blocks.length} fertig
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {blocks.map((block) => {
          const light = LIGHT[block.status] || LIGHT.OFFEN;
          const { Icon } = light;
          return (
            <div key={block.id} className={cn("rounded-2xl bg-elevated p-4 ring-2", light.ring)}>
              <div className="flex items-start gap-3">
                <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", light.text)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg text-foreground">{block.title}</h3>
                    <span className={cn("text-[11px] font-bold uppercase tracking-wider", light.text)}>
                      {light.label}
                    </span>
                  </div>
                  {block.summary && (
                    <p className="mt-1 text-sm text-muted-foreground">{block.summary}</p>
                  )}

                  {(block.done || []).length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {block.done.map((line, i) => (
                        <li key={i} className="text-[13px] text-foreground">
                          <span className="text-emerald-400">✓</span> {line}
                        </li>
                      ))}
                    </ul>
                  )}

                  {(block.missing || []).length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {block.missing.map((line, i) => (
                        <li key={i} className="text-[13px] text-amber-300">
                          <span>•</span> {line}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {block.verifyPath && (
                      <Link
                        to={block.verifyPath}
                        className="inline-flex items-center gap-1.5 rounded-full glass-btn px-4 py-2 text-[12px] font-bold text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {block.verifyLabel || "Selbst prüfen"}
                      </Link>
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full glass-btn px-4 py-2 text-[12px] font-bold text-foreground">
                      {busyId === block.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      Beleg hochladen
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => addProof(block, e.target.files?.[0])}
                      />
                    </label>
                  </div>

                  {(block.proofImages || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {block.proofImages.map((uri, i) => {
                        const url = proofUrls[`${block.id}:${i}`];
                        return (
                          <a
                            key={uri}
                            href={url || undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="h-20 w-28 overflow-hidden rounded-xl bg-background"
                            title="Beleg öffnen"
                          >
                            {url ? (
                              <Image src={url} fittingType="fill" className="h-full w-full" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                Beleg {i + 1}
                              </span>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}