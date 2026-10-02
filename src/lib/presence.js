import { base44 } from "@/api/base44Client";

// So lange zählt ein Lebenszeichen als "ich bin da".
export const PRESENCE_MAX_AGE_MS = 90 * 1000;
// So oft meldet sich dein offenes Fenster.
export const HEARTBEAT_MS = 30 * 1000;

const latestRow = async () => {
  const res = await base44.entities.SiteLayout.filter({}, "-updated_date", 1);
  return (Array.isArray(res) ? res : res?.items || [])[0] || null;
};

// Bist du da? Nur dann wartet ein Gast auf dich — sonst antwortet die KI sofort.
export const ownerIsPresent = async () => {
  try {
    const row = await latestRow();
    if (!row?.ownerLastSeenAt) return false;
    return Date.now() - new Date(row.ownerLastSeenAt).getTime() < PRESENCE_MAX_AGE_MS;
  } catch (e) {
    return false;
  }
};

// Dein Lebenszeichen — schreibt nur der Besitzer selbst.
export const ownerHeartbeat = async () => {
  try {
    const stamp = new Date().toISOString();
    const row = await latestRow();
    if (row) await base44.entities.SiteLayout.update(row.id, { ownerLastSeenAt: stamp });
    else await base44.entities.SiteLayout.create({ ownerLastSeenAt: stamp });
  } catch (e) { /* kurz nicht erreichbar — nächstes Lebenszeichen später */ }
};