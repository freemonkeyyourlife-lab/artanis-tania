import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const STORAGE_KEY = "pendingInvite";

// Remembers an invite token from the URL and claims it once the user is signed in.
export default function InviteClaim() {
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("invite");
    if (fromUrl) localStorage.setItem(STORAGE_KEY, fromUrl);

    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return;

    base44.functions
      .invoke("claimInvite", { token })
      .then((res) => {
        localStorage.removeItem(STORAGE_KEY);
        if (res.data?.already) return;
        toast({
          title: res.data?.status === "GOLD" ? "Du bist Gold Member" : "Status freigeschaltet",
          description: "Ab jetzt ist alles für dich frei — viel Spaß.",
        });
      })
      .catch((e) => {
        const status = e?.response?.status;
        if (status === 400 || status === 404) localStorage.removeItem(STORAGE_KEY);
      });
  }, [toast]);

  return null;
}