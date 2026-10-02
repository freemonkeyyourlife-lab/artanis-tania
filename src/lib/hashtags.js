import { base44 } from "@/api/base44Client";

// Ein Hashtag ist ein Wort mit einer festen Bedeutung. Steht das Wort irgendwo,
// ist klar, was gemeint ist — und dieselbe Bedeutung geht in jeden Prompt mit.

export const cleanTag = (v) =>
  String(v || "")
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

export const tagLabel = (v) => `#${cleanTag(v)}`;

const rows = (res) => (Array.isArray(res) ? res : res?.items || []);

// Die feste Liste — nur was eine Bedeutung hat, zählt.
export async function loadHashtags() {
  const all = rows(await base44.entities.Hashtag.filter({ active: true }, { sort: "order", limit: 200 }));
  return all.filter((h) => h.name && (h.meaning || "").trim());
}

// Der Block, der in Prompts mitläuft: Wort für Wort mit Bedeutung.
export function hashtagBlock(list = []) {
  if (!list.length) return "";
  return [
    "UNSERE HASHTAGS — so meinen wir diese Worte, halte dich genau daran:",
    ...list.map((h) => `${tagLabel(h.name)} = ${h.meaning.trim()}`),
  ].join("\n");
}

export async function hashtagPromptBlock() {
  return hashtagBlock(await loadHashtags());
}

// Mehrere Hashtags in Klartext auflösen — für Suche, Anzeige und Prompts.
export function hashtagMeaning(names = [], list = []) {
  const index = new Map(list.map((h) => [cleanTag(h.name), h]));
  return names.map((n) => index.get(cleanTag(n))).filter(Boolean);
}

// Für eine Figur oder ein Stück Material: welche Worte sind gesetzt, was heißen sie.
export function hashtagBriefing(names = [], list = []) {
  const found = hashtagMeaning(names, list);
  if (!found.length) return "";
  return found.map((h) => `${tagLabel(h.name)} = ${h.meaning.trim()}`).join("\n");
}