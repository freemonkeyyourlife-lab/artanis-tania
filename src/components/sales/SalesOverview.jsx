import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import SalesStats from "@/components/sales/SalesStats";
import SalesChart from "@/components/sales/SalesChart";
import SalesCustomers from "@/components/sales/SalesCustomers";
import SalesList from "@/components/sales/SalesList";
import { bucketKey, monthLabel, rowFor } from "@/lib/sales";

// Die Auswertung selbst — dieselbe Ansicht auf der Seite und in der Konsole.
export default function SalesOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [statusRes, typeRes, monthRes, recentRes, customerRes] = await Promise.all([
        base44.entities.PaymentLink.aggregate({ query: {}, groupBy: "status", sum: ["amount"] }),
        base44.entities.PaymentLink.aggregate({
          query: { status: "PAID" },
          groupBy: "billingType",
          sum: ["amount"],
        }),
        base44.entities.PaymentLink.aggregate({
          query: { status: "PAID" },
          dateBucket: { field: "paidAt", unit: "month" },
          sum: ["amount"],
        }),
        base44.entities.PaymentLink.filter({ status: "PAID" }, { sort: "-paidAt", limit: 20 }),
        base44.entities.PaymentLink.aggregate({
          query: { status: "PAID" },
          groupBy: "targetName",
          sum: ["amount"],
          sort: "-sum_amount",
          limit: 6,
        }),
      ]);

      const statusRows = statusRes.rows || [];
      const paid = rowFor(statusRows, "status", "PAID");
      const open = rowFor(statusRows, "status", "OPEN");
      const typeRows = typeRes.rows || [];
      const oneTime = rowFor(typeRows, "billingType", "ONE_TIME");
      const recurring = rowFor(typeRows, "billingType", "RECURRING");

      setData({
        totals: {
          revenue: paid.sum_amount || 0,
          paidCount: paid.count || 0,
          openAmount: open.sum_amount || 0,
          openCount: open.count || 0,
          oneTimeAmount: oneTime.sum_amount || 0,
          oneTimeCount: oneTime.count || 0,
          recurringAmount: recurring.sum_amount || 0,
          recurringCount: recurring.count || 0,
        },
        months: (monthRes.rows || []).map((r) => ({
          label: monthLabel(bucketKey(r, "paidAt")),
          amount: r.sum_amount || 0,
        })),
        payments: recentRes.items || [],
        customers: (customerRes.rows || [])
          .filter((r) => r.targetName)
          .map((r) => ({ name: r.targetName, amount: r.sum_amount || 0, count: r.count || 0 })),
      });
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

  if (!data) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Die Zahlen konnten nicht geladen werden.</p>;
  }

  return (
    <div className="space-y-6">
      <SalesStats totals={data.totals} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart months={data.months} />
        </div>
        <SalesCustomers customers={data.customers} />
      </div>
      <SalesList payments={data.payments} />
    </div>
  );
}