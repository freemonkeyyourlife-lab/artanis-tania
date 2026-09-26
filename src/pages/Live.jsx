import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import { Radio, Video as VideoIcon } from "lucide-react";

export default function Live() {
  const [experiences, setExperiences] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [e, c] = await Promise.all([
        base44.entities.Experience.filter({ published: true }, "-created_date", 20),
        base44.entities.Creator.list(),
      ]);
      setExperiences(e);
      setCreators(c);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const liveExperiences = experiences.filter(e => e.experienceType === "LIVE");
  const onlineCreators = creators.filter(c => c.onlineStatus === "ONLINE" || c.onlineStatus === "LIVE" || c.onlineStatus === "AI_AVAILABLE");

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-2">Live</h1>
      <p className="text-muted-foreground text-sm mb-8">Real-time sessions and online creators</p>

      <section className="mb-10">
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-foreground flex items-center gap-2">
              <VideoIcon className="w-5 h-5 text-primary" /> Privater Video-Call
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Starte einen Video-Call und teile den Link, um jemanden einzuladen.</p>
          </div>
          <Link to="/call" className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap">Video-Call starten</Link>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary" /> Online Now
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {onlineCreators.map(c => (
            <Link key={c.id} to={c.personaType === "COUPLE" ? "/couple" : `/${c.stageName.toLowerCase().replace(/\s+/g, "")}`} className="group">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card aspect-video">
                <Image src={c.banner || c.avatar} fittingType="fill" className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute top-3 left-3"><StatusBadge status={c.onlineStatus} /></div>
                <div className="absolute bottom-0 p-4">
                  <h3 className="font-display text-lg text-foreground">{c.stageName}</h3>
                  <p className="text-sm text-muted-foreground">{c.tagline}</p>
                </div>
              </div>
            </Link>
          ))}
          {onlineCreators.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No creators online right now</p>}
        </div>
      </section>

      {liveExperiences.length > 0 && (
        <section>
          <h2 className="font-display text-xl text-foreground mb-4">Live Sessions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {liveExperiences.map(exp => (
              <Link key={exp.id} to="/interactive" className="group">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card aspect-video">
                  {exp.cover && <Image src={exp.cover} fittingType="fill" className="w-full h-full" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  <div className="absolute top-3 left-3"><StatusBadge experienceType={exp.experienceType} /></div>
                  <div className="absolute bottom-0 p-4">
                    <h3 className="font-display text-lg text-foreground">{exp.title}</h3>
                    <p className="text-sm text-muted-foreground">{exp.creatorName}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}