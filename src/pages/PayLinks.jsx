import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Coins, Plus, X } from "lucide-react";
import PaymentLinkForm from "@/components/pay/PaymentLinkForm";
import PaymentLinkCard from "@/components/pay/PaymentLinkCard";
import PayMessageTemplate from "@/components/pay/PayMessageTemplate";
import PaketGrid from "@/components/pay/PaketGrid";

export default function PayLinks() {
  const [mine, setMine] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const user = await base44.auth.me().catch(() => null);
      setMe(user);
      const [own, open] = await Promise.all([
        user ? base44.entities.PaymentLink.filter({ creatorId: user.id }, "-created_date", 50) : Promise.resolve([]),
        base44.entities.PaymentLink.filter({ visibility: "PUBLIC", status: "OPEN" }, "-created_date", 30),
      ]);
      setMine(own);
      setTasks(open.filter((t) => !user || t.creatorId !== user.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const openLinks = mine.filter((l) => l.status === "OPEN");
  const paidLinks = mine.filter((l) => l.status !== "OPEN");

  return (
    <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-8">
      <div className="mb-6">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-primary mb-2">Kasse</p>
        <h1 className="font-display text-3xl text-foreground">Zahlungen & Aufgaben</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Betrag festlegen, Link kopieren, verschicken — der andere zahlt per Karte. Oder du legst eine Aufgabe mit
          Preis an, die jeder aus der Kasse übernehmen kann.
        </p>
      </div>

      <PayMessageTemplate onCreated={load} />

      <section className="mb-10">
        <h2 className="font-display text-xl text-foreground mb-1">VIP-Stufen & PPV-Kapitel</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          Bezahl direkt per Karte (mit und ohne 3D Secure), scanne den QR-Code oder schick den Link per SMS.
        </p>
        <PaketGrid />
      </section>

      <div className="flex flex-wrap gap-3 mb-8">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Neuer Link / neue Aufgabe
          </button>
        ) : (
          <div className="w-full max-w-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">Neu anlegen</p>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <PaymentLinkForm onCreated={load} />
            </div>
          </div>
        )}
        <Link
          to="/coins"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground"
        >
          <Coins className="w-4 h-4" /> Coins & Guthaben
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="font-display text-xl text-foreground mb-3">Offene Links</h2>
        {openLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nichts offen.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openLinks.map((l) => (
              <PaymentLinkCard key={l.id} link={l} own onChanged={load} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl text-foreground mb-3">Offene Aufgaben</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Gerade keine Aufgaben ausgeschrieben.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((l) => (
              <PaymentLinkCard key={l.id} link={l} onChanged={load} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl text-foreground mb-3">Abgeschlossen</h2>
        {paidLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch nichts bezahlt worden.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paidLinks.map((l) => (
              <PaymentLinkCard key={l.id} link={l} own onChanged={load} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}