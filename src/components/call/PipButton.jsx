import React, { useEffect, useState } from "react";
import { PictureInPicture2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Echtes Bild-in-Bild des Browsers: dein Bild schwebt über allem — auch über
// anderen Programmen, während du zeigst, was du zeigen willst.
export default function PipButton({ getVideo, className, label }) {
  const [on, setOn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!on) return;
    const el = getVideo?.();
    if (!el) return;
    const leave = () => setOn(false);
    el.addEventListener("leavepictureinpicture", leave);
    return () => el.removeEventListener("leavepictureinpicture", leave);
  }, [on, getVideo]);

  const toggle = async () => {
    setError("");
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setOn(false);
        return;
      }
      const el = getVideo?.();
      if (!el || !el.srcObject) throw new Error("kein Bild");
      await el.requestPictureInPicture();
      setOn(true);
    } catch (e) {
      setError("Bild-in-Bild startet, sobald dein Bild läuft.");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={error || (on ? "Bild-in-Bild schließen" : label || "Als Bild-in-Bild schweben lassen")}
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
        on ? "bg-primary text-primary-foreground" : "bg-black/55 text-white hover:bg-black/75",
        className,
      )}
    >
      <PictureInPicture2 className="w-4 h-4" />
    </button>
  );
}