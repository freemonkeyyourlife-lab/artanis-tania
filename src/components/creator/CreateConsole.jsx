import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Wand2, X, LayoutGrid } from "lucide-react";
import AssistantWizard from "@/components/studio/assistant/AssistantWizard";
import { isQuiet, holdQuiet, subscribeQuiet } from "@/lib/onboarding";
import FloatingSlot from "@/components/floating/FloatingSlot";

// Wo du gerade bist — die Konsole sagt es dir, bevor du anfängst.
const PLACES = [
  ["/messages", "Chat"],
  ["/groups", "Gruppenchat"],
  ["/live", "Livestream"],
  ["/therapy", "Sprechstunde"],
  ["/erzaehler", "Erzähler-Studio"],
  ["/stimmen", "Stimmen-Studio"],
  ["/artanis", "Artanis"],
  ["/tania", "Tania"],
  ["/couple", "Das Paar"],
  ["/creator", "Figuren"],
  ["/stories", "Storys"],
  ["/baukasten", "Baukasten"],
  ["/dock", "Dockingstation"],
  ["/community", "Community"],
  ["/contests", "Wettbewerbe"],
  ["/videos", "Videos"],
  ["/photos", "Fotos"],
  ["/topics", "Themen"],
  ["/call", "Video-Call"],
  ["/interactive", "Erlebnisse"],
];

const placeFor = (path) => (PLACES.find(([p]) => path.startsWith(p)) || [])[1] || "App";

// Das Kreieren ist überall dabei: ein Knopf, derselbe Ablauf, Schritt für
// Schritt. Wo du ihn aufmachst, bestimmt nur, wovon er ausgeht — nicht, wie
// es geht. Alles, was du baust, landet danach im Dashboard.
export default function CreateConsole() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [quiet, setQuiet] = useState(() => isQuiet());

  useEffect(() => subscribeQuiet(setQuiet), []);

  // Solange die Konsole offen ist, hält sich die Begleiterin raus.
  useEffect(() => {
    holdQuiet("create", open);
    return () => holdQuiet("create", false);
  }, [open]);

  // Wer weitergeht, ist mit dem Kreieren fertig.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  if ((quiet && !open) || pathname.startsWith("/studio")) return null;

  const place = placeFor(pathname);

  return (
    <>
      {!open && (
        <FloatingSlot zone="bottom-left">
          <button
            onClick={() => setOpen(true)}
            className="pointer-events-auto inline-flex items-center gap-2 pl-3 pr-5 py-2.5 rounded-full glass-strong border-2 border-primary/40 text-[14px] font-bold text-foreground accent-glow"
          >
            <Wand2 className="w-4 h-4 text-primary" /> Kreieren
          </button>
        </FloatingSlot>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] overflow-y-auto glass-milky">
          <div className="mx-auto w-full max-w-5xl px-4 lg:px-8 py-6">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Kreieren</p>
                <h2 className="font-display text-2xl lg:text-3xl text-foreground text-gloss">Was soll entstehen?</h2>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/studio");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground"
                >
                  <LayoutGrid className="w-4 h-4" /> Alles ansehen
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Schließen"
                  className="w-10 h-10 rounded-full glass-btn flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            <AssistantWizard origin={place} />
          </div>
        </div>
      )}
    </>
  );
}