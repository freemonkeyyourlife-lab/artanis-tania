import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Save, User, Upload, X } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function Profile() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userImages, setUserImages] = useState([]);
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
        setUserImages(p.userReferenceImages || []);
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

  const persistImages = async (user, next) => {
    if (prefId) {
      await base44.entities.UserPreference.update(prefId, { userReferenceImages: next });
    } else {
      const created = await base44.entities.UserPreference.create({ userId: user.id, userReferenceImages: next });
      setPrefId(created.id);
    }
  };

  const uploadImage = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const user = await base44.auth.me();
      const urls = [];
      for (const f of files) {
        const res = await base44.integrations.Core.UploadPublicFile({ file: f });
        urls.push(res.file_url);
      }
      const next = [...userImages, ...urls];
      await persistImages(user, next);
      setUserImages(next);
      toast({ title: "Bilder hinzugefügt", description: "Sie werden ab jetzt für deine Bilder im Chat verwendet." });
    } catch (err) {
      toast({ title: "Fehler", description: "Upload fehlgeschlagen.", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = async (url) => {
    try {
      const user = await base44.auth.me();
      const next = userImages.filter((u) => u !== url);
      await persistImages(user, next);
      setUserImages(next);
    } catch (err) { console.error(err); }
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
      toast({ title: "Profil gespeichert", description: "Deine Vorlieben sind jetzt im Chat aktiv." });
    } catch (e) {
      toast({ title: "Fehler", description: "Profil konnte nicht gespeichert werden.", variant: "destructive" });
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
          <h1 className="font-display text-2xl text-foreground">Mein Profil</h1>
          <p className="text-sm text-muted-foreground">Sag uns, worauf du stehst — die KI richtet sich danach</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Anzeigename</label>
          <input type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Wie sollen wir dich nennen?" className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Über mich</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Erzähl uns etwas über dich …" rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Interessen (eine pro Zeile)</label>
          <textarea value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder={"Exhibitionismus\nOutdoor\nSwinger"} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Themen, über die du reden willst (eins pro Zeile)</label>
          <textarea value={form.topicsToDiscuss} onChange={(e) => setForm({ ...form, topicsToDiscuss: e.target.value })} placeholder={"Öffentliches Zeigen\nPartnertausch\nErste Erfahrungen"} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Deine sexuellen Vorlieben (eine pro Zeile)</label>
          <textarea value={form.sexualPreferences} onChange={(e) => setForm({ ...form, sexualPreferences: e.target.value })} placeholder={"Hart\nLange hinziehen\nSpiele"} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Was willst du von uns sehen?</label>
          <textarea value={form.whatTheyWantToSee} onChange={(e) => setForm({ ...form, whatTheyWantToSee: e.target.value })} placeholder="Beschreib, welche Inhalte oder Erlebnisse du dir wünschst …" rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Deine Fantasien (je mehr Details, desto besser passen wir uns an)</label>
          <textarea value={form.fantasyDescription} onChange={(e) => setForm({ ...form, fantasyDescription: e.target.value })} placeholder="Erzähl uns deine tiefsten Fantasien …" rows={4} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Meine Bilder (werden für deine Bilder im Chat verwendet)</label>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Upload className="w-4 h-4" /> {uploading ? "Lädt …" : "Bilder hochladen"}
            <input type="file" accept="image/*" multiple onChange={uploadImage} className="hidden" />
          </label>
          {userImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {userImages.map((url) => (
                <div key={url} className="relative">
                  <Image src={url} fittingType="fill" className="w-20 h-20 rounded-xl" />
                  <button onClick={() => removeImage(url)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:accent-glow transition-all">
          <Save className="w-4 h-4" /> Profil speichern
        </button>
      </div>
    </div>
  );
}