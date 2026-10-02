import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, Plus, Square, Sparkles, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { speakAsVoice } from "@/lib/voiceChat";

const TEST_LINE = "Ich bin da. Wir gehen zusammen durch diese Geschichte.";
// Mehrsprachig und die beste Qualität — damit klingt eine geholte Stimme auch deutsch.
const QUALITY_MODEL = "eleven_multilingual_v2";

// Ein fertiges Stimmprofil aus der Stimmenbank — oder der Grund-Stimm-Typ.
// Fehlt noch eins, holst du eine Stimme direkt aus ElevenLabs und speicherst sie hier.
export default function VoiceProfilePicker({ value, baseVoice, onChange }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [showCloud, setShowCloud] = useState(false);
  const [cloud, setCloud] = useState([]);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudError, setCloudError] = useState("");
  const [saving, setSaving] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.entities.Voice.list("-created_date");
        const items = Array.isArray(res) ? res : res?.items || [];
        if (alive) setProfiles(items.filter((v) => v.active !== false));
      } catch (e) {
        /* ohne Stimmenbank bleibt der Grund-Stimm-Typ */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      audioRef.current?.pause();
    };
  }, []);

  const chosen = profiles.find((v) => v.id === value);

  const hear = async () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    try {
      const url = await speakAsVoice(chosen || { baseVoice: baseVoice || "honey" }, TEST_LINE);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch (e) {
      setPlaying(false);
    }
  };

  const loadCloud = async () => {
    setCloudBusy(true);
    setCloudError("");
    try {
      const res = await base44.functions.invoke("elevenLabs", { action: "voices" });
      if (res.data?.error) throw new Error(res.data.error);
      setCloud(res.data.voices || []);
    } catch (e) {
      setCloudError(e.message);
      setCloud([]);
    } finally {
      setCloudBusy(false);
    }
  };

  const toggleCloud = () => {
    const next = !showCloud;
    setShowCloud(next);
    if (next && cloud.length === 0) loadCloud();
  };

  // Aus einer ElevenLabs-Stimme ein Stimmprofil machen — gespeichert, sofort gewählt.
  const take = async (v) => {
    setSaving(v.id);
    try {
      const created = await base44.entities.Voice.create({
        name: v.name,
        provider: "ELEVENLABS",
        externalVoiceId: v.id,
        baseVoice: baseVoice || "honey",
        modelId: QUALITY_MODEL,
        source: "HOCHGELADEN",
        originNote: "Aus ElevenLabs",
        description: v.description || "",
        tags: v.labels || [],
        active: true,
      });
      setProfiles((prev) => [created, ...prev]);
      onChange?.(created.id);
    } catch (e) {
      setCloudError(e.message);
    } finally {
      setSaving("");
    }
  };

  const have = (id) => profiles.some((p) => p.externalVoiceId === id);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value || "")}
          disabled={loading}
          className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-background border border-border text-[14px] text-foreground focus:outline-none focus:border-primary/50 disabled:opacity-60"
        >
          <option value="">Grund-Stimm-Typ (oben gewählt)</option>
          {profiles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
              {v.provider === "ELEVENLABS" ? " · ElevenLabs" : v.baseVoice ? ` · ${v.baseVoice}` : ""}
              {v.language ? ` · ${v.language}` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={hear}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full glass-btn text-[12px] font-bold text-foreground flex-shrink-0"
          )}
          title="Anhören"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : playing ? (
            <Square className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
          {playing ? "Stopp" : "Hören"}
        </button>
      </div>

      <button
        type="button"
        onClick={toggleCloud}
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary hover:underline"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {showCloud ? "ElevenLabs zuklappen" : "Stimme aus ElevenLabs holen"}
      </button>

      {showCloud && (
        <div className="rounded-xl border border-border bg-background p-3">
          {cloudBusy ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : cloudError ? (
            <div>
              <p className="text-[12px] font-semibold text-foreground">ElevenLabs gibt die Stimmen nicht heraus.</p>
              <p className="text-[11px] text-muted-foreground mt-1 break-words">{cloudError}</p>
              <button type="button" onClick={loadCloud} className="mt-2 text-[12px] font-bold text-primary hover:underline">
                Neu laden
              </button>
            </div>
          ) : cloud.length === 0 ? (
            <p className="text-[12px] font-semibold text-muted-foreground py-2 text-center">
              Keine Stimmen gemeldet. Leg bei ElevenLabs eine an, dann hier neu laden.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {cloud.map((v) => {
                const already = have(v.id);
                return (
                  <div key={v.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-elevated border border-border">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-foreground truncate">{v.name}</p>
                      <p className="text-[11px] font-semibold text-muted-foreground truncate">
                        {v.category || "Stimme"}{v.labels?.length ? ` · ${v.labels.join(", ")}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => take(v)}
                      disabled={already || saving === v.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors",
                        already ? "bg-emerald-600/20 text-emerald-400" : "glass-btn glass-btn-accent text-gloss disabled:opacity-50"
                      )}
                    >
                      {saving === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : already ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {saving === v.id ? "Speichert …" : already ? "Drin" : "Speichern"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}