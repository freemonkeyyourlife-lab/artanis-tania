import { base44 } from "@/api/base44Client";

// Es gibt genau einen Live-Raum — den des Gastgebers. Der Raum-Link steckt im Token.
export async function setLiveState(token, hostName, isLive) {
  const existing = await base44.entities.LiveRoom.filter({ token });
  const data = {
    token,
    hostName: hostName || "Gastgeber",
    isLive,
    startedAt: isLive ? new Date().toISOString() : null,
  };
  if (existing[0]) return base44.entities.LiveRoom.update(existing[0].id, data);
  return base44.entities.LiveRoom.create(data);
}

export async function fetchLiveRoom() {
  const rooms = await base44.entities.LiveRoom.list("-updated_date", 1);
  return rooms[0] || null;
}