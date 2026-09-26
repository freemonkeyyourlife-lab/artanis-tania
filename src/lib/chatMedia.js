// Parsing of AI reply media markers + the "first 10 creations free" counter.

export const FREE_CREATIONS = 10;

// Returns { cleanText, images:[{desc,price}], videos:[{desc}], voice, suggestions }
export function parseReply(text) {
  let clean = text || "";
  const images = [];
  const videos = [];
  let voice = null;
  let suggestions = [];

  clean = clean.replace(/\[SEND_PPV:\s*(.+?)\s*\|\s*(\d+(?:\.\d+)?)\s*\]/g, (_, desc, price) => {
    images.push({ desc: desc.trim(), price: parseFloat(price) });
    return "";
  });
  clean = clean.replace(/\[SEND_IMAGE:\s*([^\]]+?)\s*\]/g, (_, desc) => {
    images.push({ desc: desc.trim(), price: null });
    return "";
  });
  clean = clean.replace(/\[SEND_VIDEO:\s*([^\]]+?)\s*\]/g, (_, desc) => {
    videos.push({ desc: desc.trim() });
    return "";
  });

  const vm = clean.match(/\[SEND_VOICE:\s*([^\]]+?)\s*\]/);
  if (vm) {
    voice = vm[1].trim();
    clean = clean.replace(vm[0], "");
  }

  const sm = clean.match(/\[SUGGEST:\s*(.+?)\s*\]/);
  if (sm) {
    suggestions = sm[1].split("|").map((s) => s.trim()).filter(Boolean);
    clean = clean.replace(sm[0], "");
  }

  return { cleanText: clean.trim(), images, videos, voice, suggestions };
}

function storageKey(userId) {
  return `freeCreations_${userId || "anon"}`;
}

export function freeRemaining(userId) {
  const used = parseInt(localStorage.getItem(storageKey(userId)) || "0", 10);
  return Math.max(0, FREE_CREATIONS - used);
}

// Consumes one free creation. Returns true if it was free, false if the user is over the limit.
export function consumeFree(userId) {
  const k = storageKey(userId);
  const used = parseInt(localStorage.getItem(k) || "0", 10);
  if (used >= FREE_CREATIONS) return false;
  localStorage.setItem(k, String(used + 1));
  return true;
}