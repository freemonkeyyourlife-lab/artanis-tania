import { base44 } from "@/api/base44Client";

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
};

const modelKind = (url) => {
  if (/openrouter\.ai/i.test(url)) return "TEXT";
  if (/video/i.test(url)) return "VIDEO";
  return "BILD";
};

const asArray = (res) => (Array.isArray(res) ? res : res?.items || []);

// Alles Gewählte in einem Zug an seinen Platz: Modelle zu den Modell-Links,
// Charaktere als neue Profile, Links in die Dienste-Liste und Bilder, Videos
// und Audio als Inhalte beim gewählten Charakter.
export async function saveHarvest({ items, creators = [], creatorId }) {
  const models = items.filter((i) => i.kind === "MODELL");
  const characters = items.filter((i) => i.kind === "CHARAKTER");
  const links = items.filter((i) => i.kind === "LINK");
  const media = items.filter((i) => ["BILD", "VIDEO", "AUDIO"].includes(i.kind));

  const saved = { MODELL: 0, CHARAKTER: 0, LINK: 0, MEDIEN: 0 };
  const skipped = { MODELL: 0, CHARAKTER: 0, LINK: 0 };

  if (models.length) {
    const existing = new Set(asArray(await base44.entities.ModelLink.list("name", 1000)).map((l) => l.url));
    const fresh = models.filter((m) => !existing.has(m.url));
    skipped.MODELL = models.length - fresh.length;
    if (fresh.length) {
      await base44.entities.ModelLink.bulkCreate(
        fresh.map((m) => ({
          name: m.label,
          url: m.url,
          kind: modelKind(m.url),
          note: `Gefunden auf ${hostOf(m.url)}`,
        }))
      );
      saved.MODELL = fresh.length;
    }
  }

  if (characters.length) {
    const taken = new Set(creators.map((c) => (c.stageName || "").toLowerCase()));
    const fresh = [];
    for (const c of characters) {
      const name = (c.label || "").trim();
      if (!name || taken.has(name.toLowerCase())) continue;
      taken.add(name.toLowerCase());
      fresh.push({
        stageName: name,
        personaType: "SOLO_FEMALE",
        creatorCategory: "AI_MODEL",
        tagline: hostOf(c.url),
        bio: `Gefunden auf ${hostOf(c.url)}`,
      });
    }
    skipped.CHARAKTER = characters.length - fresh.length;
    if (fresh.length) {
      await base44.entities.Creator.bulkCreate(fresh);
      saved.CHARAKTER = fresh.length;
    }
  }

  if (links.length) {
    const existing = new Set(asArray(await base44.entities.ExternalService.list("name", 1000)).map((l) => l.url));
    const fresh = links.filter((l) => !existing.has(l.url));
    skipped.LINK = links.length - fresh.length;
    if (fresh.length) {
      await base44.entities.ExternalService.bulkCreate(
        fresh.map((l) => ({ name: l.label, url: l.url, category: hostOf(l.url) }))
      );
      saved.LINK = fresh.length;
    }
  }

  if (media.length && creatorId) {
    const creator = creators.find((c) => c.id === creatorId);
    await base44.entities.Content.bulkCreate(
      media.map((m) => ({
        creatorId,
        creatorName: creator?.stageName || "",
        title: m.label,
        contentType: m.kind === "VIDEO" ? "VIDEO" : m.kind === "AUDIO" ? "AUDIO" : "PHOTO",
        thumbnail: m.url,
        previewAsset: m.url,
        fullAsset: m.url,
        isFree: true,
        visibility: "PUBLIC",
      }))
    );
    saved.MEDIEN = media.length;
  }

  return { saved, skipped, mediaWithoutCreator: media.length && !creatorId ? media.length : 0 };
}