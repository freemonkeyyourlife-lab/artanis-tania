// Der Auftrag an die Erzählerin: sie schreibt die Zusammenfassung der Sitzung.
// Liegt hier, weil sie am Sitzungsende automatisch läuft — nicht mehr im Browser.

const KIND_PROMPTS = {
  ERZAEHLERIN: "Du führst durch die Szene und bleibst die ganze Zeit dabei.",
  BEGLEITERIN: "Du gehst mit, wie eine Freundin, die daneben sitzt und mitfiebert.",
  BERATERIN: "Du berätst wie eine Concierge, die den Laden in- und auswendig kennt.",
  VERFUHRERIN: "Du redest ihr zu und stachelst sie an — nie plump, immer mit Andeutung.",
  BEOBACHTERIN: "Du schaust über die Schulter und sagst, was du siehst.",
};

function therapistName(session) {
  return String(session?.therapistName || "").trim() || "Tania";
}

function formatLabel(session) {
  if ((session?.format || "EINZEL") !== "SERIE") return "Einzelsitzung";
  const count = session?.episodeCount ? ` von ${session.episodeCount}` : "";
  return `Folge ${session?.episodeNumber || 1}${count}`;
}

function roleLabel(session) {
  const role = session?.roleSetup || "TANIA_THERAPIST";
  const name = therapistName(session);
  if (role === "USER_THERAPIST") return "Der Nutzer ist der Therapeut";
  if (role === "BOTH_PROBANDS") return "Beide sind Probanden";
  return `${name} ist die Therapeutin`;
}

export function narratorBriefing(narrators) {
  if (!narrators || narrators.length === 0) return "— noch keine gewählt —";
  return narrators
    .map((n, i) => {
      const kind = KIND_PROMPTS[n.kind] || KIND_PROMPTS.ERZAEHLERIN;
      const parts = [kind, n.personality, n.appearance ? `Aussehen: ${n.appearance}` : ""].filter(Boolean);
      const noun = n.gender === "MAENNLICH" ? "Erzähler" : "Erzählerin";
      return `${i} — ${n.name} (${noun}): ${parts.join(" ")}`;
    })
    .join("\n");
}

export function therapySummaryPrompt({ session, narrators, messages }) {
  const history = (messages || [])
    .filter((m) => m.senderType !== "GUEST")
    .map((m) => {
      if (m.senderType === "AI") {
        return `${session?.actor?.active ? "Szene" : therapistName(session)}: ${m.text}`;
      }
      if (m.senderType === "SYSTEM") return `Hinweis: ${m.text}`;
      return `Klient: ${m.text}`;
    })
    .join("\n");

  return [
    "Du fasst eine Therapie-Sitzung zusammen, die gerade zu Ende gegangen ist. Du warst die ganze Zeit dabei und hast zugehört.",
    `# Deine Erzählerinnen\n${narratorBriefing(narrators)}`,
    `# Die Sitzung\nThema: "${session?.topic || "ohne Thema"}"` +
      (session?.goal ? `\nErhofft: "${session.goal}"` : "") +
      `\nFormat: ${formatLabel(session)}\nRollen: ${roleLabel(session)}`,
    `# Der Verlauf\n${history || "(noch nichts gesagt)"}`,
    "# Auftrag",
    "Schreib die Zusammenfassung: was war heute dran, was ist durchgekommen, was liegt noch offen. Vier bis sechs Sätze.",
    "Bleib in deiner Rolle und in deiner Persönlichkeit — aber erfinde nichts dazu, was nicht gesagt wurde.",
    "Sprich den Klienten direkt an und duze ihn. Keine Überschrift, keine Aufzählung, keine Anführungszeichen, keine Regieanweisungen.",
    "Nur der Fließtext der Zusammenfassung, auf Deutsch.",
  ].join("\n");
}