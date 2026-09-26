export const CONTEST_CATEGORIES = [
  { value: "BEST_LOOKING", label: "Schönster", icon: "✨" },
  { value: "BIGGEST_COCK", label: "Größter Schwanz", icon: "🍆" },
  { value: "MOST_CUM_FACIAL", label: "Meiste Wichse im Gesicht", icon: "💦" },
  { value: "WILDEST_ACTION", label: "Frechste Aktion", icon: "🔥" },
  { value: "BEST_BODY", label: "Bester Körper", icon: "💪" },
  { value: "DIRTIEST_STORY", label: "Dreckigste Story", icon: "📖" },
  { value: "MOST_CREATIVE", label: "Kreativste Idee", icon: "🎨" },
  { value: "BEST_COUPLE", label: "Bestes Paar", icon: "💞" },
  { value: "CUSTOM", label: "Eigene Kategorie", icon: "⭐" },
];

export const CONTEST_FREQUENCIES = [
  { value: "WEEKLY", label: "Wöchentlich" },
  { value: "MONTHLY", label: "Monatlich" },
  { value: "ONE_TIME", label: "Einmalig" },
];

export const CONTEST_STATUSES = [
  { value: "DRAFT", label: "Entwurf" },
  { value: "UPCOMING", label: "Bald" },
  { value: "ACTIVE", label: "Läuft — Einsendungen offen" },
  { value: "VOTING", label: "Abstimmung läuft" },
  { value: "ENDED", label: "Beendet" },
];

export const CONTEST_VISIBILITIES = [
  { value: "PUBLIC", label: "Öffentlich" },
  { value: "REGISTERED", label: "Nur angemeldet" },
  { value: "VIP", label: "Nur VIP / Gold" },
  { value: "INVITE_ONLY", label: "Nur mit Einladung" },
];

export const MEDIA_TYPES = [
  { value: "IMAGE", label: "Nur Bilder" },
  { value: "VIDEO", label: "Nur Videos" },
  { value: "TEXT", label: "Nur Text" },
  { value: "ANY", label: "Bilder, Videos & Text" },
];

export const categoryOf = (contest) => {
  if (!contest) return CONTEST_CATEGORIES[0];
  const found = CONTEST_CATEGORIES.find((c) => c.value === contest.category);
  if (contest.category === "CUSTOM" && contest.customCategory) {
    return { value: "CUSTOM", label: contest.customCategory, icon: "⭐" };
  }
  return found || CONTEST_CATEGORIES[0];
};

export const statusOf = (contest) => {
  if (!contest) return "DRAFT";
  if (contest.status === "ACTIVE" && contest.endsAt && new Date(contest.endsAt) < new Date()) {
    return "ENDED";
  }
  return contest.status || "DRAFT";
};

export const statusLabel = (status) =>
  CONTEST_STATUSES.find((s) => s.value === status)?.label || status;

export const statusClass = (status) =>
  status === "ACTIVE"
    ? "bg-emerald-600/90 text-white"
    : status === "VOTING"
    ? "bg-primary text-primary-foreground"
    : status === "UPCOMING"
    ? "bg-amber-500/90 text-black"
    : status === "ENDED"
    ? "bg-elevated text-muted-foreground"
    : "bg-elevated text-muted-foreground";

export const timeLeft = (endsAt) => {
  if (!endsAt) return null;
  const ms = new Date(endsAt) - new Date();
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d} T ${h} Std`;
  if (h > 0) return `${h} Std ${m} Min`;
  return `${m} Min`;
};

export const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Für <input type="datetime-local">
export const toLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Ende automatisch aus Start + Rhythmus berechnen.
export const endForStart = (frequency, startLocal) => {
  if (!startLocal) return "";
  const d = new Date(startLocal);
  if (frequency === "WEEKLY") d.setDate(d.getDate() + 7);
  else if (frequency === "MONTHLY") d.setMonth(d.getMonth() + 1);
  else return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};