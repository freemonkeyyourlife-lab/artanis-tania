// Eine Einladung ist immer dasselbe — nur der Weg dorthin ist anders.
// Link, Code und QR führen alle auf dieselbe Einladung; WhatsApp, SMS und
// E-Mail sind bloß bequeme Wege, sie loszuschicken.

export const CHANNELS = [
  { id: "LINK", label: "Link kopieren", hint: "Zum Einfügen, wo immer du schreiben kannst — auch in einem anderen Programm." },
  { id: "WHATSAPP", label: "WhatsApp", hint: "Öffnet WhatsApp mit fertiger Nachricht. Du wählst nur noch den Kontakt." },
  { id: "SMS", label: "SMS", hint: "Schickt den Link als Kurznachricht auf ein Handy — ohne WhatsApp." },
  { id: "EMAIL", label: "E-Mail", hint: "Öffnet dein Mailprogramm mit fertiger Einladung." },
  { id: "QR", label: "QR-Code", hint: "Zum Vorzeigen oder Ausdrucken. Handy draufhalten, fertig." },
  { id: "CODE", label: "Code zum Vorlesen", hint: "Sechs Zeichen zum Ansagen. Der Gast tippt sie im Konto ein." },
];

export const channelLabel = (id) => (CHANNELS.find((c) => c.id === id) || {}).label || "Link";

const TOKEN_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
// Ohne 0/O und 1/I — sonst verliest man sich am Telefon.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const pick = (alphabet, length) =>
  Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");

export const makeToken = () => pick(TOKEN_ALPHABET, 12);
export const makeCode = () => `${pick(CODE_ALPHABET, 3)}-${pick(CODE_ALPHABET, 3)}`;

export const inviteUrl = (token) => `${window.location.origin}/?invite=${token}`;

export function shareLinks(token, label) {
  const url = inviteUrl(token);
  const text = `${label ? label + ", " : ""}hier ist deine Einladung zu ARTANIS × TANIA: ${url}`;
  const encoded = encodeURIComponent(text);
  return {
    whatsapp: `https://wa.me/?text=${encoded}`,
    sms: `sms:?&body=${encoded}`,
    email: `mailto:?subject=${encodeURIComponent("Deine Einladung")}&body=${encoded}`,
  };
}

export async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (e) {
    return false;
  }
}