import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Check, Clock } from "lucide-react";

export default function PurchaseRequests() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setItems(await base44.entities.Transaction.filter({ status: "PENDING" }, "-created_date", 50)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const confirm = async (tx) => {
    try {
      await base44.entities.Transaction.update(tx.id, { status: "PAID" });
      toast({ title: "Zahlung bestätigt", description: `${tx.amount} € freigeschaltet.` });
      load();
    } catch (e) {
      toast({ title: "Fehler", description: "Konnte nicht bestätigen.", variant: "destructive" });
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <h2 className="font-display text-xl text-foreground mb-1">Offene Zahlungen</h2>
      <p className="text-muted-foreground text-xs mb-4">Anfragen aus den Chats — bestätige, sobald das Geld da ist.</p>

      {loading ? (
        <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-6">Keine offenen Zahlungen</p>
      ) : (
        <div className="space-y-2">
          {items.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-elevated">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{tx.amount} {tx.currency || "EUR"} · {tx.type}</p>
                <p className="text-xs text-muted-foreground">{new Date(tx.created_date).toLocaleString("de-DE")}</p>
              </div>
              <button onClick={() => confirm(tx)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0">
                <Check className="w-3.5 h-3.5" /> Bestätigen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}