import { base44 } from "@/api/base44Client";

// Eine Stimme gehört immer nur einem Charakter — vorher beim alten lösen.
export async function assignVoiceToCreator(creatorId, voiceId, creators = []) {
  if (voiceId) {
    const previous = creators.filter((c) => c.voiceProfileId === voiceId && c.id !== creatorId);
    for (const c of previous) {
      await base44.entities.Creator.update(c.id, { voiceProfileId: "" });
    }
  }
  await base44.entities.Creator.update(creatorId, { voiceProfileId: voiceId || "" });
}