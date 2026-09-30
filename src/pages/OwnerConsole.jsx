import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Save, Download, Upload, UserPlus, LayoutGrid, Type, KeyRound, Database, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import MenuEditor from "@/components/owner/MenuEditor";
import GuideBox from "@/components/owner/GuideBox";
import LageRow from "@/components/owner/LageRow";
import InviteBuilder from "@/components/owner/InviteBuilder";
import InviteList from "@/components/owner/InviteList";
import GoldmutAccess from "@/components/owner/GoldmutAccess";
import UserSwitcher from "@/components/owner/UserSwitcher";
import { DEFAULT_MENU, DEFAULT_FONT, loadLayout, saveLayout } from "@/lib/siteLayout";
import { DEFAULT_STRUCTURE, DEFAULT_INTRO_STEPS, DEFAULT_INTERESTS, DEFAULT_INFO, clearStructureCache, loadStructure } from "@/lib/onboarding";
import StructureEditor from "@/components/owner/StructureEditor";
import InfoTextEditor from "@/components/owner/InfoTextEditor";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "lage", label: "Lage", icon: LayoutGrid },
  { id: "menu", label: "Menü", icon: LayoutGrid },
  { id: "font", label: "Schrift", icon: Type },
  { id: "structure", label: "Struktur", icon: SlidersHorizontal },
  { id: "access", label: "Zugang", icon: KeyRound },
  { id: "data", label: "Sichern", icon: Database },
];

// Grün heißt: steht schon, du musst nichts tun. Gelb: kann so bleiben, ist aber
// noch leer. Rot: das fehlt dir wirklich.
const mark = (count, { required = true } = {}) =>
  count > 0 ? "done" : required ? "missing" : "open";

