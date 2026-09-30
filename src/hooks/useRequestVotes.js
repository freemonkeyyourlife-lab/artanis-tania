import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Stimmen für Community-Wünsche: Jede Person zählt genau einmal. Ein zweiter
// Druck nimmt die eigene Stimme wieder zurück.
export function useRequestVotes() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let alive = true;
    base44.auth.me()
      .then((me) => { if (alive) setUserId(me?.id || null); })
      .catch(() => { /* nicht angemeldet — dann wird nicht abgestimmt */ });
    return () => { alive = false; };
  }, []);

  const vote = useCallback(async (request) => {
    if (!userId) return null;
    const votedBy = request.votedBy || [];
    const mine = votedBy.includes(userId);
    return base44.entities.CommunityRequest.update(request.id, {
      votedBy: mine ? votedBy.filter((id) => id !== userId) : [...votedBy, userId],
      votes: Math.max(0, (request.votes || 0) + (mine ? -1 : 1)),
    });
  }, [userId]);

  return { userId, vote };
}