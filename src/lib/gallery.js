// Sammelt alle im Chat erzeugten Bilder aus den Nachrichten-Anhängen.
import { base44 } from "@/api/base44Client";

export function collectImages(conversations, messages, creators = []) {
  const convById = new Map(conversations.map((c) => [c.id, c]));
  const nameById = new Map(creators.map((c) => [c.id, c.stageName]));
  const seen = new Set();
  const items = [];

  for (const m of messages) {
    const conv = convById.get(m.conversationId);
    if (!conv) continue;
    for (const a of m.attachments || []) {
      if (a?.type !== "image" || !a.url || seen.has(a.url)) continue;
      seen.add(a.url);
      items.push({
        url: a.url,
        label: a.label || null,
        locked: !!a.locked,
        price: a.price ?? null,
        creatorId: conv.creatorId || "",
        creatorName: nameById.get(conv.creatorId) || conv.creatorName || "Ohne Zuordnung",
        userName: conv.userName || "",
        createdAt: m.created_date,
      });
    }
  }

  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function groupByCreator(items) {
  const map = new Map();
  for (const img of items) {
    const entry = map.get(img.creatorId);
    if (entry) entry.count += 1;
    else map.set(img.creatorId, { id: img.creatorId, name: img.creatorName, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

// Jedes Bild, das im Charakter-Bereich hochgeladen wird, wird sofort ein
// Galerie-Eintrag im Profil dieses Charakters.
export async function addGalleryItems({ urls = [], creatorId, creatorName = "" }) {
  const list = [...new Set(urls.filter(Boolean))];
  if (!list.length || !creatorId) return [];
  return base44.entities.Content.bulkCreate(
    list.map((url) => ({
      creatorId,
      creatorName,
      title: `${creatorName || "Charakter"} — Bild`,
      contentType: "PHOTO",
      thumbnail: url,
      previewAsset: url,
      fullAsset: url,
      price: 0,
      isFree: true,
      visibility: "PUBLIC",
      published: true,
      publishedAt: new Date().toISOString(),
      ageRestricted: true,
    }))
  );
}

// Nachfassen: Hauptbild und Referenzen eines Charakters werden nachgetragen,
// wenn sie noch nicht in seiner Galerie stehen.
export async function syncCreatorGalleries(creators = []) {
  const list = creators.filter((c) => c.id && (c.avatar || (c.referenceImages || []).length));
  if (!list.length) return 0;

  const page = await base44.entities.Content.filter(
    { creatorId: { $in: list.map((c) => c.id) } },
    { fields: ["creatorId", "fullAsset", "thumbnail"], limit: 2000 }
  );
  const have = new Set((page.items || []).map((c) => `${c.creatorId}|${c.fullAsset || c.thumbnail}`));

  const byCreator = new Map();
  for (const c of list) {
    for (const url of [c.avatar, ...(c.referenceImages || [])]) {
      if (!url) continue;
      const key = `${c.id}|${url}`;
      if (have.has(key)) continue;
      have.add(key);
      if (!byCreator.has(c.id)) byCreator.set(c.id, { name: c.stageName || "", urls: [] });
      byCreator.get(c.id).urls.push(url);
    }
  }

  let added = 0;
  for (const [creatorId, entry] of byCreator) {
    await addGalleryItems({ urls: entry.urls, creatorId, creatorName: entry.name });
    added += entry.urls.length;
  }
  return added;
}