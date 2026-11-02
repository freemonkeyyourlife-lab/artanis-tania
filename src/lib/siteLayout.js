import { base44 } from "@/api/base44Client";

// Die Standard-Menüpunkte. Der Besitzer kann sie sortieren, umbenennen,
// ausblenden und eigene dazulegen — gespeichert wird das in SiteLayout.
export const DEFAULT_MENU = [
  { id: "paylinks", label: "Kasse", path: "/paylinks", hidden: false },
  { id: "verkauf", label: "Verkaufs-Dashboard", path: "/verkauf", hidden: false },
  { id: "therapy", label: "Sprechstunde", path: "/therapy", hidden: false },
  { id: "request", label: "Wünsche", path: "/request", hidden: false },
  { id: "explore", label: "Entdecken", path: "/explore", hidden: false },
  { id: "videos", label: "Videos", path: "/videos", hidden: false },
  { id: "photos", label: "Fotos", path: "/photos", hidden: false },
  { id: "stories", label: "Storys", path: "/stories", hidden: false },
  { id: "topics", label: "Themen", path: "/topics", hidden: false },
  { id: "live", label: "Live", path: "/live", hidden: false },
  { id: "interactive", label: "Interaktiv", path: "/interactive", hidden: false },
  { id: "groups", label: "Gruppen", path: "/groups", hidden: false },
  { id: "community", label: "Community", path: "/community", hidden: false },
  { id: "coins", label: "Börse", path: "/coins", hidden: false },
  { id: "library", label: "Bibliothek", path: "/library", hidden: false },
  { id: "planung", label: "Content-Planer", path: "/planung", hidden: false },
  { id: "owner", label: "Besitzer-Konsole", path: "/owner", hidden: false },
  { id: "vorleser", label: "Vorleser", path: "/vorleser", hidden: false },
  { id: "hilfe", label: "Hilfe & Wegweiser", path: "/hilfe", hidden: false },
];

export const DEFAULT_FONT = { size: 15, weight: 700, gap: 8 };

export async function loadLayout() {
  const rows = await base44.entities.SiteLayout.list("-updated_date", 1);
  return rows[0] || null;
}

export async function saveLayout(record, data) {
  if (record?.id) return base44.entities.SiteLayout.update(record.id, data);
  return base44.entities.SiteLayout.create(data);
}

export const layoutFont = (record) => ({
  fontSize: record?.navFontSize || DEFAULT_FONT.size,
  fontWeight: record?.navFontWeight || DEFAULT_FONT.weight,
  gap: record?.navGap ?? DEFAULT_FONT.gap,
});

export const layoutMenu = (record) => {
  const items = Array.isArray(record?.navItems) && record.navItems.length ? record.navItems : DEFAULT_MENU;
  return items.filter((i) => i && i.path && !i.hidden);
};