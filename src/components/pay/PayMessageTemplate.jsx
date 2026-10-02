import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Copy, Check, Loader2, Wand2 } from "lucide-react";

const KEY = "payMessageTemplate";
const DEFAULT_TEXT = "Hey {name} 💋 hier ist dein Link für {grund} — {betrag} €:\n{link}";
const inputCls = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50";

// Vorlage: Name, Betrag und Grund pro Kunde eintragen — fertige Nachricht samt Link kopieren.
export default function PayMessageTemplate({ onCreated }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [template, setTemplate] = useState(() => localStorage.getItem(KEY) || DEFAULT_TEXT);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const build = async () => {
    const value = Number(String(amount).replace(",", "."));
    if (!reason.trim() || !Number.isFinite(value) || value <= 0) {
      setError("Betrag und Grund eintragen.");
      return;
    }
    setBusy(true);
    setError("");
    localStorage.setItem(KEY, template);
    const res = await base44.functions.invoke("paymentLink", {
      action: "create", amount: value, title: reason.trim(), targetName: name.trim(),
      kind: "LINK", billingType: "ONE_TIME", interval: "MONTH",
    });
    setBusy(false);
    if (res.data?.error || !res.data?.link) {
      setError("Der Link konnte nicht erstellt werden.");
      return;
    }
    const link = `${window.location.origin}/pay/${res.data.link.token}`;
    setMessage(template
      .replaceAll("{name}", name.trim() || "du")
      .replaceAll("{grund}", reason.trim())
      .replaceAll("{betrag}", value.toFixed(2).replace(".", ","))
      .replaceAll("{link}", link));
    setCopied(false);
    onCreated?.();
  };

  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
  };

  return (
    <div className="glass rounded-2xl border border-border p-5 mb-8">
      <h2 className="font-display text-xl text-foreground mb-1">Schnell-Vorlage für Nachrichten</h2>
      <p className="text-xs text-muted-foreground mb-4">Pro Kunde Name, Betrag und Grund eintragen — die Nachricht mit Link ist sofort kopierbereit.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name des Kunden" className={inputCls} />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Betrag in €" className={inputCls} />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Grund, z. B. Privatvideo" className={inputCls} />
      </div>
      <label className="text-xs text-muted-foreground mb-1.5 block">Text der Vorlage — Platzhalter: {"{name} {betrag} {grund} {link}"}</label>
      <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={3} className={`${inputCls} resize-none mb-3`} />
      {error && <p className="text-xs text-destructive mb-3">{error}</p>}
      <button onClick={build} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Nachricht erstellen
      </button>
      {message && (
        <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
          <p className="text-sm text-foreground whitespace-pre-line break-all">{message}</p>
          <button onClick={copy} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-elevated border border-border text-sm text-foreground">
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />} {copied ? "Kopiert" : "Nachricht kopieren"}
          </button>
        </div>
      )}
    </div>
  );
}