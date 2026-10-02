import { base44 } from "@/api/base44Client";
import { addGalleryItems } from "@/lib/gallery";
import { runInBackground } from "@/lib/importRunner";
import { CARTOON_STYLE, IMAGE_SAFE_RULES, PHOTOREAL } from "@/lib/appearance";

const PERSON = {
  SOLO_MALE: "ein gutaussehender Mann",
  SOLO_FEMALE: "eine wunderschöne Frau",
  SHEMALE: "eine attraktive Trans-Frau",
  COUPLE: "ein attraktives Paar",
  GROUP: "eine kleine Gruppe attraktiver Menschen",
};

// Was der Charakter beim Import über sich selbst mitgebracht hat, wird zur
// Bildbeschreibung — erfunden wird nichts.
function describe(creator, dock) {
  return [
    dock?.personality,
    dock?.summary,
    dock?.tagline,
    creator.tagline,
    creator.bio,
    creator.shortStory,
    (creator.topics || []).join(", "),
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(". ")
    .slice(0, 700);
}

export function imagePrompt(creator, dock) {
  const style = creator.artStyle === "CARTOON" ? CARTOON_STYLE : PHOTOREAL;
  const description = describe(creator, dock);
  return (
    `Porträt: ${PERSON[creator.personaType] || PERSON.SOLO_FEMALE}${creator.age ? `, etwa ${creator.age} Jahre alt` : ""}. ` +
    (description ? `So ist sie: ${description}. ` : "") +
    "Warmes, weiches Licht, klarer Blick in die Kamera, hochwertige Aufnahme. " +
    style +
    IMAGE_SAFE_RULES
  );
}

// Fehlende Bilder erzeugen und im selben Zug dem richtigen Profil zuweisen:
// Hauptbild, Banner und ein Galerie-Eintrag.
export async function fillMissingImages(creators = [], docks = []) {
  const dockByCreator = new Map(docks.map((d) => [d.creatorId, d]));
  const targets = creators.filter((c) => !c.avatar && !(c.referenceImages || []).length);
  if (!targets.length) return { done: 0, failed: 0, total: 0 };

  const tasks = targets.map((c) => ({
    label: c.stageName,
    run: async () => {
      const res = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt(c, dockByCreator.get(c.id)) });
      const url = res?.url;
      if (!url) throw new Error("Kein Bild zurückgekommen");
      const data = { avatar: url };
      if (!c.banner) data.banner = url;
      await base44.entities.Creator.update(c.id, data);
      await addGalleryItems({ urls: [url], creatorId: c.id, creatorName: c.stageName });
    },
  }));

  return runInBackground({ title: "Bilder für Charaktere", tasks });
}