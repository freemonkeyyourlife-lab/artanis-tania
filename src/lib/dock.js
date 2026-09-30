import { base44 } from "@/api/base44Client";

// Wessen Persönlichkeit mit reingemischt wird.
export const BLEND_OPTIONS = [
  { id: "COUPLE", label: "Artanis × Triania", hint: "Die volle Haus-Persönlichkeit — beide." },
  { id: "ARTANIS", label: "Artanis", hint: "Direkt, dominant, männlich." },
  { id: "TRIANIA", label: "Triania", hint: "Verspielt, warm, verführerisch." },
  { id: "NONE", label: "Nichts mischen", hint: "Sein Charakter bleibt ganz für sich." },
];

export const PERSONA_TYPES = [
  { id: "SOLO_FEMALE", label: "Frau" },
  { id: "SOLO_MALE", label: "Mann" },
  { id: "COUPLE", label: "Paar" },
  { id: "GROUP", label: "Gruppe" },
];

export const DOCK_STATUS = {
  PENDING: "Wartet auf Freigabe",
  APPROVED: "Freigegeben",
  REJECTED: "Abgelehnt",
};

// Aus einer Andockung wird ein echter Charakter — mit unserer Persönlichkeit drin.
export function dockToCreator(dock) {
  const many = dock.personaType === "GROUP" || dock.personaType === "COUPLE";
  const spoken = many
    ? "\n\nWER SPRICHT: Es sind mehrere Personen im Spiel. Jede gesprochene Zeile beginnt mit dem Namen in eckigen Klammern, z.B. [Name]: … Keine von ihnen bleibt stumm, und keine verlässt den Raum."
    : "";
  return {
    stageName: dock.name,
    personaType: dock.personaType || "SOLO_FEMALE",
    creatorCategory: "AI_MODEL",
    artStyle: "PHOTOREAL",
    active: true,
    bio: dock.personality || dock.summary || "",
    tagline: dock.tagline || "",
    avatar: dock.avatar || "",
    topics: dock.tags || [],
    tags: dock.tags || [],
    onlineStatus: "AI_AVAILABLE",
    profileVisibility: "PUBLIC",
    personaPrompt: (dock.personaPrompt || "") + spoken,
  };
}

export async function createCreatorFromDock(dock) {
  const creator = await base44.entities.Creator.create(dockToCreator(dock));
  await base44.entities.Dock.update(dock.id, { status: "APPROVED", creatorId: creator.id });
  return creator;
}