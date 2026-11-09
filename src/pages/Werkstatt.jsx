import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Lock, Cpu, Images, Boxes, Mic, Wand2, Users } from "lucide-react";
import FabrikForm from "@/components/werkstatt/FabrikForm";
import CharakterCanvas from "@/components/werkstatt/CharakterCanvas";

// Private Werkstatt — abgetrennt vom öffentlichen App-Verkehr. Nur für die
// Besitzerin: hier Charaktere als Fabrik anlegen und die Kachel-Leinwand
// im Bearbeitungsmodus frei sortieren.

const ACTIONS = [
  { key: "train", label: "Training", to: "/trainingsset", icon: Cpu },
  { key: "archiv", label: "Galerie / Archiv", to: "/archiv", icon: Images },
  { key: "baukasten", label: "Baukasten", to: "/baukasten", icon: Boxes },
  { key: "stimmen", label: "Stimmen", to: "/stimmen", icon: Mic },
  { key: "charakter", label: "Charaktere", to: "/charakter", icon: Users },
  { key: "fabrik", label: "Fabrik", to: "/werkstatt", icon: Wand2 },
];

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

      {loading && <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Lade Charaktere …</div>}
    </div>
  );
}