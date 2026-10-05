import React, { useEffect, useState } from "react";
import { Users, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { base44 } from "@/api/base44Client";
import { listVoices } from "@/lib/chatSpeak";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";

// Die Besetzung: mehrere Figuren gleichzeitig in dieser Szene — jede mit eigener
// Stimme. Ein Tipp nimmt sie auf oder setzt sie wieder ab.
export default function ChatCastPicker({ cast = [], onChange, accent }) {
  const [figures, setFigures] = useState([]);
  const [pool, setPool] = useState([]);
  const [voices, setVoices] = useState(listVoices());

  useEffect(() => {
    Promise.all([
      base44.entities.Character.filter({}, "name", 200).catch(() => []),
      base44.entities.Narrator.filter({}, "order", 200).catch(() => []),
    ]).then(([chars, narrs]) => {
      setFigures([
        ...(chars || []).map((c) => ({ id: `char:${c.id}`, name: c.name, avatar: c.avatar })),
        ...(narrs || []).map((n) => ({
          id: `narr:${n.id}`,
          name: n.name,
          avatar: n.avatar,
          voiceModelId: n.voiceProfileId || "",
        })),
      ]);
    });

    base44.entities.VoiceModel.filter({}, "order", 100)
      .then((list) => setPool((list || []).filter((v) => v.enabled !== false)))
      .catch(() => setPool([]));

    const read = () => setVoices(listVoices());
    read();
    window.speechSynthesis?.addEventListener("voiceschanged", read);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", read);
  }, []);

  const toggle = (f) => {
    if (cast.some((c) => c.id === f.id)) {
      onChange(cast.filter((c) => c.id !== f.id));
      return;
    }
    onChange([
      ...cast,
      { id: f.id, name: f.name, avatar: f.avatar, voiceModelId: f.voiceModelId || "", voiceName: "" },
    ]);
  };

  const setVoice = (id, value) => {
    onChange(
      cast.map((c) => {
        if (c.id !== id) return c;
        if (value.startsWith("pool:")) return { ...c, voiceModelId: value.slice(5), voiceName: "" };
        if (value.startsWith("device:")) return { ...c, voiceName: value.slice(7), voiceModelId: "" };
        return { ...c, voiceModelId: "", voiceName: "" };
      })
    );
  };

  const valueOf = (c) =>
    c.voiceModelId ? `pool:${c.voiceModelId}` : c.voiceName ? `device:${c.voiceName}` : "";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          title="Mehrere Figuren in dieser Szene — jede mit eigener Stimme"
          className="glass-btn flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold"
          style={cast.length ? { color: accent || undefined } : undefined}
        >
          <Users className="h-4 w-4" />
          Rollen
          {cast.length > 0 && <span className="text-[10px] font-bold">{cast.length}</span>}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[24rem] p-0">
        <div className="border-b border-border p-3">
          <p className="text-sm font-bold text-foreground">Wer spielt mit</p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Figuren antippen, um sie in die Szene zu holen. Sie reden miteinander, jede mit eigener
            Stimme. Ohne Besetzung antwortet eine einzelne Stimme.
          </p>
        </div>

        <div className="max-h-[60vh] space-y-1.5 overflow-y-auto p-2">
          {!figures.length && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Noch keine Figuren angelegt — sie entstehen im Studio.
            </p>
          )}
          {figures.map((f) => {
            const member = cast.find((c) => c.id === f.id);
            return (
              <div
                key={f.id}
                className={cn(
                  "rounded-xl p-2",
                  member ? "bg-elevated/70" : "bg-transparent"
                )}
              >
                <div className="flex items-center gap-2.5">
                  {f.avatar ? (
                    <Image
                      src={f.avatar}
                      fittingType="fit"
                      className="h-9 w-9 flex-shrink-0 rounded-full bg-elevated"
                    />
                  ) : (
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-elevated font-display text-xs text-primary">
                      {(f.name || "?").charAt(0)}
                    </div>
                  )}
                  <button
                    onClick={() => toggle(f)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className={cn(
                        "truncate text-xs font-bold",
                        member ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {f.name}
                    </span>
                    {member && <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: accent }} />}
                  </button>
                  <button
                    onClick={() => toggle(f)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                      member
                        ? "border-border text-muted-foreground"
                        : "border-primary/40 text-primary"
                    )}
                  >
                    {member ? "absetzen" : "besetzen"}
                  </button>
                </div>

                {member && (
                  <select
                    value={valueOf(member)}
                    onChange={(e) => setVoice(f.id, e.target.value)}
                    className="mt-2 h-8 w-full rounded-lg border border-border bg-card px-2 text-[11px] text-foreground"
                  >
                    <option value="">Standard-Stimme</option>
                    {pool.length > 0 && (
                      <optgroup label="Stimmen aus dem Pool">
                        {pool.map((v) => (
                          <option key={v.id} value={`pool:${v.modelId}`}>
                            {v.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Stimmen des Geräts">
                      {voices.map((v) => (
                        <option key={v.name} value={`device:${v.name}`}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}