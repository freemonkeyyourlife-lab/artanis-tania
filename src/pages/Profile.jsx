import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Save, User } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefId, setPrefId] = useState(null);
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    interests: "",
    topicsToDiscuss: "",
    sexualPreferences: "",
    whatTheyWantToSee: "",
    fantasyDescription: ""
  });

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const user = await base44.auth.me();
      const existing = await base44.entities.UserPreference.filter({ userId: user.id });
      if (existing.length > 0) {
        const p = existing[0];
        setPrefId(p.id);
        setForm({
          displayName: p.displayName || user.full_name || "",
          bio: p.bio || "",
          interests: (p.interests || []).join("\n"),
          topicsToDiscuss: (p.topicsToDiscuss || []).join("\n"),
          sexualPreferences: (p.sexualPreferences || []).join("\n"),
          whatTheyWantToSee: p.whatTheyWantToSee || "",
          fantasyDescription: p.fantasyDescription || ""
        });
      } else {
        setForm(prev => ({ ...prev, displayName: user.full_name || "" }));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const user = await base44.auth.me();
      const data = {
        userId: user.id,
        displayName: form.displayName,
        bio: form.bio,
        interests: form.interests.split("\n").map(s => s.trim()).filter(Boolean),
        topicsToDiscuss: form.topicsToDiscuss.split("\n").map(s => s.trim()).filter(Boolean),
        sexualPreferences: form.sexualPreferences.split("\n").map(s => s.trim()).filter(Boolean),
        whatTheyWantToSee: form.whatTheyWantToSee,
        fantasyDescription: form.fantasyDescription
      };
      if (prefId) {
        await base44.entities.UserPreference.update(prefId, data);
      } else {
        const created = await base44.entities.UserPreference.create(data);
        setPrefId(created.id);
      }
      toast({ title: "Profile saved!", description: "Your preferences are now active in chat." });
    } catch (e) {
      toast({ title: "Error", description: "Could not save profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center"><User className="w-6 h-6 text-primary" /></div>
        <div>
          <h1 className="font-display text-2xl text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground">Tell us what you're into — the AI adapts to you</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Display Name</label>
          <input type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="How should we call you?" className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Interests (one per line)</label>
          <textarea value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder={"Exhibitionism\nOutdoor\nSwinging"} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Topics you want to discuss (one per line)</label>
          <textarea value={form.topicsToDiscuss} onChange={(e) => setForm({ ...form, topicsToDiscuss: e.target.value })} placeholder={"Public flashing\nPartner swapping\nFirst experiences"} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Your sexual preferences (one per line)</label>
          <textarea value={form.sexualPreferences} onChange={(e) => setForm({ ...form, sexualPreferences: e.target.value })} placeholder={"Rough sex\nEdging\nWatersports"} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">What do you want to see from us?</label>
          <textarea value={form.whatTheyWantToSee} onChange={(e) => setForm({ ...form, whatTheyWantToSee: e.target.value })} placeholder="Describe what content or experiences you'd love..." rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Your fantasies (the more detail, the better we adapt)</label>
          <textarea value={form.fantasyDescription} onChange={(e) => setForm({ ...form, fantasyDescription: e.target.value })} placeholder="Tell us your deepest fantasies..." rows={4} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:accent-glow transition-all">
          <Save className="w-4 h-4" /> Save Profile
        </button>
      </div>
    </div>
  );
}