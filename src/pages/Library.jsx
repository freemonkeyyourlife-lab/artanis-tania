import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, Library as LibIcon } from "lucide-react";
import ContentCard from "@/components/ContentCard";
import PersonaCard from "@/components/PersonaCard";
import { getFavorites } from "@/lib/favorites";

export default function Library() {
  const [content, setContent] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [c, cr] = await Promise.all([
        base44.entities.Content.filter({ published: true }, "-created_date", 100),
        base44.entities.Creator.list(),
      ]);
      setContent(c);
      setCreators(cr);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const update = () => setFavorites(getFavorites());
    update();
    window.addEventListener("favorite-toggled", update);
    return () => window.removeEventListener("favorite-toggled", update);
  }, []);

  const favContent = content.filter(c => favorites.includes(`content:${c.id}`));
  const favCreators = creators.filter(c => favorites.includes(`creator:${c.id}`));

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-2">Meine Bibliothek</h1>
      <p className="text-muted-foreground text-sm mb-8">Deine gemerkten Inhalte und Charaktere</p>

      <section className="mb-10">
        <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" /> Favorite Creators
        </h2>
        {favCreators.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {favCreators.map(c => <PersonaCard key={c.id} creator={c} />)}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-border bg-card text-center">
            <p className="text-muted-foreground text-sm">No favorite creators yet. Tap the heart on any creator to add them here.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
          <LibIcon className="w-5 h-5 text-primary" /> Favorite Content
        </h2>
        {favContent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favContent.map(c => <ContentCard key={c.id} content={c} />)}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-border bg-card text-center">
            <p className="text-muted-foreground text-sm">No favorite content yet. Tap the heart on any content to save it here.</p>
          </div>
        )}
      </section>
    </div>
  );
}