import { base44 } from "@/api/base44Client";

// Jedes Bild, das einmal hochgeladen wurde, liegt ab jetzt im Archiv — mit
// echter Adresse, damit es auch außerhalb der App (fal.ai, Nano Banana) benutzt
// werden kann. Von dort holt man es sich jederzeit wieder.
export async function uploadToArchive(files, { kind = "ALLGEMEIN", note = "" } = {}) {
  const urls = [];
  for (const file of files) {
    const res = await base44.integrations.Core.UploadPublicFile({ file });
    urls.push(res.file_url);
    await base44.entities.ImageArchive.create({
      name: file.name || "Beispielbild",
      url: res.file_url,
      kind,
      note,
    });
  }
  return urls;
}

// Das ganze Archiv oder nur eine Abteilung davon.
export async function loadArchive(kind) {
  const { items } = await base44.entities.ImageArchive.filter(kind ? { kind } : {}, {
    sort: "-created_date",
    limit: 100,
  });
  return items;
}