import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Volume2, VolumeX } from "lucide-react";
import NarratorStatusCard from "@/components/story/NarratorStatusCard";

// Die beiden Erzählerinnen begrüßen den Gast — mit Bild, Stimme und Ansage.
export default function IntroGreeting({ text, voice = "honey", name }) {
  const [narrators, setNarrators] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    base44.entities.Narrator.filter({ active: { $ne: false } }, "order", 2)
      .then((res) => setNarrators(res.items || []))
      .catch(() => setNarrators([]));
    return () => audioRef.current?.pause();
  }, []);

  const line = (text || "")
    .replace(/\{narrator\}/g, narrators[0]?.name || "deine Erzählerin")
    .replace(/\{name\}/g, name || "du");

  const toggle = async () => {
    if (speaking) {
      audioRef.current?.pause();
      setSpeaking(false);
      return;
    }
    setBusy(true);
    try {
      const res = await base44.integrations.Core.GenerateSpeech({ text: line, voice });
      const audio = new Audio(res.url);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      await audio.play();
      setSpeaking(true);
    } catch (e) {
      setSpeaking(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Sie begrüßen dich</p>

      {narrators.length > 0 && (
        <div className="flex gap-3 mb-4 max-w-sm">
          {narrators.map((n, i) => (
            <NarratorStatusCard
              key={n.id || i}
              narrator={n}
              status={speaking ? (i === 0 ? "spricht" : "hört zu") : "bereit"}
            />
          ))}
        </div>
      )}

      <p className="text-[16px] font-semibold text-foreground leading-relaxed max-w-xl mb-4">{line}</p>

      <button
        onClick={toggle}
        disabled={busy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        {speaking ? "Stopp" : "Anhören"}
      </button>
    </div>
  );
}