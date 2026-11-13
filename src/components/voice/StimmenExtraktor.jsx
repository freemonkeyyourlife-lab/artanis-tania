import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, FileAudio, FileVideo, Check, AlertTriangle, Sparkles, Play, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Aus einem Video oder einer Audio (auch WhatsApp-Sprachnachricht) im Browser
// die Tonspur herausziehen, messen ob sie für eine eigene Stimme reicht und
// daraus eine ElevenLabs-Stimme erzeugen — ohne externes Schneiden.

// 16-Bit-PCM-WAV, mono heruntergemischt — das nimmt ElevenLabs am liebsten.
function encodeWav(audioBuffer) {
  const sr = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const chs = audioBuffer.numberOfChannels;
  const mono = new Float32Array(length);
  for (let c = 0; c < chs; c++) {
    const data = audioBuffer.getChannelData(c);
    for (let i = 0; i < length; i++) mono[i] += data[i] / chs;
  }
  const bytesPerSample = 2;
  const dataSize = length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let p = 0;
  const writeStr = (s) => { for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i)); };
  const writeU16 = (v) => { view.setUint16(p, v, true); p += 2; };
  const writeU32 = (v) => { view.setUint32(p, v, true); p += 4; };
  writeStr("RIFF"); writeU32(36 + dataSize); writeStr("WAVE");
  writeStr("fmt "); writeU32(16); writeU16(1); writeU16(1);
  writeU32(sr); writeU32(sr * bytesPerSample); writeU16(bytesPerSample); writeU16(16);
  writeStr("data"); writeU32(dataSize);
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    p += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

// Reicht die Probe für eine eigene Stimme? Dauer ist das Hauptkriterium,
// Lautstärke (RMS) zeigt, ob überhaupt Sprache drauf ist.
function assess(audioBuffer) {
  const duration = audioBuffer.duration;
  const ch0 = audioBuffer.getChannelData(0);
  let sum = 0;
  for (let i = 0; i < ch0.length; i++) sum += ch0[i] * ch0[i];
  const rms = Math.sqrt(sum / ch0.length);
  let verdict, label, color;
  if (duration < 10) {
    verdict = "zu_kurz"; color = "red";
    label = "Zu kurz — mindestens 10 Sekunden klare Sprache.";
  } else if (duration < 30) {
    verdict = "knapp"; color = "yellow";
    label = "Knapp — klonbar, aber die Stimme wird dünner und weniger stabil.";
  } else if (duration < 60) {
    verdict = "gut"; color = "green";
    label = "Gut — reicht für eine saubere, eigene Stimme.";
  } else {
    verdict = "sehr_gut"; color = "green";
    label = "Sehr gut — ideal für eine eigene Stimme.";
  }
  let note = "";
  if (rms < 0.01) note = "Sehr leise oder nur Rauschen — lauter machen oder näher ans Mikro.";
  return { duration, rms, verdict, label, color, note };
}

const fmtDur = (s) => {
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m ? `${m}:${String(r).padStart(2, "0")}` : `${r} Sek`;
};

const inputCls = "flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-[15px] text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

