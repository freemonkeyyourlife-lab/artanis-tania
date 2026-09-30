// Wer bin ich in dieser Szene? Pro Gespräch gemerkt.
// ME = ich selbst · DIRECTOR = Regie, ich schaue zu und steuere · PLAY = ich spiele eine oder mehrere Figuren.

export const DEFAULT_ROLE = { mode: "ME", playing: [], current: null, muted: [] };

const KEY = "artanis_chat_role";
let cache = null;

function readAll() {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { cache = {}; }
  return cache;
}

export function roleFor(chatId) {
  return chatId ? readAll()[chatId] || null : null;
}

export function setRoleFor(chatId, role) {
  if (!chatId) return;
  const all = { ...readAll(), [chatId]: role };
  cache = all;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
}

// Wen spielt die KI noch? Nie jemanden, den ich selbst spiele — und nie die, die nur zuhören.
export function aiCast(roomIds, role) {
  const muted = role?.muted || [];
  const rest = roomIds.filter((id) => !muted.includes(id));
  if (role?.mode !== "PLAY") return rest;
  return rest.filter((id) => !role.playing.includes(id));
}

// Die Zeile, als wer ich gerade schreibe — für den bestehenden Chat-Ablauf.
export function speakAsFromRole(role) {
  if (role?.mode === "DIRECTOR") return "LISTEN";
  if (role?.mode === "PLAY" && role.playing.length) return role.playing.includes(role.current) ? role.current : role.playing[0];
  return "ME";
}

export function rolePrompt(role, playedNames, aiNames, listenerNames = []) {
  // Anwesend, aber stumm: diese Figuren sagen nichts.
  const silent = listenerNames.length
    ? `Anwesend, aber STUMM — sie sagen nichts, keine Zeile, keine Handlung, keinen Gedanken für sie: ${listenerNames.join(", ")}.\n`
    : "";
  if (role?.mode === "PLAY") {
    return (
      "\n\n═══ ROLLEN — WER SPIELT WEN ═══\n" +
      `Der Nutzer spielt selbst: ${playedNames.join(", ")}. Diese Figur(en) gehören NUR ihm — schreib für sie NIEMALS eine Zeile, eine Handlung oder einen Gedanken. Keine Figur spielt mit sich selbst.\n` +
      `Du spielst ausschließlich: ${aiNames.join(", ")}. Beginne JEDE gesprochene Zeile mit dem Namen in eckigen Klammern, z.B. [${aiNames[0]}]: …\n` +
      silent +
      "Reagiere auf das, was seine Figur sagt und tut, und gib ihr Raum zu antworten.\n" +
      "═══ ENDE ROLLEN ═══\n"
    );
  }
  if (role?.mode === "DIRECTOR") {
    return (
      "\n\n═══ ROLLEN — ER FÜHRT REGIE ═══\n" +
      `Der Nutzer spielt keine Figur. Er ist der Regisseur: er schaut zu, gibt Anweisungen und bestimmt das Tempo. Du spielst alle: ${aiNames.join(", ")}. Beginne JEDE gesprochene Zeile mit dem Namen in eckigen Klammern. Die Figuren reden miteinander, abwechselnd, jede mit ihrer eigenen Art. Eine Regieanweisung setzt ihr sofort um.\n` +
      silent +
      "═══ ENDE ROLLEN ═══\n"
    );
  }
  return (
    "\n\n═══ ROLLEN ═══\nDer Nutzer ist er selbst — ein eigener Mensch in der Szene, keine der Figuren. " +
    (aiNames.length > 1 ? `Du spielst: ${aiNames.join(", ")} — jede gesprochene Zeile beginnt mit dem Namen in eckigen Klammern.` : "") +
    silent +
    "\n═══ ENDE ROLLEN ═══\n"
  );
}