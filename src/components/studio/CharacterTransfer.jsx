import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { charactersForExport, downloadJson, readJsonFile, usableCharacters } from "@/lib/studioTransfer";

// Raus als Datei, wieder rein als Datei — für Figuren, die du woanders
// erstellt hast oder sichern willst.
export default function CharacterTransfer({ creators, onImported }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const exportAll = () => {
    if (creators.length === 0) {
      toast({ title: "Nichts zu exportieren", description: "Leg erst einen Charakter an." });
      return;
    }
    downloadJson(charactersForExport(creators), "artanis-charaktere.json");
    toast({ title: "Datei ist da", description: `${creators.length} Charaktere exportiert.` });
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const data = await readJsonFile(file);
      const list = usableCharacters(data);
      if (list.length === 0) {
        toast({ title: "Nichts Brauchbares drin", description: "Die Datei enthält keine Charaktere.", variant: "destructive" });
        return;
      }
      await base44.entities.Creator.bulkCreate(list);
      toast({ title: "Rein gelegt", description: `${list.length} Charaktere angelegt.` });
      onImported?.();
    } catch (e) {
      toast({ title: "Hat nicht geklappt", description: "Die Datei konnte nicht gelesen werden.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={exportAll}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground"
      >
        <Download className="w-4 h-4" /> Alle exportieren
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {busy ? "Liest …" : "Datei importieren"}
      </button>
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={importFile} className="hidden" />
    </div>
  );
}