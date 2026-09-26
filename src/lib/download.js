// Lädt ein Bild oder Video direkt herunter. Klappt der direkte Weg nicht
// (z. B. wegen Cross-Origin), öffnen wir die Datei in einem neuen Tab.
export async function downloadMedia(url, filename) {
  if (!url) return;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Download fehlgeschlagen: ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename || "medien";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (e) {
    window.open(url, "_blank");
  }
}