import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Loader2, Lock, Cpu, Images, Boxes, Mic, Wand2, Users,
  Home, Compass, Film, Image as ImageIcon, BookOpen, Hash, Radio, Gamepad2,
  UsersRound, HeartPulse, Coins, Bookmark, MessageSquare, Stethoscope, Gift,
  CalendarDays, ShoppingCart, BarChart3, Trophy, Settings, LifeBuoy, Megaphone,
  LayoutGrid, Star, User, GraduationCap, BookText, Network, FlaskConical,
} from "lucide-react";
import FabrikForm from "@/components/werkstatt/FabrikForm";
import CharakterCanvas from "@/components/werkstatt/CharakterCanvas";
import WerkstattSpiel from "@/components/werkstatt/WerkstattSpiel";
import { FIXED_AREAS } from "@/lib/modules";
import { DEFAULT_MENU } from "@/lib/siteLayout";

// Private Werkstatt — abgetrennt vom öffentlichen App-Verkehr. Nur für die
// Besitzerin: hier Charaktere als Fabrik anlegen und die Kachel-Leinwand
// im Bearbeitungsmodus frei sortieren.

// Ikonen für die Menüpunkte — was keinen festen Icon bekommt, bekommt Raster.
const ICON_BY_PATH = {
  "/": Home, "/artanis": Star, "/tania": Star, "/couple": Star,
  "/studio": Wand2, "/werkstatt": Wand2, "/ideen": BookText, "/externes-studio": ImageIcon,
  "/stimmen": Mic, "/baukasten": Boxes, "/dock": Network, "/planung": CalendarDays,
  "/paylinks": ShoppingCart, "/prompt": FlaskConical, "/banana": FlaskConical,
  "/palette": Boxes, "/chatmodul": MessageSquare, "/erzaehler": Megaphone,
  "/trainingsset": Cpu, "/hilfe": LifeBuoy, "/vorleser": Megaphone,
  "/explore": Compass, "/videos": Film, "/photos": ImageIcon, "/stories": BookOpen,
  "/topics": Hash, "/live": Radio, "/interactive": Gamepad2, "/groups": UsersRound,
  "/community": UsersRound, "/contests": Trophy, "/messages": MessageSquare,
  "/therapy": Stethoscope, "/request": Gift, "/library": Bookmark, "/coins": Coins,
  "/account": User, "/tutorial": GraduationCap, "/anleitung": BookOpen,
  "/archiv": Images, "/admin": Settings, "/leitstand": Settings, "/owner": Settings,
  "/struktur": LayoutGrid, "/logbuch": BookOpen, "/sandbox": LayoutGrid,
  "/vorschau": LayoutGrid, "/modellplan": Cpu, "/leitfaden": BookOpen,
  "/lernordner": BookOpen, "/spickzettel": BookOpen, "/story-dashboard": BarChart3,
  "/verkauf": BarChart3, "/creator-studio": Wand2,
};
const iconFor = (path) => ICON_BY_PATH[path] || LayoutGrid;

// Das ganze Dashboard als Kacheln: Charaktere-Bereich, „Selbst erstellen",
// Verwaltung und dein Menü — alles frei anordnen, skalieren, löschen.
const ACTIONS = (() => {
  const out = [];
  const seen = new Set();
  const add = (path, label) => {
    const key = "nav-" + path;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ key, label, to: path, icon: iconFor(path) });
  };
  FIXED_AREAS.forEach((a) => a.items.forEach((it) => add(it.path, it.label)));
  DEFAULT_MENU.forEach((m) => add(m.path, m.label));
  add("/sammelgalerie", "Sammel-Galerie");
  return out;
})();

export default function Werkstatt() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Character.filter({}, "-created_date", 60);
      setCharacters(Array.isArray(list) ? list : []);
    } catch { setCharacters([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null)).finally(() => setMeLoading(false));
    load();
  }, []);

  if (meLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (!me || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-2xl text-foreground">Nur für dich</h1>
        <p className="mt-2 text-sm text-muted-foreground">Die Werkstatt ist dein privater Raum — melde dich als Besitzerin an.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-4xl text-foreground text-gloss">Werkstatt</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dein privater Raum, abseits des lauten App-Verkehrs. Hier baust du Charaktere ungestört und ordnest deine Kacheln frei.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 items-start">
        <FabrikForm onCreated={(c) => { setCharacters((cs) => [c, ...cs]); }} />
        <CharakterCanvas
          characters={characters}
          actions={ACTIONS}
          onOpenCharacter={(id) => navigate(`/charakter/${id}`)}
        />
      </div>

      <div className="mt-4">
        <WerkstattSpiel characters={characters} />
      </div>

      {loading && <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Lade Charaktere …</div>}
    </div>
  );
}