// So lange zählt ein Lebenszeichen als "der Besitzer ist da".
export const PRESENCE_MAX_AGE_MS = 90 * 1000;

// Bist du da? Nur dann bekommst du einen Vorsprung, bevor die KI übernimmt.
export async function ownerIsPresent(base44: any, maxAgeMs: number = PRESENCE_MAX_AGE_MS) {
  try {
    const res = await base44.asServiceRole.entities.SiteLayout.filter({}, '-updated_date', 1);
    const rows = Array.isArray(res) ? res : (res && res.items) || [];
    const seen = rows[0] && rows[0].ownerLastSeenAt;
    if (!seen) return false;
    return Date.now() - new Date(seen).getTime() < maxAgeMs;
  } catch (e) {
    return false;
  }
}