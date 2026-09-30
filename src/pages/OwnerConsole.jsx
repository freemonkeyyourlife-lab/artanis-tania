import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Save, Download, Upload, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import MenuEditor from "@/components/owner/MenuEditor";
import { DEFAULT_MENU, DEFAULT_FONT, loadLayout, saveLayout } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "menu", label: "Menü sortieren" },
  { id: "font", label: "Schrift" },
  { id: "access", label: "Zugang vergeben" },
  { id: "data", label: "Import / Export" },
];

export default function OwnerConsole() {
  const [me, setMe] = useState(undefined);
  const [tab, setTab] = useState("menu");
  const [record, setRecord] = useState(null);
  const [items, setItems] = useState(DEFAULT_MENU);
  const [font, setFont] = useState(DEFAULT_FONT);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [notice, setNotice] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!me || me.role !== "admin") return;
    loadLayout().then((row) => {
      setRecord(row);
      if (Array.isArray(row?.navItems) && row.navItems.length) setItems(row.navItems);
      setFont({
        size: row?.navFontSize || DEFAULT_FONT.size,
        weight: row?.navFontWeight || DEFAULT_FONT.weight,
        gap: row?.navGap ?? DEFAULT_FONT.gap,
      });
    });
  }, [me]);

  const save = async () => {
    setSaving(true);
    setNotice("");
    try {
      const saved = await saveLayout(record, {
        navItems: items,
        navFontSize: font.size,
        navFontWeight: font.weight,
        navGap: font.gap,
        ownerName: record?.ownerName || me?.full_name || "",
      });
      setRecord(saved);
      setNotice("Gespeichert.");
    } catch (e) {
      setNotice("Speichern hat nicht geklappt.");
    } finally {
      setSaving(false);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ navItems: items, ...font }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "artanis-layout.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data.navItems)) setItems(data.navItems);
        setFont({
          size: data.size || DEFAULT_FONT.size,
          weight: data.weight || DEFAULT_FONT.weight,
          gap: data.gap ?? DEFAULT_FONT.gap,
        });
        setNotice("Datei geladen — jetzt speichern.");
      } catch (e) {
        setNotice("Datei konnte nicht gelesen werden.");
      }
    };
    reader.readAsText(file);
  };

  const invite = async () => {
    setNotice("");
    if (!inviteEmail.trim()) return;
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      setNotice(`Einladung an ${inviteEmail.trim()} ist raus.`);
      setInviteEmail("");
    } catch (e) {
      setNotice("Einladung hat nicht geklappt.");
    }
  };

  if (me === undefined) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!me || me.role !== "admin") {
    return (
      <div className="max-w-[900px] mx-auto px-4 lg:px-8 py-20 text-center">
        <h1 className="font-display text-2xl text-foreground">Nur für den Besitzer</h1>
        <p className="text-muted-foreground text-sm mt-2">Diese Konsole sieht nur der Admin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Besitzer-Konsole</h1>
        <p className="text-muted-foreground text-sm">
          Menü sortieren, Schrift einstellen, Zugang vergeben, Einstellungen sichern.
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-full bg-elevated border border-border w-fit mb-6 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {notice && <p className="text-sm text-primary mb-4">{notice}</p>}

      {tab === "menu" && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-4">
            Ziehen zum Sortieren, umbenennen, ausblenden. Ausgeblendete Punkte verschwinden aus dem Menü.
          </p>
          <MenuEditor items={items} onChange={setItems} />
        </div>
      )}

      {tab === "font" && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground">Schriftgröße: {font.size}px</label>
            <input
              type="range"
              min={12}
              max={24}
              value={font.size}
              onChange={(e) => setFont({ ...font, size: Number(e.target.value) })}
              className="w-full mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Schriftstärke: {font.weight}</label>
            <input
              type="range"
              min={400}
              max={900}
              step={100}
              value={font.weight}
              onChange={(e) => setFont({ ...font, weight: Number(e.target.value) })}
              className="w-full mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Abstand zwischen den Knöpfen: {font.gap}px</label>
            <input
              type="range"
              min={0}
              max={24}
              value={font.gap}
              onChange={(e) => setFont({ ...font, gap: Number(e.target.value) })}
              className="w-full mt-2"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Vorschau: <span style={{ fontSize: font.size, fontWeight: font.weight }} className="text-foreground">Entdecken · Videos · Storys</span>
          </p>
        </div>
      )}

      {tab === "access" && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-4">
            Jemanden direkt freischalten — er bekommt eine Einladung per E-Mail.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="E-Mail"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 min-w-[220px]"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="h-10 rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
            >
              <option value="user">Nutzer</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={invite}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-sm font-semibold text-gloss"
            >
              <UserPlus className="w-4 h-4" /> Einladen
            </button>
          </div>
        </div>
      )}

      {tab === "data" && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-4">
            Deine Einstellungen als Datei sichern und wieder einlesen.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportJson}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-sm font-semibold text-foreground"
            >
              <Download className="w-4 h-4" /> Exportieren
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-sm font-semibold text-foreground"
            >
              <Upload className="w-4 h-4" /> Importieren
            </button>
            <input ref={fileRef} type="file" accept="application/json" onChange={importJson} className="hidden" />
          </div>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-sm font-semibold text-gloss disabled:opacity-50"
      >
        <Save className="w-4 h-4" /> {saving ? "Speichert …" : "Speichern"}
      </button>
    </div>
  );
}