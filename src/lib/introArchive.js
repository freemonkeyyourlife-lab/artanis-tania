import { base44 } from "@/api/base44Client";

// Was es hier noch nicht gibt, geht ins Archiv — als Anfrage. Genau das meint
// sie, wenn sie sagt: „das nehmen wir auf". Damit wissen wir, was gewollt ist,
// und die Anfrage läuft durch dieselbe Strecke wie alle anderen Wünsche.
export async function fileMissingWish({ text, name, interests = [], combination = {} }) {
  const wish = String(text || "").trim();
  if (!wish) return null;

  const picked = (combination || []).filter(Boolean);
  const me = await base44.auth.me().catch(() => null);

  return base44.entities.CommunityRequest.create({
    type: "CUSTOM_REQUEST",
    title: wish.slice(0, 90),
    description: [wish, picked.length ? `Kombination: ${picked.join(" + ")}` : ""].filter(Boolean).join("\n\n"),
    creatorName: "Erzählerin (Intro)",
    userName: name || me?.full_name || "",
    userId: me?.id || "",
    topics: interests,
    votes: 0,
    status: "NEW",
  });
}