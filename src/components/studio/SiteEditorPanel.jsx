import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import StructureMap from "@/components/owner/StructureMap";
import PageDirectory from "@/components/owner/PageDirectory";
import MenuEditor from "@/components/owner/MenuEditor";
import { DEFAULT_MENU, loadLayout, saveLayout } from "@/lib/siteLayout";
import { defaultStructure, structureOf, structureMenu, applyMenu } from "@/lib/siteStructure";
import { clearStructureCache, loadStructure } from "@/lib/onboarding";

// Seiten und die Leiste oben an einer Stelle: die Karte zum Ziehen, die Liste
// jeder Seite und darunter das Menü in aller Ruhe. Erst beim Speichern gilt es
// für alle.
export default function SiteEditorPanel() {
  const [record, setRecord] = useState(null);
  const [structure, setStructure] = useState(() => defaultStructure(DEFAULT_MENU));
  const [items, setItems] = useState(DEFAULT_MENU);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadLayout()
      .then((row) => {
        setRecord(row);
        const saved = structureOf(row);
        setStructure(saved);
        setItems(structureMenu(saved));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setMenu = (next) => {
    setItems(next);
    setStructure((prev) => applyMenu(prev, next));
  };

  const save = async () => {
    setSaving(true);
    setNotice("");
    const nextItems = structureMenu(structure);
    try {
      const saved = await saveLayout(record, {
        navItems: nextItems,
        structure,
      });
      setRecord(saved);
      setItems(nextItems);
      clearStructureCache();
      await loadStructure();
      setNotice("Gespeichert — die Leiste sieht jetzt jeder so.");
    } catch (e) {
      setNotice("Speichern hat nicht geklappt. Versuch es nochmal.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="font-display text-2xl text-foreground">Seiten &amp; Leiste</p>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-3xl leading-relaxed">
            Zieh Bereiche und Knöpfe an ihren Griffen, benenne sie um und wähle, wohin ein Klick führt. Was du hier
            siehst, steht oben in der Kopfzeile — gespeichert wird es erst mit dem Knopf.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? "Speichere …" : "Speichern"}
        </button>
      </div>

      {notice && (
        <p className="glass rounded-xl border border-border px-4 py-3 text-[15px] font-bold text-primary mb-5">
          {notice}
        </p>
      )}

      <StructureMap
        structure={structure}
        onChange={(next) => {
          setStructure(next);
          setItems(structureMenu(next));
        }}
      />

      <div className="mt-5">
        <PageDirectory items={items} />
      </div>

      <div className="mt-5 glass rounded-2xl border border-border p-5">
        <p className="font-display text-xl text-foreground mb-1">Das Menü im Einzelnen</p>
        <p className="text-[15px] font-semibold text-muted-foreground mb-4">
          Dieselbe Leiste, einmal untereinander: umbenennen, umsortieren, ausblenden.
        </p>
        <MenuEditor items={items} onChange={setMenu} />
      </div>
    </div>
  );
}