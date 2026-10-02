import React, { useEffect, useState } from "react";
import NavGroup from "@/components/nav/NavGroup";
import { getStructure, subscribeStructure, loadStructure } from "@/lib/onboarding";
import { getInfoMode, subscribeInfoMode } from "@/lib/infoMode";
import { FIXED_AREAS, ALWAYS_IN_MENU, MENU_AREA_LABEL } from "@/lib/modules";

// Die Kopfzeile hat vier Bereiche statt acht einzelner Knöpfe. Die festen
// Bereiche kommen aus der Seitenübersicht, damit es nur eine Quelle gibt.
const areaItems = (label) => FIXED_AREAS.find((a) => a.label === label)?.items || [];

const CHARACTER_ITEMS = areaItems("Charaktere");
const CREATE_ITEMS = areaItems("Selbst erstellen");
const ADMIN_ITEMS = areaItems("Verwaltung");

const CORE_EXPLORE = ALWAYS_IN_MENU;

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
    { label: MENU_AREA_LABEL, items: exploreItems(menuItems) },
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