export default function OwnerConsole() {
  const [me, setMe] = useState(undefined);
  const [tab, setTab] = useState("lage");
  const [record, setRecord] = useState(null);
  const [items, setItems] = useState(DEFAULT_MENU);
  const [font, setFont] = useState(DEFAULT_FONT);
  const [structure, setStructure] = useState(DEFAULT_STRUCTURE);
  const [counts, setCounts] = useState(null);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteRefresh, setInviteRefresh] = useState(0);
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
      setStructure({
        introEnabled: row?.introEnabled !== false,
        infoEnabled: row?.infoEnabled !== false,
        introSteps: Array.isArray(row?.introSteps) && row.introSteps.length ? row.introSteps : DEFAULT_INTRO_STEPS,
        interestOptions: Array.isArray(row?.interestOptions) && row.interestOptions.length ? row.interestOptions : DEFAULT_INTERESTS,
        infoTexts: { ...DEFAULT_INFO, ...(row?.infoTexts || {}) },
      });
    });
  }, [me]);

  useEffect(() => {
    if (!me || me.role !== "admin") return;
    (async () => {
      try {
        const [creators, voices, contents, stories, streams, contests, users] = await Promise.all([
          base44.entities.Creator.list(),
          base44.entities.Voice.list(),
          base44.entities.Content.filter({ published: true }),
          base44.entities.Story.filter({ published: true }),
          base44.entities.LiveStream.list(),
          base44.entities.Contest.list(),
          base44.entities.User.list(),
        ]);
        setCounts({
          creators: creators.filter((c) => c.active !== false && c.stageName !== "Testdummy").length,
          voices: voices.length,
          contents: contents.length,
          stories: stories.length,
          streams: streams.length,
          contests: contests.length,
          users: users.length,
        });
      } catch (e) {
        setCounts({});
      }
    })();
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
        ...structure,
      });
      setRecord(saved);
      clearStructureCache();
      await loadStructure();
      setNotice("Gespeichert — die Änderungen sind jetzt live.");
    } catch (e) {
      setNotice("Speichern hat nicht geklappt. Versuch es nochmal.");
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
        setNotice("Datei geladen — jetzt unten auf Speichern drücken.");
      } catch (e) {
        setNotice("Die Datei konnte nicht gelesen werden.");
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
      setNotice("Die Einladung hat nicht geklappt.");
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
      <div className="w-full px-4 lg:px-10 py-20 text-center">
        <h1 className="font-display text-2xl text-foreground">Nur für den Besitzer</h1>
        <p className="text-muted-foreground text-[15px] font-semibold mt-2">Diese Konsole sieht nur der Admin.</p>
      </div>
    );
  }

  const c = counts || {};
  const rows = [
    {
      key: "menu",
      state: items.length > 0 ? "done" : "missing",
      label: "Menü oben",
      count: items.length,
      hint: "Die Knöpfe in der Kopfzeile. Steht schon — du musst nur ran, wenn dich Reihenfolge oder ein Name stört.",
      to: "/",
      reset: () => setItems(DEFAULT_MENU),
      resetTitle: "Menü auf Standard zurücksetzen",
    },
    {
      key: "font",
      state: record?.navFontSize ? "done" : "open",
      label: "Schrift im Menü",
      hint: `Größe ${font.size}px, Stärke ${font.weight}, Abstand ${font.gap}px. Steht schon — anfassen nur, wenn es dir zu klein oder zu dünn ist.`,
      to: "/",
      reset: () => setFont(DEFAULT_FONT),
      resetTitle: "Schrift auf Standard zurücksetzen",
    },
    {
      key: "users",
      state: counts ? mark((c.users || 0) - 1, { required: false }) : "open",
      label: "Zugang",
      count: counts ? Math.max(0, (c.users || 0) - 1) : undefined,
      hint: "So viele Leute sind außer dir drin. Noch niemand? Dann lade unten im Reiter Zugang jemanden ein.",
      to: "/admin",
    },
    {
      key: "creators",
      state: counts ? mark(c.creators) : "open",
      label: "Charaktere",
      count: c.creators,
      hint: "Deine Figuren. Ohne sie gibt es niemanden zu sehen — anlegen tust du sie im Studio.",
      to: "/studio",
    },
    {
      key: "voices",
      state: counts ? mark(c.voices) : "open",
      label: "Stimmen",
      count: c.voices,
      hint: "Die Stimmen aus der Stimmbank. Ohne sie klingt alles gleich — im Studio im Reiter Stimmbank.",
      to: "/studio",
    },
    {
      key: "contents",
      state: counts ? mark(c.contents, { required: false }) : "open",
      label: "Inhalte",
      count: c.contents,
      hint: "Was freigeschaltet ist und verkauft werden kann. Deine eigenen Sachen lädst du im Studio hoch.",
      to: "/studio",
    },
    {
      key: "stories",
      state: counts ? mark(c.stories, { required: false }) : "open",
      label: "Storys",
      count: c.stories,
      hint: "Geschichten zum Lesen. Darf leer bleiben, ist aber schöner mit.",
      to: "/studio",
    },
    {
      key: "streams",
      state: counts ? mark(c.streams, { required: false }) : "open",
      label: "Live-Streams",
      count: c.streams,
      hint: "Geplante oder laufende Übertragungen. Darf leer bleiben.",
      to: "/studio",
    },
    {
      key: "contests",
      state: counts ? mark(c.contests, { required: false }) : "open",
      label: "Wettbewerbe",
      count: c.contests,
      hint: "Laufende Wettbewerbe. Darf leer bleiben.",
      to: "/studio",
    },
  ];

  const missingCount = rows.filter((r) => r.state === "missing").length;

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss">Besitzer-Konsole</h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-4xl leading-relaxed">
          Hier siehst du auf einen Blick, was schon steht und was noch fehlt — und änderst nur das, was dich stört.
          Alles ist erklärt, damit du nichts auswendig wissen musst.
        </p>
      </div>

      <div className="glass flex flex-wrap gap-1 p-1.5 rounded-2xl border border-border w-fit mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[15px] font-bold whitespace-nowrap transition-colors",
                tab === t.id ? "glass-btn glass-btn-accent text-gloss" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {notice && (
        <p className="glass rounded-xl border border-border px-4 py-3 text-[15px] font-bold text-primary mb-5">{notice}</p>
      )}

      {tab === "lage" && (
        <>
          <GuideBox
            title="So liest du das"
            steps={[
              "Grüner Haken — das steht schon. Du musst hier nichts tun.",
              "Gelber Strich — das ist leer, aber es darf leer sein. Nur wenn du willst.",
              "Rotes Kreuz — das fehlt dir wirklich. Das solltest du als Nächstes machen.",
              "Das Auge rechts öffnet die Stelle, der Mülleimer setzt sie auf den Standard zurück.",
            ]}
          >
            {missingCount > 0
              ? `Es fehlt noch ${missingCount} ${missingCount === 1 ? "Sache" : "Sachen"} — rot markiert. Alles andere steht.`
              : "Alles Wesentliche steht. Du kannst dich zurücklehnen."}
          </GuideBox>

          <div className="glass rounded-2xl border border-border p-5">
            {rows.map((r) => (
              <LageRow
                key={r.key}
                state={r.state}
                label={r.label}
                count={r.count}
                hint={r.hint}
                to={r.to}
                onReset={r.reset}
                resetTitle={r.resetTitle}
              />
            ))}
          </div>
        </>
      )}

      {tab === "menu" && (
        <>
          <GuideBox
            title="Menü sortieren"
            steps={[
              "Am Griff links ziehen — so verschiebst du einen Eintrag nach oben oder unten.",
              "Name und Adresse kannst du direkt im Feld überschreiben.",
              "Das Auge öffnet die Seite, damit du siehst, wohin der Eintrag führt.",
              "Der Mülleimer löscht den Eintrag. Unten auf Speichern drücken — sonst bleibt alles wie es war.",
            ]}
          >
            Das ist die Leiste oben. Du musst hier nichts machen, außer dich stört etwas.
          </GuideBox>
          <div className="glass rounded-2xl border border-border p-5">
            <MenuEditor items={items} onChange={setItems} />
          </div>
        </>
      )}

      {tab === "font" && (
        <>
          <GuideBox
            title="Schrift im Menü"
            steps={[
              "Schriftgröße: wie groß die Knöpfe oben beschriftet sind.",
              "Schriftstärke: wie fett die Schrift ist. Höher heißt kräftiger.",
              "Abstand: wie viel Luft zwischen den Knöpfen ist.",
              "Unten siehst du sofort eine Vorschau. Danach speichern.",
            ]}
          >
            Damit es dir nicht in den Augen wehtut — stell es so ein, wie du es bequem findest.
          </GuideBox>
          <div className="glass rounded-2xl border border-border p-5 space-y-6">
            <div>
              <label className="text-[15px] font-bold text-foreground">Schriftgröße: {font.size}px</label>
              <input
                type="range"
                min={12}
                max={26}
                value={font.size}
                onChange={(e) => setFont({ ...font, size: Number(e.target.value) })}
                className="w-full mt-2 accent-[hsl(var(--primary))]"
              />
            </div>
            <div>
              <label className="text-[15px] font-bold text-foreground">Schriftstärke: {font.weight}</label>
              <input
                type="range"
                min={400}
                max={900}
                step={100}
                value={font.weight}
                onChange={(e) => setFont({ ...font, weight: Number(e.target.value) })}
                className="w-full mt-2 accent-[hsl(var(--primary))]"
              />
            </div>
            <div>
              <label className="text-[15px] font-bold text-foreground">Abstand zwischen den Knöpfen: {font.gap}px</label>
              <input
                type="range"
                min={0}
                max={24}
                value={font.gap}
                onChange={(e) => setFont({ ...font, gap: Number(e.target.value) })}
                className="w-full mt-2 accent-[hsl(var(--primary))]"
              />
            </div>
            <div className="glass rounded-xl border border-border p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Vorschau</p>
              <span style={{ fontSize: font.size, fontWeight: font.weight }} className="text-foreground">
                Entdecken · Videos · Storys · Live
              </span>
            </div>
          </div>
        </>
      )}

      {tab === "structure" && (
        <>
          <GuideBox
            title="Was die Besucher sehen"
            steps={[
              "Begrüßung: die Erklärung, die jeder Neue am Anfang bekommt. Aus heißt: er landet direkt in der App.",
              "Info-Knöpfe: das kleine i an den Bereichen. Aus heißt: nirgends mehr zu sehen.",
              "Die Texte darunter kannst du frei überschreiben — jeder Block ist eine Seite der Begrüßung.",
              "Danach unten auf Speichern. Es gilt sofort für alle.",
            ]}
          >
            Hier drehst du die Schalter für die Begrüßung und die Erklärungen — und schreibst die Texte selbst.
          </GuideBox>
          <StructureEditor value={structure} onChange={setStructure} />
          <div className="mt-5">
            <InfoTextEditor value={structure} onChange={setStructure} />
          </div>
        </>
      )}

      {tab === "access" && (
        <>
          <GuideBox
            title="Zugang vergeben — zwei Wege"
            steps={[
              "Einladung anlegen: Du brauchst dafür keine E-Mail-Adresse. Du bekommst einen Link, einen kurzen Code und einen QR-Code — alle drei führen auf denselben Zugang.",
              "Weitergeben: Link kopieren, per WhatsApp oder SMS schicken, per E-Mail versenden, den Code vorlesen oder den QR-Code zeigen. Such dir aus, was gerade passt.",
              "Der Gast löst sie ein, indem er den Link öffnet oder den Code auf seiner Konto-Seite eintippt. Danach ist sein Zugang sofort frei.",
              "Nur der letzte Weg unten braucht wirklich eine E-Mail-Adresse — damit bekommt jemand direkt ein Konto und setzt selbst sein Passwort.",
            ]}
          >
            Eine Einladung ist der Schlüssel zum Reinkommen — für genau die Leute, die du dabeihaben willst. Ohne sie kommt niemand rein.
          </GuideBox>

          <InviteBuilder onCreated={() => setInviteRefresh((n) => n + 1)} />

          <div className="mt-5">
            <GoldmutAccess />
          </div>

          <div className="mt-5">
            <UserSwitcher me={me} />
          </div>

          <div className="mt-5">
            <InviteList refreshKey={inviteRefresh} />
          </div>

          <div className="glass rounded-2xl border border-border p-5 mt-5">
            <p className="font-display text-xl text-foreground mb-1">Direkt per E-Mail freischalten</p>
            <p className="text-[15px] font-semibold text-muted-foreground mb-4">
              Braucht als Einziges wirklich eine E-Mail-Adresse: die Person bekommt sofort ein Konto und legt ihr Passwort selbst fest.
            </p>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="E-Mail-Adresse"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 min-w-[240px] h-11 text-[15px] font-semibold"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="h-11 rounded-xl border border-input bg-transparent px-3 text-[15px] font-semibold text-foreground"
              >
                <option value="user">Nutzer</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={invite}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss"
              >
                <UserPlus className="w-4 h-4" /> Einladen
              </button>
            </div>
            <p className="text-[13px] font-semibold text-muted-foreground mt-3">
              Aktuell drin: {counts ? Math.max(0, (c.users || 0) - 1) : "…"} außer dir.
            </p>
          </div>
        </>
      )}

      {tab === "data" && (
        <>
          <GuideBox
            title="Sichern und zurückholen"
            steps={[
              "Exportieren lädt eine Datei mit deinem Menü und deinen Schrift-Einstellungen herunter.",
              "Importieren liest so eine Datei wieder ein.",
              "Nach dem Import unten auf Speichern drücken, sonst gilt die alte Fassung weiter.",
            ]}
          >
            Damit du deine Einstellungen nie verlierst — oder sie auf einen Schlag zurückbekommst.
          </GuideBox>
          <div className="glass rounded-2xl border border-border p-5">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportJson}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground"
              >
                <Download className="w-4 h-4" /> Exportieren
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground"
              >
                <Upload className="w-4 h-4" /> Importieren
              </button>
              <input ref={fileRef} type="file" accept="application/json" onChange={importJson} className="hidden" />
            </div>
          </div>
        </>
      )}

      <div className="glass sticky bottom-4 mt-6 rounded-2xl border border-border p-4 flex flex-wrap items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Speichert …" : "Speichern"}
        </button>
        <p className="text-[15px] font-semibold text-muted-foreground">
          Änderungen gelten erst, wenn du hier drückst.
        </p>
      </div>
    </div>
  );
}