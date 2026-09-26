import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User as UserIcon, Crown, Settings, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Account() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("de");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      setDisplayName(me.display_name || "");
      setLanguage(me.language || "de");
    } catch (e) {
      // Not logged in
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ display_name: displayName, language });
      toast({ title: "Einstellungen gespeichert" });
    } catch (e) {
      toast({ title: "Fehler", description: "Einstellungen konnten nicht gespeichert werden.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!user) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto rounded-full glass-strong flex items-center justify-center mb-6">
          <UserIcon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl text-foreground mb-2">Konto</h1>
        <p className="text-muted-foreground text-sm mb-6">Melde dich an, um dein Erlebnis anzupassen, Favoriten zu speichern und VIP-Inhalte zu sehen.</p>
        <a href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:accent-glow transition-all">Anmelden</a>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-2">Konto</h1>
      <p className="text-muted-foreground text-sm mb-8">Verwalte dein Profil und deine Einstellungen</p>

      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <h2 className="font-display text-xl text-foreground mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Profil</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Anzeigename</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Wähle einen Anzeigenamen" className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Sprache</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer">
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
          <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:accent-glow transition-all">Änderungen speichern</button>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 accent-glow mb-6">
        <Crown className="w-8 h-8 text-primary mb-3" />
        <h2 className="font-display text-xl text-foreground mb-2">VIP-Mitgliedschaft</h2>
        <p className="text-sm text-muted-foreground mb-4">{user.vip_status ? "Du bist VIP-Mitglied!" : "Hol dir VIP für exklusive Inhalte, private Räume und bevorzugte Wünsche."}</p>
        {!user.vip_status && <button className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:accent-glow-strong transition-all">VIP werden</button>}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl text-foreground mb-2">Konto</h2>
        <p className="text-sm text-muted-foreground mb-4">Melde dich ab, um das Konto zu wechseln.</p>
        <button
          onClick={() => base44.auth.logout("/")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-elevated border border-border text-sm font-medium text-foreground hover:border-destructive/50 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Abmelden
        </button>
      </div>
    </div>
  );
}