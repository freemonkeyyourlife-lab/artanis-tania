import React, { useEffect, useState } from "react";
import NavGroup from "@/components/nav/NavGroup";
import { getStructure, subscribeStructure, loadStructure } from "@/lib/onboarding";
import { getInfoMode, subscribeInfoMode } from "@/lib/infoMode";

// Die Kopfzeile hat vier Bereiche statt acht einzelner Knöpfe.
// „Erleben" ist der Menüpunkt-Block, den du in der Besitzer-Konsole sortierst.
const CHARACTER_ITEMS = [
  { label: "Artanis", path: "/artanis" },
  { label: "Triania", path: "/triania" },
  { label: "Couple", path: "/couple" },
];

const CREATE_ITEMS = [
  { label: "Studio", path: "/studio" },
  { label: "Dockingstation", path: "/dock" },
  { label: "Kasse", path: "/paylinks" },
];

const ADMIN_ITEMS = [
  { label: "Verwaltung", path: "/admin" },
  { label: "Leitstand", path: "/leitstand" },
  { label: "Besitzer-Konsole", path: "/owner" },
];

// Diese Punkte hängen immer unter „Erleben" — auch wenn im eigenen Menü
// gerade keiner davon steht. Sonst verschwindet dir ein Bereich unbemerkt.
const CORE_EXPLORE = [
  { label: "Nachrichten", path: "/messages" },
  { label: "Sprechstunde", path: "/therapy" },
  { label: "Wettbewerbe", path: "/contests" },
  { label: "Live", path: "/live" },
  { label: "Interaktiv", path: "/interactive" },
  { label: "Entdecken", path: "/explore" },
];

const exploreItems = (menuItems) =>
  menuItems.length
    ? [...menuItems, ...CORE_EXPLORE.filter((c) => !menuItems.some((m) => m.path === c.path))]
    : CORE_EXPLORE;

// Kein Eintrag taucht zweimal auf — auch wenn dein Menü einen Punkt enthält,
// der schon in einem anderen Block steht.
export function buildNavGroups(menuItems = []) {
  const seen = new Set();
  const groups = [
    { label: "Charaktere", items: CHARACTER_ITEMS },
    { label: "Selbst erstellen", items: CREATE_ITEMS },
    { label: "Erleben", items: exploreItems(menuItems) },
    { label: "Verwaltung", items: ADMIN_ITEMS },
  ];
  return groups
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => {
        if (seen.has(item.path)) return false;
        seen.add(item.path);
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

const GROUP_KEY = {
  "Charaktere": "characters",
  "Selbst erstellen": "create",
  "Erleben": "explore",
  "Verwaltung": "admin",
};

export default function HeaderNav({ groups, font, waitingChats = 0 }) {
  const [structure, setStructure] = useState(getStructure());
  const [infoOn, setInfoOn] = useState(getInfoMode());

  useEffect(() => subscribeStructure(setStructure), []);
  useEffect(() => subscribeInfoMode(setInfoOn), []);
  useEffect(() => {
    loadStructure();
  }, []);

  const showInfo = structure.infoEnabled !== false && infoOn;

  return (
    <nav
      className="hidden lg:flex items-center"
      style={{ gap: `${font.gap}px`, fontSize: `${font.fontSize}px`, fontWeight: font.fontWeight }}
    >
      {groups.map((group) => (
        <NavGroup
          key={group.label}
          group={group}
          waitingChats={waitingChats}
          showInfo={showInfo}
          info={structure.infoTexts?.[`group_${GROUP_KEY[group.label] || ""}`] || ""}
        />
      ))}
    </nav>
  );
}