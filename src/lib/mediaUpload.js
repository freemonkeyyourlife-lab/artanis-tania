import { base44 } from "@/api/base44Client";

// Bilder, die als Datenstrom ankommen, dauerhaft ablegen und eine echte Adresse zurückgeben.
export async function uploadDataUrl(url, filename) {
  if (!url || !url.startsWith("data:")) return url;
  const blob = await (await fetch(url)).blob();
  const file = new File([blob], filename || "bild.png", { type: blob.type || "image/png" });
  const res = await base44.integrations.Core.UploadPublicFile({ file });
  return res.file_url;
}