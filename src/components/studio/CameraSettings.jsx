import React, { useEffect, useState } from "react";
import { Camera, Cable, Check, Loader2, RotateCcw, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { readPreferredCamera, savePreferredCamera } from "@/lib/videoSource";

// Kamera-Einstellungen für Calls und Aufnahmen: hier wird festgelegt, welche
// Kamera beides benutzt — die eingebaute oder eine angeschlossene.
export default function CameraSettings() {
  const [devices, setDevices] = useState([]);
  const [active, setActive] = useState(() => readPreferredCamera());
  const [busy, setBusy] = useState(true);

  const load = async () => {
    setBusy(true);
    try {
      // Ohne erlaubten Zugriff tragen die Kameras keine Namen.
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      s.getTracks().forEach((t) => t.stop());
    } catch (e) {
      // Ohne Freigabe bleibt die Liste eben leer.
    }
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === "videoinput"));
    } catch (e) {
      setDevices([]);
    }
    setBusy(false);
  };

  useEffect(() => {
    load();
    if (!navigator.mediaDevices?.addEventListener) return;
    const refresh = () => load();
    navigator.mediaDevices.addEventListener("devicechange", refresh);
    return () => navigator.mediaDevices.removeEventListener("devicechange", refresh);
  }, []);

  const pick = (id) => {
    savePreferredCamera(id);
    setActive(id);
  };

  const builtIn = devices[0]?.id || "";

  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="font-display text-2xl text-foreground flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" /> Kamera & Aufnahme
          </p>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-2xl mt-1">
            Diese Kamera benutzen die Video-Calls <span className="text-foreground">und</span> die Aufzeichnung —
            auch die Therapie-Sitzungen. Die Wahl bleibt gespeichert und gilt ab dem nächsten Start.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
        >
          <RotateCcw className="w-4 h-4" /> Neu suchen
        </button>
      </div>

      <div className="rounded-2xl border-2 border-border bg-card p-4 mb-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Kamera</p>
        {busy && devices.length === 0 ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : devices.length === 0 ? (
          <p className="text-[14px] font-semibold text-muted-foreground py-4">
            Keine Kamera gemeldet. Erlaub dem Browser den Zugriff und drück „Neu suchen".
          </p>
        ) : (
          <div className="space-y-2">
            {devices.map((d, i) => {
              const chosen = active === d.id || (!active && i === 0);
              return (
                <button
                  key={d.id}
                  onClick={() => pick(d.id)}
                  className={cn(
                    "w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border-2 transition-colors",
                    chosen ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  )}
                >
                  <Video className={cn("w-5 h-5 flex-shrink-0", chosen ? "text-primary" : "text-muted-foreground")} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-bold text-foreground truncate">
                      {d.label || `Kamera ${i + 1}`}
                    </span>
                    <span className="block text-[12px] font-semibold text-muted-foreground">
                      {i === 0 ? "eingebaut oder am Gerät" : "angeschlossen"}
                    </span>
                  </span>
                  {chosen && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {active && (
          <button
            onClick={() => pick("")}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Zurück zur eingebauten Kamera
          </button>
        )}
        {!active && builtIn && (
          <p className="text-[12px] font-semibold text-muted-foreground mt-3">
            Aktuell: die eingebaute Kamera des Geräts.
          </p>
        )}
      </div>

      <div className="rounded-2xl border-2 border-border bg-card p-4">
        <p className="font-display text-lg text-foreground flex items-center gap-2">
          <Cable className="w-5 h-5 text-primary" /> Externe Kamera anschließen
        </p>

        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[14px] font-bold text-foreground">Über Kabel — das läuft</p>
            <p className="text-[13px] font-semibold text-muted-foreground leading-relaxed">
              Eine USB-Kamera oder ein HDMI-Capture-Stick (z. B. Elgato, Cam Link) wird ganz normal angesteckt.
              Danach steht sie oben in der Liste — einmal auswählen, fertig. Bei einer Kamera mit eigenem Akku
              zusätzlich das USB-Kabel anstecken, sonst schaltet sie sich ab.
            </p>
          </div>

          <div>
            <p className="text-[14px] font-bold text-foreground">Über WLAN — auch das läuft</p>
            <p className="text-[13px] font-semibold text-muted-foreground leading-relaxed">
              Kabellose Kameras, die sich als WLAN-Kamera anmelden (Handy, Action-Cam, Überwachungskamera),
              melden sich am Rechner als ganz normale Kamera an. Sie erscheinen dann ebenfalls oben in der Liste.
            </p>
          </div>

          <div className="rounded-xl border-2 border-border bg-elevated p-3">
            <p className="text-[14px] font-bold text-foreground">Bluetooth — geht nicht</p>
            <p className="text-[13px] font-semibold text-muted-foreground leading-relaxed mt-1">
              Ein Browser kann Video nicht über Bluetooth übertragen. Bluetooth ist für Ton und kleine Daten
              gebaut — für ein Videobild reicht die Übertragung nicht. Deshalb gibt es hier keine
              Bluetooth-Kamera: über Bluetooth läuft nur Ton (Kopfhörer, Headset), das Bild kommt über
              Kabel oder WLAN. Ein Bluetooth-Headset wird als Mikrofon trotzdem automatisch erkannt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}