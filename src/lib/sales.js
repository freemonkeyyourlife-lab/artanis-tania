// Zahlen für das Verkaufs-Dashboard — überall gleich formatiert.

export const euro = (value) => `${Number(value || 0).toFixed(2).replace(".", ",")} €`;

export const STATUS_LABELS = {
  OPEN: "offen",
  PAID: "bezahlt",
  CANCELLED: "zurückgezogen",
};

// Die Zeile einer Auswertung, die zu einem Wert gehört (z. B. status "PAID").
export const rowFor = (rows, field, value) =>
  (rows || []).find((r) => r[field] === value) || { count: 0, sum_amount: 0 };

// Der Zeitraum-Schlüssel einer Monats-Auswertung — je nach Feldname unterschiedlich.
export const bucketKey = (row, field) => {
  if (row?.[field] != null) return row[field];
  const key = Object.keys(row || {}).find(
    (k) => k !== "_id" && k !== "count" && !/^(sum|avg|min|max)_/.test(k)
  );
  return key ? row[key] : "";
};

export const monthLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "").slice(0, 7);
  return date.toLocaleDateString("de-DE", { month: "short", year: "2-digit" });
};

export const paidAtLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};