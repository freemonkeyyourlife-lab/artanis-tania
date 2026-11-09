import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Download, Package } from "lucide-react";
import JSZip from "jszip";

const safe = (s) => String(s || "export").replace(/[^\wäöüÄÖÜß.-]+/g, "_").slice(0, 60);
const extOf = (u) => (String(u || "").split(/[?#]/)[0].split(".").pop() || "bin").slice(0, 5);

async function fetchBlob(url) {
  try {
    const r = await fetch(url, { mode: "cors" });
    if (!r.ok) return null;
    return await r.blob();
  } catch {
    return null;
  }
}

const mediaOf = (m) => {
  const items = m.attachments?.length
    ? m.attachments
    : m.attachment
    ? [{ type: "image", url: m.attachment }]
    : [];
  const out = [];
  for (const it of items) {
    if ((it.type === "image" || it.type === "video" || it.type === "audio") && it.url) {
      out.push({ url: it.url, kind: it.type });
    }
  }
  if (Array.isArray(m.images)) m.images.forEach((u) => u && out.push({ url: u, kind: "image" }));
  if (Array.isArray(m.videos)) m.videos.forEach((u) => u && out.push({ url: u, kind: "video" }));
  return out;
};

const transcript = (meta, messages, kind) => {
  const who = meta?.userName || "Gast";
  const other = kind === "therapy" ? meta?.therapistName || "Tania" : meta?.creatorName || meta?.participantName || "Chat";
  const lines = [
    kind === "therapy" ? `Sitzung: ${meta?.topic || "ohne Thema"}` : `Gespräch: ${who} / ${other}`,
    `Nachrichten: ${(messages || []).length}`,
    "",
  ];
  (messages || []).forEach((m) => {
    const when = m.created_date ? new Date(m.created_date).toLocaleString("de-DE") : "";
    const sender = m.senderType === "HUMAN" || m.senderType === "USER" ? who : m.senderType === "GUEST" ? "Gast" : m.sender || m.senderName || other;
    lines.push(`[${when}] ${sender}: ${m.text || ""}`);
  });
  return lines.join("\n");
};

// Zentraler Studio-Export: alles in einem ZIP — Galerie, Trainings-Bilder,
// Sprechstunden und Chats mit ihren Medien und Text-Verläufen. Ein Klick,
// eine Datei auf der Festplatte.
export default function StudioExportAll() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setDone(false);
    setPhase("Sammle Galerie …");
    const zip = new JSZip();
    let mediaOk = 0;
    let mediaSkip = 0;
    const seen = new Set();
    const addMedia = async (url, folder, name) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      const blob = await fetchBlob(url);
      if (!blob) { mediaSkip++; return; }
      const ext = extOf(url);
      zip.file(`${folder}/${name || "medium"}.${ext}`, blob);
      mediaOk++;
    };

    try {
      // Galerie
      const arch = await base44.entities.ImageArchive.filter({}, { limit: 500 }).catch(() => ({ items: [] }));
      const archItems = arch.items || [];
      setPhase(`Galerie: ${archItems.length} Einträge …`);
      for (let i = 0; i < archItems.length; i++) {
        const it = archItems[i];
        if (it.url) await addMedia(it.url, "galerie", `${String(i + 1).padStart(3, "0")}_${safe(it.name)}`);
      }

      // Trainings-Sets (Bilder + generierte)
      setPhase("Trainings-Sets …");
      const sets = await base44.entities.TrainingSet.filter({}, { limit: 200 }).catch(() => ({ items: [] }));
      const setItems = sets.items || [];
      for (const s of setItems) {
        const folder = `training/${safe(s.personName || s.name || "set")}`;
        const all = [...(s.images || []), ...(s.generatedImages || [])].filter(Boolean);
        let idx = 0;
        for (const u of all) {
          await addMedia(u, folder, `bild-${String(idx + 1).padStart(2, "0")}`);
          idx++;
        }
        zip.file(`${folder}/daten.txt`, [
          `Person: ${s.personName || ""}`,
          `Status: ${s.status} · Training: ${s.trainStatus || "OFFEN"}`,
          `Bilder: ${all.length}`,
          s.note ? `Notiz: ${s.note}` : "",
        ].filter(Boolean).join("\n"));
      }

      // Sprechstunde
      setPhase("Sprechstunden …");
      const therapy = await base44.entities.TherapySession.filter({}, { limit: 200 }).catch(() => ({ items: [] }));
      const therapyItems = therapy.items || [];
      for (let i = 0; i < therapyItems.length; i++) {
        const s = therapyItems[i];
        const msgs = await base44.entities.TherapyMessage.filter({ sessionId: s.id }, "created_date", 500).catch(() => []);
        const folder = `sprechstunde/${String(i + 1).padStart(3, "0")}_${safe(s.topic || s.id)}`;
        zip.file(`${folder}/verlauf.txt`, transcript(s, msgs, "therapy"));
        let mi = 0;
        for (const m of msgs) {
          for (const med of mediaOf(m)) {
            await addMedia(med.url, `${folder}/medien`, `${med.kind}-${String(mi + 1).padStart(2, "0")}`);
            mi++;
          }
        }
      }

      // Chats
      setPhase("Chats …");
      const convs = await base44.entities.Conversation.filter({}, { limit: 200 }).catch(() => ({ items: [] }));
      const convItems = convs.items || [];
      for (let i = 0; i < convItems.length; i++) {
        const c = convItems[i];
        const msgs = await base44.entities.Message.filter({ conversationId: c.id }, "created_date", 500).catch(() => []);
        const folder = `chats/${String(i + 1).padStart(3, "0")}_${safe(c.userName || "gast")}_${safe(c.creatorName || c.participantName || c.id)}`;
        zip.file(`${folder}/verlauf.txt`, transcript(c, msgs, "chat"));
        let mi = 0;
        for (const m of msgs) {
          for (const med of mediaOf(m)) {
            await addMedia(med.url, `${folder}/medien`, `${med.kind}-${String(mi + 1).padStart(2, "0")}`);
            mi++;
          }
        }
      }

      zip.file("liesmich.txt", [
        "ARTANIS × TANIA — Studio-Export",
        `Erzeugt: ${new Date().toLocaleString("de-DE")}`,
        `Galerie: ${archItems.length}`,
        `Trainings-Sets: ${setItems.length}`,
        `Sprechstunden: ${therapyItems.length}`,
        `Chats: ${convItems.length}`,
        `Medien gespeichert: ${mediaOk} · übersprungen: ${mediaSkip}`,
      ].join("\n"));

      setPhase("Packe ZIP …");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `studio-export-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setDone(true);
      toast({ title: "Gesichert", description: `${mediaOk} Medien in einem ZIP auf der Festplatte.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Abgebrochen", description: e?.message });
    } finally {
      setBusy(false);
      setPhase("");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Galerie, Trainings-Bilder, Sprechstunden und Chats gesammelt als ZIP auf die Festplatte"
        className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
      >
        <Package className="h-3.5 w-3.5" /> Alles sichern
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <h3 className="font-display text-lg text-foreground flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" /> Alles als ZIP sichern
          </h3>
          {done ? (
            <p className="text-sm text-muted-foreground">
              Fertig — das ZIP liegt auf deiner Festplatte. Schließ das Fenster oder starte einen neuen Export.
            </p>
          ) : busy ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> {phase || "Läuft …"}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Lädt Galerie, alle Trainings-Bilder, Sprechstunden und Chats mit Bildern, Videos und
              Sprachnachrichten plus Text-Verläufen in eine ZIP-Datei. Bei vielen Einträgen dauert das
              einen Moment.
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-full bg-elevated px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Schließen
            </button>
            <button onClick={run} disabled={busy} className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {done ? "Nochmal" : "Jetzt sichern"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}