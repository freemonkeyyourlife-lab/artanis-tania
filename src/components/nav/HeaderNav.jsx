import React, { useEffect, useState } from "react";
import NavGroup from "@/components/nav/NavGroup";
import { getStructure, subscribeStructure, loadStructure } from "@/lib/onboarding";
import { getInfoMode, subscribeInfoMode } from "@/lib/infoMode";
import { FIXED_AREAS, ALWAYS_IN_MENU, MENU_AREA_LABEL, groupNavItems } from "@/lib/modules";
import { tierForPath, TIER } from "@/lib/accessTiers";

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
  const take = (items) =>
    (items || []).filter((item) => {
      if (!item || !item.path || seen.has(item.path)) return false;
      seen.add(item.path);
      return true;
    });

  // Was nur mit Rechten erreichbar ist, wird aus dem offenen Bereich
  // herausgezogen und gesammelt hinter „Verwaltung" gestellt — dort trägt es
  // den gelben Rand.
  const menu = exploreItems(menuItems);
  const userItems = menu.filter((i) => tierForPath(i.path) === TIER.USER);
  const restricted = menu.filter((i) => tierForPath(i.path) !== TIER.USER);

  const groups = [
    { label: "Charaktere", items: take(CHARACTER_ITEMS), tier: TIER.USER },
    { label: MENU_AREA_LABEL, items: take(userItems), tier: TIER.USER },
    {
      label: "Verwaltung",
      items: take([...ADMIN_ITEMS, ...CREATE_ITEMS, ...restricted]),
      tier: TIER.ADMIN,
    },
  ];

  return groups
    .map((group) => ({ ...group, groups: groupNavItems(group.items) }))
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