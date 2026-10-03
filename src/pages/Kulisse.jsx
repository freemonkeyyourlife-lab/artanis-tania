import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Film, Loader2, ChevronRight } from "lucide-react";
import KulissePublic from "@/components/kulisse/KulissePublic";
import KulisseBackstage from "@/components/kulisse/KulisseBackstage";

// Das doppelte Archiv: vorne die Kulisse, hinten das, was wirklich dahintersteckt.
export default function Kulisse() {
  const [me, setMe] = useState(undefined);
  const [chars, setChars] = useState(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!me || me.role !== "admin") return;
    base44.entities.Character.filter({}, { sort: "stageName", limit: 200 }).then((res) => {
      const items = res.items || [];
      setChars(items);
      setActiveId((cur) => cur || items[0]?.id || null);
    });
  }, [me]);

  if (me === undefined || (me && me.role === "admin" && chars === null)) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!me || me.role !== "admin") {
    return (
      <div className="w-full px-4 lg:px-10 py-20 text-center">
        <h1 className="font-display text-2xl text-foreground">Nur für den Besitzer</h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2">Die Kulisse sieht nur der Admin.</p>
      </div>
    );
  }

  const active = (chars || []).find((c) => c.id === activeId) || null;

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-3">
          <Film className="w-8 h-8 text-primary" /> Die Kulisse
        </h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-4xl leading-relaxed">
          Jede Figur bekommt zwei Seiten: vorne, was die User sehen — hinten, was nur du weißt. Was du hinten
          beschreibst, ist gleichzeitig die Fassung, mit der ich arbeite.
        </p>
      </div>

      {!chars?.length ? (
        <div className="glass rounded-2xl border-2 border-border p-8 text-center">
          <p className="text-[15px] font-semibold text-muted-foreground">
            Es gibt noch keine Figuren. Leg zuerst im Studio eine an.
          </p>
          <Link
            to="/studio"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
          >
            Ins Studio
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[260px_1fr] gap-5">
          <div className="glass rounded-2xl border-2 border-border p-3 h-fit">
            <span className="block text-[12px] font-bold text-muted-foreground px-2 py-2">Figuren</span>
            <div className="space-y-1">
              {chars.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={
                    c.id === activeId
                      ? "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-primary/15 text-[14px] font-bold text-foreground text-left"
                      : "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[14px] font-semibold text-muted-foreground hover:text-foreground text-left"
                  }
                >
                  <span className="truncate">{c.stageName}</span>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {active && (
            <div className="grid xl:grid-cols-2 gap-5">
              <KulissePublic character={active} />
              <KulisseBackstage character={active} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}