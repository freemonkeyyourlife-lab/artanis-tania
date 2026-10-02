import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { BILLING_TYPES, INTERVALS, intervalLabel, priceLabel } from "@/lib/billing";

export default function PaymentLinkForm({ defaultAmount = "", defaultTitle = "", onCreated }) {
  const [kind, setKind] = useState("LINK");
  const [billingType, setBillingType] = useState("ONE_TIME");
  const [interval, setInterval] = useState("MONTH");
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "");
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [targetName, setTargetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const url = created ? `${window.location.origin}/pay/${created.token}` : "";

  const create = async () => {
    const value = Number(String(amount).replace(",", "."));
    if (!title.trim()) {
      setError("Sag kurz, wofür der Betrag ist.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("Gib einen Betrag ein.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await base44.functions.invoke("paymentLink", {
        action: "create",
        amount: value,
        title: title.trim(),
        description: description.trim(),
        targetName: targetName.trim(),
        kind,
        billingType,
        interval,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setCreated(res.data.link);
      onCreated?.(res.data.link);
    } catch (e) {
      console.error(e);
      setError("Der Link konnte nicht erstellt werden.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link kopiert", description: "Kannst du direkt verschicken." });
    } catch (e) {
      toast({ title: "Kopieren ging nicht", description: "Markier den Link und kopier ihn von Hand.", variant: "destructive" });
    }
  };

  if (created) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {created.kind === "TASK" ? "Aufgabe steht" : "Link ist fertig"}
          </p>
          <p className="font-display text-3xl text-foreground mb-1">{priceLabel(created)}</p>
          <p className="text-sm text-foreground">{created.title}</p>
        </div>

        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-full bg-background border border-border text-xs text-foreground"
          />
          <button
            onClick={copy}
            className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Kopiert" : "Kopieren"}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> Vorschau öffnen
          </a>
          <button
            onClick={() => {
              setCreated(null);
              setCopied(false);
              setTitle("");
              setAmount("");
              setDescription("");
              setTargetName("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Noch einen erstellen
          </button>
        </div>

        {created.kind === "TASK" && (
          <p className="text-[11px] text-muted-foreground">
            Steht jetzt öffentlich in der Kasse — jeder kann sie übernehmen und bezahlen.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          { value: "LINK", label: "Persönlicher Link" },
          { value: "TASK", label: "Öffentliche Aufgabe" },
        ].map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setKind(o.value)}
            className={cn(
              "px-3.5 py-2 rounded-full border text-sm transition-colors",
              kind === o.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-elevated border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div>
        <div className="flex gap-2">
          {BILLING_TYPES.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setBillingType(o.value)}
              className={cn(
                "px-3.5 py-2 rounded-full border text-sm transition-colors",
                billingType === o.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-elevated border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          {BILLING_TYPES.find((o) => o.value === billingType)?.hint}
        </p>
      </div>

      {billingType === "RECURRING" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-muted-foreground">Wiederholt sich</span>
          {INTERVALS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setInterval(o.value)}
              className={cn(
                "px-3.5 py-2 rounded-full border text-sm transition-colors",
                interval === o.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-elevated border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="Betrag"
          className="w-28 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <span className="self-center text-sm text-muted-foreground">€</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === "TASK" ? "Was soll gemacht werden?" : "Wofür?"}
          className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Details, die der Zahler sehen soll (optional)"
        className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
      />

      {kind === "LINK" && (
        <input
          value={targetName}
          onChange={(e) => setTargetName(e.target.value)}
          placeholder="Für wen? (optional, nur als Notiz)"
          className="w-full px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        onClick={create}
        disabled={saving}
        className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
      >
        {saving
          ? "Wird erstellt …"
          : kind === "TASK"
          ? "Aufgabe anlegen"
          : billingType === "RECURRING"
          ? `Abo-Link erstellen (${intervalLabel(interval)})`
          : "Link erstellen"}
      </button>
    </div>
  );
}