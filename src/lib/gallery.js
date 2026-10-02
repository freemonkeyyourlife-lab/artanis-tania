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