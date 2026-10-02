import { base44 } from "@/api/base44Client";
import { BLEND_OPTIONS, createCreatorFromDock } from "@/lib/dock";
import { PERSONA_MODES } from "@/lib/personaPrompts";
import { runInBackground } from "@/lib/importRunner";

const BLEND_KEY = { ARTANIS: "artanis", TRIANIA: "triania", COUPLE: "couple" };

// Ein Link rein, ein Charakter raus: Seite lesen, Persönlichkeit mischen,
// andocken und freigeben — derselbe Weg wie im Formular, nur in einem Zug.
export async function importCharacterFromLink({
  url,
  personaType = "SOLO_FEMALE",
  blendWith = "COUPLE",
  blendStrength = 60,
}) {
  const key = BLEND_KEY[blendWith];
  const res = await base44.functions.invoke("dockCharacter", {
    sourceUrl: url,
    personaText: key ? PERSONA_MODES[key].prompt : "",
    personaLabel: BLEND_OPTIONS.find((b) => b.id === blendWith)?.label || "",
    blendStrength,
  });
  if (res.data?.error) throw new Error(res.data.error);

  const c = res.data?.character;
  if (!c?.name) throw new Error("Es kam kein Charakter zurück");

  const me = await base44.auth.me();
  const dock = await base44.entities.Dock.create({
    name: String(c.name).trim(),
    tagline: c.tagline || "",
    summary: c.summary || "",
    personality: c.personality || "",
    appearance: c.appearance || "",
    greeting: c.greeting || "",
    personaPrompt: c.personaPrompt || "",
    personaType,
    blendWith,
    blendStrength,
    sourceUrl: url,
    tags: c.tags || [],
    submittedByName: me?.full_name || me?.email || "",
    status: "APPROVED",
  });
  return createCreatorFromDock(dock);
}

// Viele auf einmal — läuft im Hintergrund weiter, mit Fortschrittsanzeige.
export function importManyFromServices(services = [], options = {}) {
  const tasks = services.map((s) => ({
    label: s.name,
    run: () => importCharacterFromLink({ ...options, url: s.url }),
  }));
  if (!tasks.length) return null;
  return runInBackground({ title: "Charaktere aus der Dienste-Liste", tasks });
}