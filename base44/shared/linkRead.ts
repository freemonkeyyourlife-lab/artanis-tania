// Gemeinsame Lesehilfen für alles, was fremde Seiten öffnet und auswertet.
// Wird von linkHarvest und linkEnrich genutzt.

export const UA =
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

// Menüpunkte und Übersichtsseiten sind keine Modelle — nur echte Modellseiten zählen.
const NAV_WORDS = [
  "pricing", "login", "signup", "join", "settings", "docs", "blog", "changelog", "about", "terms",
  "privacy", "articles", "comics", "hubs", "images", "videos", "3d-models", "models", "datasets",
  "spaces", "papers", "tasks", "organizations", "new", "trending", "collections", "api", "careers",
  "support", "contact", "search", "tags", "posts", "discussions", "repos", "stars", "marketplace",
];

const MODEL_PATH = /\/(?:models?|loras?|checkpoints?)\/[\w.-]+/;

export const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch (e) {
    return "";
  }
};

export const extOf = (url) => {
  try {
    const m = new URL(url).pathname.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
    return m ? m[1] : "";
  } catch (e) {
    return "";
  }
};

export const labelOf = (url) => {
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

export function isModelUrl(host, path) {
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
export function classify(url) {
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

// Die Kennung eines Modells — aus der Adresse gelesen.
export function modelIdOf(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const segs = u.pathname.split("/").filter(Boolean);
    const fromQuery = u.searchParams.get("model");
    if (fromQuery) return fromQuery.trim();

    if (host.endsWith("huggingface.co")) {
      if (segs.length >= 2 && !NAV_WORDS.includes(segs[0])) return `${segs[0]}/${segs[1]}`;
      return "";
    }
    if (host.endsWith("civitai.com")) {
      const at = segs.indexOf("models");
      if (at >= 0 && segs[at + 1]) return segs[at + 1];
      return "";
    }
    if (host.endsWith("openrouter.ai")) {
      const at = segs.indexOf("models");
      if (at >= 0 && segs[at + 1]) return segs.slice(at + 1).join("/");
      return "";
    }
    return "";
  } catch (e) {
    return "";
  }
}

export async function fetchPage(url) {
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

// Alles aus dem Quelltext holen, was eine Adresse sein könnte.
export function extract(html, base) {
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

  for (const v of [
    ...grab("img", "src"),
    ...grab("img", "data-src"),
    ...grab("img", "data-original"),
    ...grab("img", "data-lazy-src"),
  ]) {
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

// Titel, Beschreibung, Vorschaubild und Schlagworte einer Seite.
export function readMeta(html, base) {
  const abs = (raw) => {
    const v = String(raw || "").trim();
    if (!v || /\s/.test(v)) return "";
    try {
      return new URL(v, base).href;
    } catch (e) {
      return "";
    }
  };

  // &amp; und Co. sind Schreibweise, nicht Adresse.
  const decode = (value) =>
    String(value || "")
      .replace(/&amp;/gi, "&")
      .replace(/&#0?38;/g, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&nbsp;/gi, " ");

  const pick = (pattern) => {
    const m = html.match(pattern);
    return m ? decode(m[1]).replace(/\s+/g, " ").trim() : "";
  };

  const metaOf = (key) => {
    const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return (
      pick(new RegExp(`<meta\\b[^>]*?(?:property|name)\\s*=\\s*["']${esc}["'][^>]*?content\\s*=\\s*["']([^"']*)["']`, "i")) ||
      pick(new RegExp(`<meta\\b[^>]*?content\\s*=\\s*["']([^"']*)["'][^>]*?(?:property|name)\\s*=\\s*["']${esc}["']`, "i"))
    );
  };

  const { links, images } = extract(html, base);

  const title =
    metaOf("og:title") ||
    metaOf("twitter:title") ||
    pick(/<title[^>]*>([\s\S]*?)<\/title>/i) ||
    pick(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  const image = decode(abs(metaOf("og:image") || metaOf("twitter:image") || images[0] || ""));

  const description = metaOf("og:description") || metaOf("description") || metaOf("twitter:description");

  const keywords = metaOf("keywords");

  return {
    title: title.slice(0, 140),
    image,
    description: description.slice(0, 400),
    keywords: keywords.slice(0, 300),
    links,
    images,
  };
}