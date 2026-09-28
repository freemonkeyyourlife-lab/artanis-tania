import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Banknote, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const PRESETS = [10, 20, 50, 100];

// Ein Klick: Betrag eintippen, Link geht sofort in den Chat.
export default function QuickPayButton({ onSend, disabled, className }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const submit = async () => {
    const value = Number(String(amount).replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Betrag fehlt.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await base44.functions.invoke("paymentLink", {
        action: "create",
        amount: value,
        title: title.trim() || "Zahlung",
        kind: "LINK",
      });
      if (res.data?.error) throw new Error(res.data.error);
      await onSend(res.data.link);
      toast({
        title: "Zahlungslink gesendet",
        description: `${value.toFixed(2).replace(".", ",")} € steht jetzt im Chat.`,
      });
      setOpen(false);
      setAmount("");
      setTitle("");
    } catch (e) {
      console.error(e);
      setError("Hat nicht geklappt — versuch es nochmal.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          disabled={disabled}
          title="Betrag vereinbart? Link sofort in den Chat senden"
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-full bg-elevated text-muted-foreground hover:text-primary transition-colors disabled:opacity-50",
            className || "w-8 h-8"
          )}
        >
          <Banknote className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <h3 className="font-display text-lg text-foreground mb-1">Sofort kassieren</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Betrag festlegen — der Link landet direkt als Nachricht im Chat.
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(String(p))}
              className={cn(
                "px-3.5 py-2 rounded-full border text-sm transition-colors",
                Number(String(amount).replace(",", ".")) === p
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-elevated border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {p} €
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-3">
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
            placeholder="Wofür? (optional)"
            className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>

        {error && <p className="text-sm text-destructive mb-3">{error}</p>}

        <button
          onClick={submit}
          disabled={sending}
          className="w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending && <Loader2 className="w-4 h-4 animate-spin" />}
          {sending ? "Wird gesendet …" : "Erstellen & senden"}
        </button>
      </DialogContent>
    </Dialog>
  );
}