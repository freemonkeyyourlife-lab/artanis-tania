import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Eine Adresse eingeben — die Seite wird gelesen und alles Brauchbare
// herausgezogen: Bilder, Videos, Modelle, Charaktere und Links.
// Auf Wunsch geht es einen Schritt weiter und liest auch die Unterseiten.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp", "svg"];
const VIDEO_EXT = ["mp4", "webm", "mov", "m4v", "avi", "mkv"];
const AUDIO_EXT = ["mp3", "wav", "ogg", "m4a", "flac"];

const VIDEO_HOSTS = ["youtube.com", "youtu.be", "vimeo.com", "dailymotion.com"];
const MODEL_HOSTS = [
  "huggingface.co",
  "civitai.com",
  "openrouter.ai",
  "replicate.com",
  "pollinations.ai",
  "tensor.art",
  "fal.ai",
  "modelscope.cn",
];
const CHAR_HINTS = [
  "/character",
  "/characters",
  "/creator",
  "/creators",
  "/profile",
  "/profiles",
  "/user/",
  "/users/",
  "/u/",
  "/c/",
  "/@",
];

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch (e) {
    return "";
  }
};

const extOf = (url) => {
  try {
    const m = new URL(url).pathname.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
    return m ? m[1] : "";
  } catch (e) {
    return "";
  }
};

const labelOf = (url) => {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean).pop() || u.hostname;
    return (
      decodeURIComponent(seg)
        .replace(/\.\w+$/, "")
        .replace(/[-_+]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80) || u.hostname
    );
  } catch (e) {
    return String(url).slice(0, 80);
  }
};

const isHost = (host, list) => list.some((h) => host === h || host.endsWith("." + h));

// Menüpunkte und Übersichtsseiten sind keine Modelle — nur echte Modellseiten zählen.
const NAV_WORDS = [
  "pricing", "login", "signup", "join", "settings", "docs", "blog", "changelog", "about", "terms",
  "privacy", "articles", "comics", "hubs", "images", "videos", "3d-models", "models", "datasets",
  "spaces", "papers", "tasks", "organizations", "new", "trending", "collections", "api", "careers",
  "support", "contact", "search", "tags", "posts", "discussions", "repos", "stars", "marketplace",
];

const MODEL_PATH = /\/(?:models?|loras?|checkpoints?)\/[\w.-]+/;

function isModelUrl(host, path) {
  const segs = path.split("/").filter(Boolean);
  if (host === "civitai.com") return /^\/models?\/\d+/.test(path);
  if (host === "huggingface.co") {
    if (segs.length < 2) return false;
    return !NAV_WORDS.includes(segs[0]);
  }
  if (isHost(host, MODEL_HOSTS)) {
    if (segs.length < 1) return false;
    return !NAV_WORDS.includes(segs[segs.length - 1]);
  }
  return false;
}

// In welche Schublade gehört die Adresse?
function classify(url) {
  let u;
  try {
    u = new URL(url);
  } catch (e) {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;

  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const path = u.pathname.toLowerCase();
  const ext = extOf(url);

  if (VIDEO_EXT.includes(ext) || isHost(host, VIDEO_HOSTS)) return "VIDEO";
  if (IMAGE_EXT.includes(ext)) return "BILD";
  if (AUDIO_EXT.includes(ext)) return "AUDIO";
  if (isModelUrl(host, path) || MODEL_PATH.test(path)) return "MODELL";
  if (CHAR_HINTS.some((h) => path.includes(h))) return "CHARAKTER";
  return "LINK";
}

// Alles aus dem Quelltext holen, was eine Adresse sein könnte.
function extract(html, base) {
  const links = [];
  const images = [];
  const abs = (raw) => {
    const v = String(raw).trim();
    // Fließtext ist keine Adresse.
    if (!v || /\s/.test(v)) return "";
    try {
      return new URL(v, base).href;
    } catch (e) {
      return "";
    }
  };

  // Attribute stehen mal in Anführungszeichen, mal ohne — beides wird gelesen.
  const grab = (tag, attr) => {
    const re = new RegExp(`<${tag}\\b[^>]*?${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>"']+))`, "gi");
    const out = [];
    for (const m of html.matchAll(re)) {
      const v = m[1] || m[2] || m[3] || "";
      if (v) out.push(v);
    }
    return out;
  };

  for (const v of grab("a", "href")) {
    const u = abs(v);
    if (u) links.push(u);
  }

  for (const v of [...grab("img", "src"), ...grab("img", "data-src"), ...grab("img", "data-original"), ...grab("img", "data-lazy-src")]) {
    const u = abs(v);
    if (u) images.push(u);
  }

  for (const v of grab("img", "srcset")) {
    const first = v.split(",")[0]?.trim().split(/\s+/)[0];
    const u = first ? abs(first) : "";
    if (u) images.push(u);
  }

  for (const v of [...grab("video", "src"), ...grab("source", "src")]) {
    const u = abs(v);
    if (u) links.push(u);
  }

  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/(?:property|name)\s*=\s*["']?(?:og:image|twitter:image)["']?/i.test(tag)) continue;
    const c = tag.match(/content\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/i);
    const v = c ? c[1] || c[2] || c[3] || "" : "";
    const u = v ? abs(v) : "";
    if (u) images.push(u);
  }

  return { links, images };
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (!/text\/html|application\/xhtml/i.test(type)) throw new Error("Keine HTML-Seite");
  return await res.text();
}

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