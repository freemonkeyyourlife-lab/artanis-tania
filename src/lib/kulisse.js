import { base44 } from "@/api/base44Client";

// Das zweite Archiv: was hinter einer Figur steckt. Nur für den Besitzer.

const rows = (res) => (Array.isArray(res) ? res : res?.items || []);

export const BACKSTAGE_FIELDS = [
  {
    key: "meaning",
    label: "Wofür sie steht",
    hint: "Ein Wort oder ein Satz. Nicht was sie ist, sondern was sie verkörpert.",
  },
  {
    key: "story",
    label: "Was hinter ihr steckt",
    hint: "Ihre Geschichte. Woher sie kommt, was sie geprägt hat.",
  },
  {
    key: "experiences",
    label: "Was ich mit ihr erlebt habe",
    hint: "Deine eigenen Erlebnisse mit ihr. Das ist der Stoff, aus dem die Szenen werden.",
  },
  {
    key: "voiceIdeas",
    label: "Stimme",
    hint: "Wie sie klingt: Tonlage, Tempo, Dialekt, Eigenheiten. Damit die Stimme nicht geraten wird.",
  },
  {
    key: "scenes",
    label: "Szenen, die zu ihr passen",
    hint: "Wann sie auftaucht und wann nicht. Was zu ihr passt — und was ihr fremd wäre.",
  },
  {
    key: "humanPrompt",
    label: "In meinen Worten",
    hint: "Erzähl es einfach so, wie du es jemandem am Tisch erzählen würdest. Das ist die Fassung, die ich verstehe.",
  },
];

export const EMPTY_BACKSTAGE = {
  meaning: "",
  story: "",
  experiences: "",
  voiceIdeas: "",
  scenes: "",
  humanPrompt: "",
  refImage: "",
};

export async function loadBackstage(characterId) {
  return rows(await base44.entities.CharacterBackstage.filter({ characterId }, { limit: 1 }))[0] || null;
}

export async function saveBackstage(character, data) {
  const payload = {
    ...data,
    characterId: character.id,
    characterName: character.stageName,
  };
  delete payload.id;
  if (data.id) {
    return base44.entities.CharacterBackstage.update(data.id, payload);
  }
  return base44.entities.CharacterBackstage.create(payload);
}