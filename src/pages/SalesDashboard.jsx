import React from "react";
import { Link } from "react-router-dom";
import { Receipt, Plus } from "lucide-react";
import SalesOverview from "@/components/sales/SalesOverview";

export default function SalesDashboard() {
  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" /> Verkaufs-Dashboard
          </h1>
          <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-3xl leading-relaxed">
            Was eingegangen ist, was noch offen steht und wer bezahlt hat — dieselbe Ansicht wie in der Besitzer-Konsole.
          </p>
        </div>
        <Link
          to="/paylinks"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-sm font-semibold text-gloss"
        >
          <Plus className="w-4 h-4" /> Neuer Zahlungs-Link
        </Link>
      </div>

      <SalesOverview />
    </div>
  );
}