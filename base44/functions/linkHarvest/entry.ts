import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { classify, extract, fetchPage, hostOf, labelOf, extOf } from '../../shared/linkRead.ts';

// Eine Adresse eingeben — die Seite wird gelesen und alles Brauchbare
// herausgezogen: Bilder, Videos, Modelle, Charaktere und Links.
// Auf Wunsch geht es einen Schritt weiter und liest auch die Unterseiten.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const raw = String(body.url || "").trim();
    const deep = !!body.deep;
    if (!raw) return Response.json({ error: "Keine Adresse angegeben." }, { status: 400 });

    let start;
    try {
      start = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch (e) {
      return Response.json({ error: "Die Adresse ist nicht gültig." }, { status: 400 });
    }

    const maxPages = deep ? 7 : 1;
    const items = new Map();
    const pages = [];
    const blocked = [];
    const seenPages = new Set();
    const queue = [start.href];

    const add = (url, kind) => {
      const key = url.split("#")[0];
      if (!key || items.has(key)) return;
      items.set(key, { url: key, kind, label: labelOf(key), host: hostOf(key) });
    };

    // Ist die eingegebene Adresse selbst schon eine Datei, wird nicht gelesen.
    const directKind = classify(start.href);
    if (directKind && ["BILD", "VIDEO", "AUDIO"].includes(directKind)) {
      add(start.href, directKind);
      return Response.json({
        source: start.href,
        pages: [],
        blocked: [],
        items: [...items.values()],
        counts: countByKind(items),
      });
    }

    while (queue.length && pages.length + blocked.length < maxPages) {
      const url = queue.shift();
      if (seenPages.has(url)) continue;
      seenPages.add(url);

      try {
        const html = await fetchPage(url);
        pages.push(url);
        const found = extract(html, url);
        for (const u of [...found.images, ...found.links]) {
          const kind = classify(u);
          if (kind) add(u, kind);
        }

        if (deep) {
          for (const l of found.links) {
            if (pages.length + blocked.length + queue.length >= maxPages) break;
            try {
              const lu = new URL(l);
              if (lu.hostname !== start.hostname) continue;
              if (extOf(lu.href)) continue;
              if (lu.href.includes("#")) continue;
              if (seenPages.has(lu.href)) continue;
              if (lu.pathname === "/" || lu.pathname === start.pathname) continue;
              queue.push(lu.href);
            } catch (e) {
              /* unbrauchbare Adresse */
            }
          }
        }
      } catch (e) {
        blocked.push({ url, reason: e.message || "nicht erreichbar" });
      }
    }

    if (pages.length === 0) {
      const reason = blocked[0]?.reason || "nicht erreichbar";
      return Response.json(
        {
          error: `Die Seite ließ sich nicht lesen (${reason}). Manche Portale sperren den Zugriff von außen — dann hilft nur der manuelle Weg.`,
          blocked,
        },
        { status: 502 }
      );
    }

    return Response.json({
      source: start.href,
      pages,
      blocked,
      items: [...items.values()],
      counts: countByKind(items),
    });
  } catch (error) {
    console.error("linkHarvest", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function countByKind(items) {
  const counts = { BILD: 0, VIDEO: 0, AUDIO: 0, MODELL: 0, CHARAKTER: 0, LINK: 0 };
  for (const it of items.values()) counts[it.kind] = (counts[it.kind] || 0) + 1;
  return counts;
}