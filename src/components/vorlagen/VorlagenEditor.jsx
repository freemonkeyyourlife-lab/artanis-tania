import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Loader2, Save, MessageSquare } from "lucide-react";

const PURPOSES = [
  { value: "MEDIEN", label: "Medien", hint: "Videos, Audios, Bilder — verlinkt aus vorhandenem Material." },
  { value: "CHAT", label: "Chat-Verweis", hint: "Verweist auf bestehende Chats aus deinen Nachrichten." },
  { value: "VORSTELLUNG", label: "Vorstellung", hint: "Eine freie Idee, ein Bild im Kopf — als Text." },
  { value: "KOMBI", label: "Kombi", hint: "Medien, Chats und Vorstellung zusammen — ein komplettes Paket." },
];

const KINDS = [
  { value: "VIDEO", label: "Video" },
  { value: "AUDIO", label: "Audio" },
  { value: "BILD", label: "Bild" },
];

// Editor für neue Vorlagen: vorhandenes Material verlinken (Videos, Audios,
// Bilder), auf Chats verweisen, eine freie Vorstellung schreiben — oder alles
// zusammen als Kombi. Kein Upload: nur Links auf bereits vorhandenes Material.
export default function VorlagenEditor({ open, onClose, onSaved }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("MEDIEN");
  const [media, setMedia] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [vorstellung, setVorstellung] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(""); setPurpose("MEDIEN"); setMedia([]); setChats([]);
    setVorstellung(""); setNote("");
    (async () => {
      setLoadingChats(true);
      try {
        const me = await base44.auth.me().catch(() => null);
        if (!me) return;
        const list = await base44.entities.Conversation.filter({ userId: me.id }, "-lastMessageAt", 60);
        setChatList(list);
      } catch { /* noch keine Chats */ } finally { setLoadingChats(false); }
    })();
  }, [open]);

  const showMedia = purpose === "MEDIEN" || purpose === "KOMBI";
  const showChats = purpose === "CHAT" || purpose === "KOMBI";
  const showText = purpose === "VORSTELLUNG" || purpose === "KOMBI";

  const addMedia = () => setMedia((m) => [...m, { kind: "VIDEO", url: "", title: "" }]);
  const setMediaAt = (i, patch) => setMedia((m) => m.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeMedia = (i) => setMedia((m) => m.filter((_, idx) => idx !== i));

  const toggleChat = (c) => {
    const label = c.participantName || c.creatorName || "Chat";
    setChats((prev) => (prev.some((x) => x.id === c.id) ? prev.filter((x) => x.id !== c.id) : [...prev, { id: c.id, label }]));
  };

  const save = async () => {
    const n = name.trim();
    if (!n) { toast({ title: "Name fehlt", description: "Gib der Vorlage einen Namen." }); return; }
    const cleanMedia = media.filter((m) => m.url.trim());
    if (purpose === "MEDIEN" && cleanMedia.length === 0) {
      toast({ title: "Keine Medien", description: "Füge mindestens einen Link hinzu." }); return;
    }
    if (purpose === "CHAT" && chats.length === 0) {
      toast({ title: "Kein Chat", description: "Wähle mindestens einen Chat." }); return;
    }
    if (purpose === "VORSTELLUNG" && !vorstellung.trim()) {
      toast({ title: "Keine Vorstellung", description: "Schreib deine Idee ins Feld." }); return;
    }
    setSaving(true);
    try {
      await base44.entities.SzenenVorlage.create({
        name: n,
        purpose,
        note: note.trim(),
        media: cleanMedia,
        chats,
        vorstellung: vorstellung.trim(),
      });
      toast({ title: "Vorlage gespeichert", description: `„${n}" steht in der Bibliothek.` });
      onSaved?.();
      onClose?.();
    } catch (e) {
      toast({ variant: "destructive", title: "Speichern fehlgeschlagen", description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-lg text-foreground mb-1">Neue Vorlage</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Bündle vorhandenes Material — Videos, Audios, Bilder, Chats oder eine freie Vorstellung. Alles per Link, kein Upload.
        </p>

        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Name</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Sturm-Session, Kuschel-Kombi"
              className="w-full px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Was bündelt die Vorlage?</p>
            <div className="flex flex-wrap gap-2">
              {PURPOSES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPurpose(p.value)}
                  title={p.hint}
                  className={cn(
                    "px-3.5 py-2 rounded-full border text-sm transition-colors",
                    purpose === p.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-elevated border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{PURPOSES.find((p) => p.value === purpose)?.hint}</p>
          </div>

          {showMedia && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Medien-Links</p>
                <button onClick={addMedia} type="button" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Link hinzufügen
                </button>
              </div>
              {media.length === 0 ? (
                <p className="text-xs text-muted-foreground">Noch keine Links. Füge Videos, Audios oder Bilder aus vorhandenem Material hinzu.</p>
              ) : (
                <div className="space-y-2">
                  {media.map((m, i) => (
                    <div key={i} className="flex flex-wrap gap-2 items-center rounded-xl bg-background/60 p-2">
                      <select
                        value={m.kind}
                        onChange={(e) => setMediaAt(i, { kind: e.target.value })}
                        className="px-2.5 py-2 rounded-full bg-elevated border border-border text-xs text-foreground"
                      >
                        {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                      </select>
                      <input
                        value={m.url}
                        onChange={(e) => setMediaAt(i, { url: e.target.value })}
                        placeholder="https://… Link zum Video / Audio / Bild"
                        className="flex-1 min-w-[180px] px-3 py-2 rounded-full bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                      />
                      <input
                        value={m.title}
                        onChange={(e) => setMediaAt(i, { title: e.target.value })}
                        placeholder="Titel (optional)"
                        className="w-36 px-3 py-2 rounded-full bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                      />
                      <button onClick={() => removeMedia(i)} type="button" className="rounded-full bg-elevated p-2 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showChats && (
            <div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Chats verlinken</p>
              {loadingChats ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Lade Chats …</div>
              ) : chatList.length === 0 ? (
                <p className="text-xs text-muted-foreground">Keine Chats gefunden.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {chatList.map((c) => {
                    const on = chats.some((x) => x.id === c.id);
                    const label = c.participantName || c.creatorName || "Chat";
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleChat(c)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors",
                          on ? "bg-primary/15 text-foreground" : "bg-background/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {c.conversationType === "AI" && <span className="text-[10px] text-muted-foreground">KI</span>}
                        {on && <span className="text-[10px] text-primary font-semibold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {chats.length > 0 && <p className="text-[11px] text-muted-foreground mt-1.5">{chats.length} ausgewählt</p>}
            </div>
          )}

          {showText && (
            <div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Vorstellung</p>
              <textarea
                value={vorstellung}
                onChange={(e) => setVorstellung(e.target.value)}
                placeholder="Schreib die Idee, das Bild im Kopf, die Stimmung …"
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-y"
              />
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Notiz (optional)</p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Wofür ist diese Vorlage gut?"
              className="w-full px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 w-full justify-center py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Vorlage speichern
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}