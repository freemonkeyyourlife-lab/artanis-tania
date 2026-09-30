import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const REMIND_AGAIN_MS = 3 * 60 * 1000;

// Überall in der App: kurzer Tipp, wenn ein Gast auf dich wartet. Ein Druck auf
// die Meldung führt direkt in den Leitstand — ohne Umweg über die Navigation.
export default function WaitingChatAlert() {
  const { toast } = useToast();
  const navigate = useNavigate();
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
          const handle = toast({
            title: "💬 Jemand wartet im Chat",
            description: `${conv.userName || "Ein Gast"} will mit ${conv.creatorName || "einem Charakter"} chatten. Antippen und im Leitstand übernehmen.`,
            className: "cursor-pointer",
            onClick: () => {
              navigate("/leitstand");
              handle.dismiss();
            },
          });
        });
      } catch (e) { /* nicht angemeldet */ }
    })();
    return () => unsubscribe?.();
  }, [toast, navigate]);

  return null;
}