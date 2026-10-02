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

// Woher das Modell kommt — davon hängt ab, über welchen Weg es gerechnet wird.
const imageSourceOf = (host) => {
  const h = String(host || "").toLowerCase();
  if (h.includes("pollinations")) return "POLLINATIONS";
  if (h.includes("fal.") || h.includes("falai")) return "FAL_AI";
  if (h.includes("huggingface") || h.includes("hf.co")) return "HUGGING_FACE";
  return "EXTERN";
};

const LIBRARY = { BILD: "ImageModel", TEXT: "TextModel", VIDEO: "VideoModel", AUDIO: "VoiceModel" };

// Ein erkannter Model-Link wird auch für die Generierung nutzbar: er landet in
// der Modell-Bibliothek des passenden Bereichs. Ohne Kennung geht das nicht —
// dann bleibt er als Link in der Sammlung stehen.
async function registerModels(rows) {
  const groups = { BILD: [], TEXT: [], VIDEO: [], AUDIO: [] };
  rows.filter((r) => r.modelId).forEach((r) => groups[modelKindOf(r)].push(r));
  const added = { BILD: 0, TEXT: 0, VIDEO: 0, AUDIO: 0 };

  for (const [kind, list] of Object.entries(groups)) {
    if (!list.length) continue;
    const entity = base44.entities[LIBRARY[kind]];
    const existing = new Set(asArray(await entity.list("created_date", 1000)).map((m) => m.modelId));
    const fresh = list.filter((r) => !existing.has(r.modelId));
    if (!fresh.length) continue;

    const records = fresh.map((r) => {
      const name = r.title || r.modelId;
      const note = (r.description || "").slice(0, 300);
      if (kind === "BILD") {
        return {
          name,
          modelId: r.modelId,
          source: imageSourceOf(r.host),
          style: "GEMISCHT",
          note,
          description: note,
          url: r.url,
          enabled: true,
        };
      }
      if (kind === "AUDIO") {
        return {
          name,
          modelId: r.modelId,
          provider: "EXTERN",
          multilingual: true,
          note,
          description: note,
          url: r.url,
          enabled: true,
        };
      }
      return { name, modelId: r.modelId, note, description: note, enabled: true };
    });

    await entity.bulkCreate(records);
    added[kind] = records.length;
  }
  return added;
}

// Modelle wandern in die Modell-Links, alles andere in die Dienste-Liste.
// Was schon dasteht, bleibt unangetastet.
export async function saveEnriched(rows) {
  const models = rows.filter((r) => r.kind === "MODELL");
  const others = rows.filter((r) => r.kind !== "MODELL");
  const saved = { MODELL: 0, DIENST: 0 };
  const skipped = { MODELL: 0, DIENST: 0 };
  let library = { BILD: 0, TEXT: 0, VIDEO: 0, AUDIO: 0 };

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
    library = await registerModels(models);
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

  return { saved, skipped, library };
}