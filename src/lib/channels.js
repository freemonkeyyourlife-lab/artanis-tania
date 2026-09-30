// Die Kanäle, über die du mit deinen Kunden sprichst — und die Wege, wie die
// App dich direkt dorthin bringt: ein Tipp öffnet den echten Chat.

export const CHANNELS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    field: "whatsapp",
    placeholder: "+49 151 12345678",
    hint: "Nummer mit Ländervorwahl — die App macht daraus den fertigen Chat-Link.",
    color: "text-emerald-400",
  },
  {
    id: "telegram",
    label: "Telegram",
    field: "telegram",
    placeholder: "@name",
    hint: "Benutzername — ohne @ geht es auch.",
    color: "text-sky-400",
  },
  {
    id: "instagram",
    label: "Instagram",
    field: "instagram",
    placeholder: "@name",
    hint: "Benutzername — öffnet direkt die Direktnachricht.",
    color: "text-pink-400",
  },
];

const digitsOf = (value) => String(value || "").replace(/[^\d]/g, "");
const handleOf = (value) => String(value || "").trim().replace(/^@+/, "");

// Ein Tipp öffnet den echten Chat. WhatsApp nimmt den Text gleich mit vorweg.
export function channelLink(channelId, value, text) {
  if (!value) return "";
  if (channelId === "whatsapp") {
    const number = digitsOf(value);
    if (!number) return "";
    return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  }
  if (channelId === "telegram") {
    const name = handleOf(value);
    return name ? `https://t.me/${name}` : "";
  }
  if (channelId === "instagram") {
    const name = handleOf(value);
    return name ? `https://ig.me/m/${name}` : "";
  }
  return "";
}

export function linksForContact(contact, text) {
  return CHANNELS.map((channel) => ({
    ...channel,
    value: contact?.[channel.field],
    url: channelLink(channel.id, contact?.[channel.field], text),
  })).filter((channel) => channel.url);
}

const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

// CSV — für Excel, Numbers und Google Tabellen.
export function buildCsv(contacts) {
  const head = ["Name", "WhatsApp", "Telegram", "Instagram", "E-Mail", "Notiz"];
  const rows = contacts.map((c) => [
    c.name,
    c.whatsapp,
    c.telegram,
    c.instagram,
    c.email,
    c.note,
  ]);
  return [head, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
}

// vCard — die Datei, die dein Handy direkt in die Kontakte übernimmt.
export function buildVcard(contacts) {
  return contacts
    .map((c) => {
      const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${c.name || ""}`, `N:${c.name || ""};;;;`];
      if (c.whatsapp) lines.push(`TEL;TYPE=CELL:${c.whatsapp}`);
      if (c.email) lines.push(`EMAIL:${c.email}`);
      if (c.note) lines.push(`NOTE:${String(c.note).replace(/\n/g, " ")}`);
      if (c.telegram) lines.push(`X-TELEGRAM:@${handleOf(c.telegram)}`);
      if (c.instagram) lines.push(`X-INSTAGRAM:@${handleOf(c.instagram)}`);
      lines.push("END:VCARD");
      return lines.join("\r\n");
    })
    .join("\r\n");
}

// Reine Textliste — zum Einfügen in eine Nachricht oder Notiz.
export function buildTextList(contacts) {
  return contacts
    .map((c) => {
      const parts = [c.name];
      if (c.whatsapp) parts.push(`WhatsApp ${c.whatsapp}`);
      if (c.telegram) parts.push(`Telegram @${handleOf(c.telegram)}`);
      if (c.instagram) parts.push(`Instagram @${handleOf(c.instagram)}`);
      return parts.join(" · ");
    })
    .join("\n");
}

export function downloadText(filename, mime, content) {
  const blob = new Blob([`\ufeff${content}`], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}