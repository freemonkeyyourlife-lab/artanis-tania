import { base44 } from "@/api/base44Client";
import { hashtagPromptBlock } from "@/lib/hashtags";

// Die feste Regel — so wird hier erzählt und gebaut, bei jedem Prompt:
// Bild, Video, Text, Szene. Sie gilt für immer, bis du sie selbst änderst.
export const DEFAULT_RULE = `So wird hier erzählt und gebaut — in mehreren Teilen, nacheinander:
1. Die Anweisung: „so und so, und das und das" — was gelten soll.
2. Die Situation: „die Situation ist die …" — der Ausgangspunkt, der Boden.
3. Darauf wird aufgebaut: „ich baue darauf auf" — was schon steht, bleibt stehen.
4. Was danach kommt: „und danach kommt das …" — die nächste Schicht.
Alles davon gehört in den Prompt, in dieser Reihenfolge. Nichts weglassen, nichts umbiegen, nichts dazuerfinden, was widerspricht. Der Prompt bleibt offen: die nächste Schicht kann jederzeit angehängt werden, ohne dass das Vorherige fällt.`;

const LEARN_TITLE = "Gelernt aus deinen Worten";
const KIND_LABEL = { ALLGEMEIN: "", BILD: "Bilder", VIDEO: "Videos", TEXT: "Texte", STORY: "Geschichten" };

const rows = (res) => (Array.isArray(res) ? res : res?.items || []);

// Alle eigenen Regeln, die gerade gelten.
export async function loadRules() {
  return rows(await base44.entities.PromptRule.filter({ active: true }, { sort: "order", limit: 50 }).catch(() => []));
}

// Der Block, der in jeden Prompt-Auftrag mit hineingeht: die feste Regel,
// deine eigenen Zusätze — und wie es bei dir zuletzt geklungen hat.
export async function ruleBlock(kind = "") {
  const all = await loadRules();
  const own = all.filter((r) => r.rule?.trim() && r.title !== LEARN_TITLE);
  const passed = own.filter((r) => r.kind === "ALLGEMEIN" || (kind && r.kind === kind));
  // Die Hashtags sagen in Worten, was hier gemeint ist — sie laufen immer mit.
  const hashtags = await hashtagPromptBlock();
  const rules = [DEFAULT_RULE, ...passed.map((r) => `${r.title}: ${r.rule.trim()}`), hashtags]
    .filter(Boolean)
    .join("\n\n");

  const learned = all.find((r) => r.title === LEARN_TITLE)?.examples || [];
  const examples = learned
    .slice(0, 3)
    .map((e) => `- Aus „${(e.rough || "").slice(0, 220)}" wurde: „${(e.prompt || "").slice(0, 320)}"`)
    .join("\n");

  return { rules, examples };
}

// Jeder gute Durchlauf wird gemerkt: so erziehen sich die Modelle mit der Zeit
// auf deine Art. Lernen ist Beiwerk — es darf die Erstellung nie aufhalten.
export async function learnExample(rough, prompt) {
  const said = (rough || "").trim();
  const written = (prompt || "").trim();
  if (!said || !written) return;
  try {
    const all = rows(await base44.entities.PromptRule.filter({}, { sort: "order", limit: 50 }));
    const rec = all.find((r) => r.title === LEARN_TITLE);
    const examples = [{ rough: said, prompt: written, at: new Date().toISOString() }, ...(rec?.examples || []).filter((e) => e?.rough !== said)].slice(0, 12);
    if (rec) await base44.entities.PromptRule.update(rec.id, { examples });
    else await base44.entities.PromptRule.create({ title: LEARN_TITLE, kind: "ALLGEMEIN", rule: "", examples, order: 999, active: true });
  } catch (e) {
    console.error(e);
  }
}

export const ruleKindLabel = (kind) => KIND_LABEL[kind] || "";