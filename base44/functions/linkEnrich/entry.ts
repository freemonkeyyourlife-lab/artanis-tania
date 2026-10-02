import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { classify, fetchPage, hostOf, labelOf, modelIdOf, readMeta } from '../../shared/linkRead.ts';

// Eine Liste von Adressen rein — je Adresse kommt zurück, was auf der Seite steht:
// Titel, Vorschaubild, Beschreibung und die Modell-Angaben. Damit lässt sich die
// Sammlung in einem Zug füllen, statt jede Adresse einzeln einzutippen.

const MAX_PER_CALL = 12;

// „… · Hugging Face" hinten dran ist Werbung, nicht der Titel.
function tidyTitle(title, host) {
  const m = String(title || "").match(/^(.*?)\s*[·|–—]\s*([^·|–—]{2,40})$/);
  if (!m) return title;
  const brand = m[2].toLowerCase().replace(/[^a-z0-9]/g, "");
  const hostKey = String(host || "").replace(/[^a-z0-9]/g, "");
  if (brand.length >= 3 && hostKey.includes(brand)) return m[1].trim();
  return title;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const raw = Array.isArray(body.urls) ? body.urls : [];
    if (!raw.length) return Response.json({ error: "Keine Adressen übergeben." }, { status: 400 });

    const urls = [];
    const seen = new Set();
    for (const entry of raw) {
      const value = String(entry || "").trim();
      if (!value) continue;
      let full = value;
      try {
        full = /^https?:\/\//i.test(value) ? new URL(value).href : new URL(`https://${value}`).href;
      } catch (e) {
        continue;
      }
      const key = full.split("#")[0];
      if (seen.has(key)) continue;
      seen.add(key);
      urls.push(key);
      if (urls.length >= MAX_PER_CALL) break;
    }
    if (!urls.length) return Response.json({ error: "Keine gültige Adresse dabei." }, { status: 400 });

    const items = [];
    for (const url of urls) {
      items.push(await readOne(url));
    }

    return Response.json({ items, read: items.filter((i) => i.ok).length });
  } catch (error) {
    console.error("linkEnrich", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function readOne(url) {
  const host = hostOf(url);
  const kind = classify(url) || "LINK";
  const modelId = modelIdOf(url);
  const base = { url, host, kind, modelId };

  // Eine direkte Datei braucht keine Seite zu laden.
  if (kind === "BILD" || kind === "VIDEO" || kind === "AUDIO") {
    return {
      ...base,
      ok: true,
      title: labelOf(url),
      image: kind === "BILD" ? url : "",
      description: "",
      keywords: "",
    };
  }

  try {
    const html = await fetchPage(url);
    const meta = readMeta(html, url);
    return {
      ...base,
      ok: true,
      title: tidyTitle(meta.title, host) || labelOf(url),
      image: meta.image || "",
      description: meta.description || "",
      keywords: meta.keywords || "",
    };
  } catch (e) {
    return {
      ...base,
      ok: false,
      title: labelOf(url),
      image: "",
      description: "",
      keywords: "",
      error: e.message || "nicht erreichbar",
    };
  }
}