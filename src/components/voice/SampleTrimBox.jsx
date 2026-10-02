import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Scissors } from "lucide-react";
import AudioTrimmer from "@/components/voice/AudioTrimmer";

// Die schon abgelegte Aufnahme einer Stimme zuschneiden — der Ausschnitt
// ersetzt sie und geht danach denselben Weg wie jede andere Aufnahme.
export default function SampleTrimBox({ fileUri, onTrimmed, label = "Aufnahme zuschneiden" }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const openTrimmer = async () => {
    setBusy(true);
    try {
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 900 });
      setUrl(res?.signed_url || "");
      setOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const take = async (file) => {
    setBusy(true);
    try {
      const up = await base44.integrations.Core.UploadPrivateFile({ file });
      setOpen(false);
      onTrimmed(up.file_uri);
    } finally {
      setBusy(false);
    }
  };

  if (open && url) {
    return <AudioTrimmer source={url} onResult={take} onCancel={() => setOpen(false)} />;
  }

  return (
    <button
      type="button"
      onClick={openTrimmer}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
      {busy ? "Öffnet …" : label}
    </button>
  );
}