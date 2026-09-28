import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const REMIND_AGAIN_MS = 3 * 60 * 1000;

// Überall in der App: kurzer Tipp, wenn ein Gast auf dich wartet.
export default function WaitingChatAlert() {
  const { toast } = useToast();
  const seenRef = useRef({});

  useEffect(() => {
    let unsubscribe;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (me?.role !== "admin") return;
        unsubscribe = base44.entities.Conversation.subscribe((event) => {
          const conv = event.data;
          if (!conv || conv.conversationType !== "AI" || !conv.waitingSince) return;
          const last = seenRef.current[conv.id] || 0;
          if (Date.now() - last < REMIND_AGAIN_MS) return;
          seenRef.current[conv.id] = Date.now();
          toast({
            title: "💬 Jemand wartet im Chat",
            description: `${conv.userName || "Ein Gast"} will mit ${conv.creatorName || "einem Charakter"} chatten — im Leitstand übernehmen.`,
          });
        });
      } catch (e) { /* nicht angemeldet */ }
    })();
    return () => unsubscribe?.();
  }, [toast]);

  return null;
}