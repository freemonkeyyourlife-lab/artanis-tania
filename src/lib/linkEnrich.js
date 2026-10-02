import { base44 } from "@/api/base44Client";

const asArray = (res) => (Array.isArray(res) ? res : res?.items || []);

// Aus dem Eingetippten oder Hochgeladenen werden saubere, eindeutige Adressen.
export function parseLinks(text) {
  const found = String(text || "").match(/https?:\/\/[^\s"'<>)\]]+/gi) || [];
  const seen = new Set();
  const out = [];
  for (const raw of found) {
    const url = raw.replace(/[.,;:]+$/, "");
    const key = url.split("#")[0];
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

// Immer zehn Adressen auf einmal — so bleibt jeder Aufruf kurz.
export async function enrichLinks(urls, onProgress) {
  const all = [];
  let done = 0;
  for (let i = 0; i < urls.length; i += 10) {
    const chunk = urls.slice(i, i + 10);
    const res = await base44.functions.invoke("linkEnrich", { urls: chunk });
    if (res.data?.error) throw new Error(res.data.error);
    all.push(...(res.data.items || []));
    done += chunk.length;
    onProgress?.(done, urls.length);
  }
  return all;
}

const modelKindOf = (row) => {
  if (/openrouter\.ai/i.test(row.url)) return "TEXT";
  if (row.kind === "VIDEO" || /video/i.test(row.url)) return "VIDEO";
  if (row.kind === "AUDIO") return "AUDIO";
  return "BILD";
};

// Modelle wandern in die Modell-Links, alles andere in die Dienste-Liste.
// Was schon dasteht, bleibt unangetastet.
export async function saveEnriched(rows) {
  const models = rows.filter((r) => r.kind === "MODELL");
  const others = rows.filter((r) => r.kind !== "MODELL");
  const saved = { MODELL: 0, DIENST: 0 };
  const skipped = { MODELL: 0, DIENST: 0 };

  if (models.length) {
    const existing = new Set(asArray(await base44.entities.ModelLink.list("name", 1000)).map((l) => l.url));
    const fresh = models.filter((m) => !existing.has(m.url));
    skipped.MODELL = models.length - fresh.length;
    if (fresh.length) {
      await base44.entities.ModelLink.bulkCreate(
        fresh.map((m) => ({
          name: m.title || m.host,
          url: m.url,
          kind: modelKindOf(m),
          image: m.image || "",
          io: m.modelId || "",
          note: [m.description, m.keywords].filter(Boolean).join(" · ").slice(0, 300),
        }))
      );
      saved.MODELL = fresh.length;
    }
  }

  if (others.length) {
    const existing = new Set(asArray(await base44.entities.ExternalService.list("name", 1000)).map((l) => l.url));
    const fresh = others.filter((o) => !existing.has(o.url));
    skipped.DIENST = others.length - fresh.length;
    if (fresh.length) {
      await base44.entities.ExternalService.bulkCreate(
        fresh.map((o) => ({
          name: o.title || o.host,
          url: o.url,
          category: o.host,
          note: (o.description || "").slice(0, 300),
        }))
      );
      saved.DIENST = fresh.length;
    }
  }

  return { saved, skipped };
}