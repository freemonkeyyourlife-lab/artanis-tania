import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import { Sparkles } from "lucide-react";

export default function Interactive() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const data = await base44.entities.Experience.filter({ published: true }, "-created_date", 20);
      setExperiences(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-2">Interactive Experiences</h1>
      <p className="text-muted-foreground text-sm mb-8">Choose your path through branching interactive stories</p>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiences.map(exp => (
            <Link key={exp.id} to={`/experience/${exp.id}`} className="group">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card aspect-video">
                {exp.cover && <Image src={exp.cover} fittingType="fill" className="w-full h-full transition-transform group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute top-3 left-3"><StatusBadge experienceType={exp.experienceType} /></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full glass-strong flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-0 p-4">
                  <h3 className="font-display text-lg text-foreground">{exp.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>
                  <p className="text-xs text-primary mt-2">{exp.creatorName}</p>
                </div>
              </div>
            </Link>
          ))}
          {experiences.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No interactive experiences yet</p>}
        </div>
      )}
    </div>
  );
}