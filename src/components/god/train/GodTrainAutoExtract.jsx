import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import JSZip from "jszip";
import {
  Loader2, Upload, Wand2, User, Film, Mic, Image as ImgIcon, Check, Cpu,
  Package, Sparkles, AlertCircle, ArrowRight, Server, Link2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TARGET = 12;

const sign = async (uri) => {
  if (!uri) return null;
  if (String(uri).startsWith("http")) return uri;
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 3600 });
    return r.signed_url;
  } catch { return null; }
};

const kindForFile = (f) => {
  const t = (f.type || "").toLowerCase();
  const n = (f.name || "").toLowerCase();
  if (t.startsWith("image/gif") || n.endsWith(".gif")) return "GIF";
  if (t.startsWith("image")) return "IMAGE";
  if (t.startsWith("video")) return "VIDEO";
  if (t.startsWith("audio")) return "AUDIO";
  return "IMAGE";
};

// Holt aus einem Video gleichmäßig verteilte Frames als JPEG-Blobs — 512×512,
// gecropt. Läuft komplett im Browser, ohne externen Dienst.
async function extractVideoFrames(file, count, onFrame) {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true; video.playsInline = true; video.preload = "auto";
    video.src = url;
    await new Promise((res, rej) => { video.onloadedmetadata = res; video.onerror = rej; });
    const dur = video.duration || 1;
    const frames = [];
    for (let i = 0; i < count; i++) {
      const t = (dur * (i + 0.5)) / count;
      await new Promise((res) => { video.currentTime = Math.min(t, dur - 0.05); video.onseeked = res; });
      const vw = video.videoWidth || 512, vh = video.videoHeight || 512;
      const scale = Math.max(512 / vw, 512 / vh);
      const dw = vw * scale, dh = vh * scale;
      const canvas = document.createElement("canvas");
      canvas.width = 512; canvas.height = 512;
      canvas.getContext("2d").drawImage(video, (512 - dw) / 2, (512 - dh) / 2, dw, dh);
      const blob = await new Promise((b) => canvas.toBlob(b, "image/jpeg", 0.92));
      if (blob) {
        const name = `${file.name.replace(/\.[^.]+$/, "")}_f${String(i + 1).padStart(2, "0")}.jpg`;
        frames.push({ blob, name });
        onFrame?.(i + 1, count);
      }
    }
    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Der idiotensichere Extraktor: alles rein → fertiges Set raus → nur noch an
// die GPU anbinden. Bilder, Videos (Frames), Sprache (Transkript) — aus jeder
// Quelle entsteht automatisch ein trainierbares Set, bei Bedarf selbst aufgefüllt,
// und der Charakter ist hier gespeichert.
export default function GodTrainAutoExtract() {
  const [name, setName] = useState("");
  const [files, setFiles] = useState([]);
  const [stage, setStage] = useState("eingabe"); // eingabe | arbeit | fertig
  const [log, setLog] = useState([]);
  const [progress, setProgress] = useState("");
  const [built, setBuilt] = useState(null); // { setId, personName, images, generated, status, characterId? }
  const [urls, setUrls] = useState({});
  const [charBusy, setCharBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const fileRef = useRef(null);

  const note = (m) => setLog((l) => [...l.slice(-24), m]);

  const onPick = (list) => {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    setFiles((f) => [...f, ...arr]);
    if (!name.trim() && arr[0]?.name) {
      const base = arr[0].name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
      if (base) setName(base.slice(0, 40));
    }
  };

  const removeFile = (i) => setFiles((f) => f.filter((_, idx) => idx !== i));

  const counts = useMemo(() => {
    const c = { IMAGE: 0, VIDEO: 0, AUDIO: 0 };
    files.forEach((f) => { c[kindForFile(f)] += 1; });
    return c;
  }, [files]);

  // Der ganze Flow: extrahieren → set bauen → ggf auffüllen → fertig.
  const run = async () => {
    const person = name.trim() || "Neuer Charakter";
    if (!files.length) return;
    setStage("arbeit");
    setLog([]);
    setProgress("Start …");
    note(`Quelle: ${counts.IMAGE} Bilder, ${counts.VIDEO} Videos, ${counts.AUDIO} Audio.`);

    const imageUris = [];
    let avatarUri = "";

    // 1. Bilder direkt übernehmen.
    for (const f of files.filter((x) => kindForFile(x) === "IMAGE" || kindForFile(x) === "GIF")) {
      try {
        setProgress(`Bild: ${f.name}`);
        const up = await base44.integrations.Core.UploadPrivateFile({ file: f });
        imageUris.push(up.file_uri);
        if (!avatarUri) avatarUri = up.file_uri;
        note(`Bild übernommen (${imageUris.length}).`);
      } catch { note(`Bild fehlgeschlagen: ${f.name}`); }
    }

    // 2. Videos → Frames.
    for (const f of files.filter((x) => kindForFile(x) === "VIDEO")) {
      try {
        setProgress(`Video zerlegen: ${f.name}`);
        const need = Math.max(4, TARGET - imageUris.length);
        const frames = await extractVideoFrames(f, need, (i, n) => setProgress(`Frame ${i}/${n} aus ${f.name}`));
        for (const fr of frames) {
          const up = await base44.integrations.Core.UploadPrivateFile({ file: new File([fr.blob], fr.name, { type: "image/jpeg" }) });
          imageUris.push(up.file_uri);
          if (!avatarUri) avatarUri = up.file_uri;
        }
        note(`Video → ${frames.length} Frames.`);
      } catch { note(`Video fehlgeschlagen: ${f.name}`); }
    }

    // 3. Audio → transkribieren + als Stimmprobe ablegen.
    for (const f of files.filter((x) => kindForFile(x) === "AUDIO")) {
      try {
        setProgress(`Audio: ${f.name}`);
        const up = await base44.integrations.Core.UploadPrivateFile({ file: f });
        const audioUrl = await sign(up.file_uri);
        let text = "";
        if (audioUrl) {
          const r = await base44.integrations.Core.TranscribeAudio({ audio_url: audioUrl });
          text = typeof r === "string" ? r : r?.text || "";
        }
        await base44.entities.Quelle.create({
          name: `Stimme · ${person}`,
          kind: "STIMME",
          fileUri: up.file_uri,
          source: "UPLOAD",
          characterName: person,
          tags: ["stimme", "vorbild"],
          note: text ? `Transkript: ${text.slice(0, 400)}` : "",
        });
        if (text) {
          await base44.entities.Quelle.create({
            name: `Transkript · ${person}`, kind: "TEXT", text, source: "EXTRAKT",
            characterName: person, tags: ["transkript"],
          });
        }
        note(`Audio als Stimmprobe gespeichert${text ? " + transkribiert" : ""}.`);
      } catch { note(`Audio fehlgeschlagen: ${f.name}`); }
    }

    // 4. Set anlegen.
    setProgress("Set wird angelegt …");
    let set = await base44.entities.TrainingSet.create({
      personName: person,
      name: `Auto-Set ${person}`,
      images: imageUris,
      generatedImages: [],
      sourceMedia: [],
      avatar: avatarUri,
      targetCount: TARGET,
      status: "SAMMLUNG",
    });
    note(`Set angelegt: ${imageUris.length}/${TARGET} Bilder.`);

    // 5. Bei Bedarf selbst auffüllen — aus dem ersten Bild neue Ansichten erzeugen.
    let generated = [];
    if (imageUris.length < TARGET) {
      const refUri = imageUris[0];
      const refUrl = refUri ? await sign(refUri) : null;
      const miss = TARGET - imageUris.length;
      note(`Zu wenig Bilder — erzeuge ${miss} weitere …`);
      for (let i = 0; i < miss; i++) {
        try {
          setProgress(`Füllbild ${i + 1}/${miss} erzeugen`);
          const res = await base44.integrations.Core.GenerateImage({
            prompt:
              `Porträt einer Person namens ${person}. Neue Pose, gleiche Person, fotorealistisch, ` +
              "neutraler Hintergrund, gleiches Licht. Erwachsene Person, keine realen Personen.",
            existing_image_urls: refUrl ? [refUrl] : [],
          });
          if (res?.url) generated.push(res.url);
        } catch { note(`Füllbild ${i + 1} fehlgeschlagen.`); }
      }
      if (generated.length) {
        await base44.entities.TrainingSet.update(set.id, { generatedImages: generated });
        note(`Set aufgefüllt: +${generated.length} erzeugt.`);
      }
    }

    const total = imageUris.length + generated.length;
    const status = total >= TARGET ? "BEREIT" : "SAMMLUNG";
    if (status === "BEREIT") await base44.entities.TrainingSet.update(set.id, { status });
    note(`Fertig — ${total} Bilder, Status: ${status}.`);

    setBuilt({ setId: set.id, personName: person, images: imageUris, generated, status, characterId: null });
    setStage("fertig");
    setProgress("");
  };

  // Vorschau-URLs für die Fertig-Ansicht signieren.
  useEffect(() => {
    if (!built) return;
    (async () => {
      const map = {};
      for (const u of built.images) if (!map[u]) map[u] = await sign(u);
      setUrls(map);
    })();
  }, [built]);

  // Charakter hier speichern — gleiche Logik wie im Trainingsset-Extraktor.
  const saveCharacter = async () => {
    if (!built || charBusy) return;
    setCharBusy(true);
    try {
      const refUri = built.images[0];
      const refUrl = refUri ? await sign(refUri) : null;
      let appearance = "";
      if (refUrl) {
        const r = await base44.integrations.Core.InvokeLLM({
          prompt: "Beschreibe das Aussehen der Person auf diesem Bild in 2-3 Sätzen, auf Deutsch. Erwachsene Person.",
          file_urls: [refUrl],
        });
        appearance = typeof r === "string" ? r : String(r || "");
      }
      const ch = await base44.entities.Character.create({
        name: built.personName, adultAge: 25, appearance,
        avatar: refUri || "", images: built.images, fictional: true, createdByRole: "DAVID",
      });
      await base44.entities.TrainingSet.update(built.setId, { status: "BEREIT" });
      setBuilt((b) => ({ ...b, characterId: ch.id, status: "BEREIT" }));
      note("Charakter gespeichert.");
    } finally { setCharBusy(false); }
  };

  const downloadZip = async () => {
    if (!built || zipBusy) return;
    setZipBusy(true);
    try {
      const zip = new JSZip();
      let i = 0;
      for (const u of built.images) {
        const url = await sign(u);
        if (!url) continue;
        try { const blob = await (await fetch(url)).blob(); zip.file(`bild_${String(i + 1).padStart(2, "0")}.jpg`, blob); i += 1; } catch {}
      }
      for (const u of built.generated) {
        try { const blob = await (await fetch(u)).blob(); zip.file(`gen_${String(i + 1).padStart(2, "0")}.jpg`, blob); i += 1; } catch {}
      }
      if (!i) return;
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = `${built.personName}-trainingsset.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      note("ZIP heruntergeladen — bereit für die GPU.");
    } finally { setZipBusy(false); }
  };

  const reset = () => {
    setStage("eingabe"); setFiles([]); setLog([]); setBuilt(null); setUrls({}); setProgress(""); setName("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border-2 border-primary/30 bg-background/40 p-3">
        <p className="text-[12px] font-bold text-primary mb-1">Auto-Extraktor — aus jeder Quelle ein fertiges Set</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Bilder, Videos oder Sprache reinwerfen. Der Extraktor zieht Frames, wandelt Audio in Text,
          baut selbst ein Set, füllt es bei Bedarf auf und legt den Charakter hier ab. Du bindest nur
          noch an die GPU.
        </p>
      </div>

      {stage === "eingabe" && (
        <>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-border bg-elevated/50 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
          >
            <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => onPick(e.target.files)} />
            <Upload className="w-6 h-6 text-primary" />
            <p className="text-[13px] font-bold text-foreground">Bilder, Videos oder Audio reinwerfen</p>
            <p className="text-[11px] text-muted-foreground text-center">Videos werden zu Frames, Audio zu Text + Stimmprobe.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-elevated border border-border flex-1">
              <User className="w-4 h-4 text-primary" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name des Charakters / der Person"
                className="bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
              />
            </div>
            <button
              onClick={run}
              disabled={!files.length}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" /> Extrahieren & bauen
            </button>
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-elevated border border-border px-2.5 py-1 text-[11px] text-foreground">
                  {kindForFile(f) === "IMAGE" && <ImgIcon className="w-3 h-3 text-primary" />}
                  {kindForFile(f) === "VIDEO" && <Film className="w-3 h-3 text-primary" />}
                  {kindForFile(f) === "AUDIO" && <Mic className="w-3 h-3 text-primary" />}
                  <span className="max-w-[140px] truncate">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">✕</button>
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {stage === "arbeit" && (
        <div className="rounded-2xl border border-border bg-elevated p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[13px] font-bold text-primary">
            <Loader2 className="w-4 h-4 animate-spin" /> {progress || "Arbeite …"}
          </div>
          <div className="h-2 rounded-full bg-background overflow-hidden">
            <div className="h-full bg-primary/70 animate-pulse" style={{ width: "70%" }} />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl bg-background border border-border p-3">
            {log.map((l, i) => <p key={i} className="text-[12px] text-foreground whitespace-pre-wrap">{l}</p>)}
          </div>
        </div>
      )}

      {stage === "fertig" && built && (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border-2 border-primary/40 bg-elevated p-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-bold text-foreground">{built.personName}</p>
              <p className="text-[11px] text-muted-foreground">
                {built.images.length} echte · {built.generated.length} erzeugt ·{" "}
                <span className={built.status === "BEREIT" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {built.status === "BEREIT" ? "bereit zum Training" : "noch zu wenig"}
                </span>
              </p>
            </div>
            {built.characterId && (
              <a href={`/charakter/${built.characterId}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                <Check className="w-3.5 h-3.5" /> Charakter angelegt
              </a>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {built.images.map((u, i) => (
              <div key={i} className="h-20 rounded-xl bg-background overflow-hidden">
                {urls[u] ? <Image src={urls[u]} fittingType="fill" className="h-full w-full" /> : <div className="h-full w-full animate-pulse" />}
              </div>
            ))}
            {built.generated.map((u, i) => (
              <div key={`g${i}`} className="h-20 rounded-xl bg-background overflow-hidden ring-1 ring-primary/40">
                <Image src={u} fittingType="fill" className="h-full w-full" />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {!built.characterId && (
              <button onClick={saveCharacter} disabled={charBusy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50">
                {charBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />} Charakter hier speichern
              </button>
            )}
            <button onClick={downloadZip} disabled={zipBusy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[13px] font-bold text-foreground disabled:opacity-50">
              {zipBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />} ZIP für GPU
            </button>
            <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[13px] font-bold text-foreground">
              <RefreshCw className="w-4 h-4" /> Neues Set
            </button>
          </div>

          <Anleitung personName={built.personName} hasCharacter={!!built.characterId} />
        </div>
      )}

      {stage === "eingabe" && <Anleitung personName={name.trim() || "Charakter"} hasCharacter={false} preview />}
    </div>
  );
}

// Die Anleitung — idiotensicher, von der Quelle bis zum gebundenen Modell.
function Anleitung({ personName, hasCharacter, preview }) {
  const steps = [
    { icon: Package, t: "1. ZIP herunterladen", d: `"ZIP für GPU" klickt, liegt ${personName}-trainingsset.zip bereit.` },
    { icon: Server, t: "2. Auf GPU-Server laden", d: "ZIP bei Replicate / fal.ai / RunPod hochladen, LoRA-Training starten (≈12 Bilder reichen)." },
    { icon: Cpu, t: "3. Modell trainieren", d: "Training durchlaufen lassen, bis das LoRA-Modell fertig ist. Modell-ID kopieren." },
    { icon: Link2, t: "4. Hier anbinden", d: 'Reiter "Anbindung" → Modell-ID eintragen, Bild- und Video-Erzeugung greifen darauf zu.' },
    { icon: User, t: "5. Charakter verfügbar", d: hasCharacter ? "Speichern bereits erledigt — Charakter ist angelegt." : `"Charakter hier speichern" klicken, dann ist ${personName} im Studio verfügbar.` },
  ];
  return (
    <div className={cn("rounded-2xl border border-border bg-background/40 p-3", preview && "mt-2")}>
      <p className="text-[12px] font-bold text-primary mb-2 flex items-center gap-1.5">
        <ArrowRight className="w-3.5 h-3.5" /> So kommt es ins Training — Schritt für Schritt
      </p>
      <div className="flex flex-col gap-1.5">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-start gap-2 rounded-xl bg-elevated border border-border p-2">
              <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-bold text-foreground">{s.t}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{s.d}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5" /> Du musst nur die GPU anbinden — alles andere macht der Extraktor.
      </p>
    </div>
  );
}