export default function StimmenExtraktor() {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [decoding, setDecoding] = useState(false);
  const [readError, setReadError] = useState("");
  const [audioBuf, setAudioBuf] = useState(null);
  const [wavUrl, setWavUrl] = useState(null);
  const [result, setResult] = useState(null); // { assessment }
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [done, setDone] = useState(null); // { voiceId }
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    if (wavUrl) URL.revokeObjectURL(wavUrl);
    setFile(null); setAudioBuf(null); setWavUrl(null); setResult(null);
    setReadError(""); setDone(null);
  };

  const handleFile = async (f) => {
    if (!f) return;
    reset();
    setFile(f);
    setDecoding(true);
    setReadError("");
    try {
      const arrayBuf = await f.arrayBuffer();
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
      ctx.close?.();
      const wav = encodeWav(decoded);
      const url = URL.createObjectURL(wav);
      setAudioBuf(decoded);
      setWavUrl(url);
      setResult({ assessment: assess(decoded) });
      if (!name) setName((f.name || "Extrahierte Stimme").replace(/\.[^.]+$/, "").slice(0, 60));
    } catch (e) {
      console.error(e);
      setReadError("Tonspur nicht lesbar — bitte als Audio exportieren (mp3, m4a oder wav).");
    } finally {
      setDecoding(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer?.files?.[0]);
  };

  const createVoice = async () => {
    if (!audioBuf || !name.trim()) return;
    const a = result?.assessment;
    if (a && a.verdict === "zu_kurz") {
      toast({ variant: "destructive", title: "Zu kurz", description: a.label });
      return;
    }
    setCloning(true);
    setDone(null);
    try {
      // Tonspur als WAV ablegen (stored privately), dann an ElevenLabs schicken.
      setUploading(true);
      const wav = encodeWav(audioBuf);
      const wavFile = new File([wav], "extrahiert.wav", { type: "audio/wav" });
      const up = await base44.integrations.Core.UploadPrivateFile({ file: wavFile });
      setUploading(false);
      if (!up?.file_uri) throw new Error("Ablegen fehlgeschlagen.");

      const res = await base44.functions.invoke("elevenLabsClone", {
        fileUri: up.file_uri,
        name: name.trim(),
      });
      if (res.data?.error) throw new Error(res.data.error);
      const voiceId = res.data.voiceId;
      if (!voiceId) throw new Error("Keine Stimme zurückgekommen.");

      // Als benannte Stimme sichern, damit sie zuweisbar ist.
      await base44.entities.Voice.create({
        name: name.trim(),
        provider: "ELEVENLABS",
        externalVoiceId: voiceId,
        source: "HOCHGELADEN",
        sampleFile: up.file_uri,
        active: true,
        public: false,
      });
      setDone({ voiceId });
      toast({ title: "Stimme erzeugt", description: `„${name.trim()}" kann jetzt jeden Text sprechen.` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Hat nicht geklappt", description: e.message });
    } finally {
      setUploading(false);
      setCloning(false);
    }
  };

  const a = result?.assessment;
  const colorMap = {
    red: "bg-red-500/15 text-red-400 border-red-500/40",
    yellow: "bg-amber-500/15 text-amber-400 border-amber-500/40",
    green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="font-display text-xl text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Stimme aus Video oder Audio ziehen
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Ein Video, eine Audio-Datei oder eine WhatsApp-Sprachnachricht hierher ziehen.
          Die Tonspur wird gelesen, gemessen ob sie für eine eigene Stimme reicht und daraus
          eine Stimme gemacht, die jeden Text sprechen kann.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "rounded-2xl border-2 border-dashed px-5 py-6 text-center cursor-pointer transition-colors",
          dragOver ? "border-primary bg-primary/10" : "border-border bg-elevated hover:border-primary/40"
        )}
      >
        <Upload className={cn("w-5 h-5 mx-auto", dragOver ? "text-primary" : "text-muted-foreground")} />
        <p className="text-sm text-foreground mt-2">
          {decoding ? "Liest Tonspur …" : dragOver ? "Loslassen — dann wird sie gelesen" : "Video oder Audio hierher ziehen"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          oder anklicken · mp4, mov, webm, mp3, wav, m4a, opus (WhatsApp) · am besten 30 Sekunden oder länger
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,video/*,.opus,.ogg,.m4a,.mp4,.webm,.mov"
          onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
          className="hidden"
        />
      </div>

      {readError && (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {readError}
        </div>
      )}

      {file && !readError && (
        <div className="rounded-2xl border border-border bg-elevated p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {file.type?.startsWith("video") ? <FileVideo className="w-4 h-4 text-primary" /> : <FileAudio className="w-4 h-4 text-primary" />}
            <span className="text-sm text-foreground truncate max-w-[60vw]">{file.name}</span>
            <button onClick={reset} className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
              <Trash2 className="w-3.5 h-3.5" /> Weg
            </button>
          </div>

          {decoding && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Tonspur wird gelesen …
            </div>
          )}

          {a && (
            <div>
              <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold", colorMap[a.color])}>
                {a.color === "green" ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {a.label}
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                <span>Dauer: <strong className="text-foreground">{fmtDur(a.duration)}</strong></span>
                <span>Lautstärke (RMS): <strong className="text-foreground">{a.rms.toFixed(3)}</strong></span>
                {wavUrl && (
                  <button onClick={() => new Audio(wavUrl).play()} className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Play className="w-3 h-3" /> Tonspur anhören
                  </button>
                )}
              </div>
              {a.note && (
                <p className="text-[11px] text-amber-400 mt-1.5">{a.note}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name für diese Stimme"
              className={inputCls}
            />
            <button
              onClick={createVoice}
              disabled={!a || a.verdict === "zu_kurz" || !name.trim() || cloning || uploading}
              className="px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex-shrink-0 inline-flex items-center gap-1.5"
            >
              {cloning || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {uploading ? "Ablegen …" : cloning ? "Erzeugt …" : "Stimme erzeugen"}
            </button>
          </div>

          {done && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
              <Check className="w-4 h-4" /> Stimme erzeugt — Voice-ID: <code className="text-foreground">{done.voiceId}</code>
              <span className="text-muted-foreground">· steht jetzt in der Stimmen-Liste zur Auswahl.</span>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Nur Stimmen verwenden, für die du die Erlaubnis hast. Die Tonspur wird (stored privately) abgelegt.
          </p>
        </div>
      )}
    </div>
  );
}