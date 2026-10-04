import React from "react";
import ArchiveUpload from "@/components/images/ArchiveUpload";

// Bilder direkt in den Ordner legen — sie landen gleich im Archiv und sind dort
// für immer greifbar.
export default function IdeaImages({ value = [], onChange }) {
  return <ArchiveUpload value={value} onChange={onChange} kind="IDEE" />;
}