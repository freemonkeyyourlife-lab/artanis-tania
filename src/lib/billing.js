// Die zwei Zahlweisen eines Links: fester Betrag oder Abo, das sich wiederholt.
export const BILLING_TYPES = [
  { value: "ONE_TIME", label: "Einmalig", hint: "Fester Betrag — einmal gezahlt, fertig." },
  { value: "RECURRING", label: "Abo", hint: "Wiederkehrend, bis der Zahler kündigt." },
];

export const INTERVALS = [
  { value: "WEEK", label: "wöchentlich" },
  { value: "MONTH", label: "monatlich" },
  { value: "YEAR", label: "jährlich" },
];

export const intervalLabel = (value) =>
  INTERVALS.find((i) => i.value === value)?.label || "monatlich";

export const isRecurring = (link) => link?.billingType === "RECURRING";

// „12,00 €" bzw. „12,00 € monatlich" — so steht der Preis überall gleich da.
export const priceLabel = (link) =>
  `${Number(link?.amount || 0).toFixed(2).replace(".", ",")} €${
    isRecurring(link) ? ` ${intervalLabel(link.interval)}` : ""
  }`;