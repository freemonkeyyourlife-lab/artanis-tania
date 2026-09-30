import React from "react";
import { FileDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Das ganze Gespräch als eine Story: kopiert in die Zwischenablage und als Textdatei geladen.
export default function StoryExportButton({ messages = [], title = "Story", meName = "Ich" }) {
  const { toast } = useToast();

  const exportStory = async () => {
    const lines = messages
      .filter((m) => m.senderType !== "SYSTEM" && (m.text || "").trim())
      .map((m) => `${m.senderType === "HUMAN" ? meName : m.sender || title}: ${m.text.trim()}`);
    if (!lines.length) {
      toast({ title: "Noch nichts da", description: "Sobald geschrieben oder gesprochen wurde, kannst du die Story exportieren." });
      return;
    }
    const story = `${title}\n\n${lines.join("\n\n")}\n`;
    try { await navigator.clipboard.writeText(story); } catch (e) { /* Download reicht */ }
    const url = URL.createObjectURL(new Blob([story], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^\wäöüÄÖÜß-]+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Story exportiert", description: "Kopiert und als Textdatei gespeichert — auch deine Sprachnachrichten stehen als Text drin." });
  };

  return (
    <button onClick={exportStory} title="Ganze Story kopieren & exportieren" className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors">
      <FileDown className="w-4 h-4" />
    </button>
  );
}