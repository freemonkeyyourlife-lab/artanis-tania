import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Mail, Link2, Loader2, Send, Share2, ShieldAlert } from "lucide-react";
import { THERAPY_MODES, INTENSITIES, roleLabel } from "@/lib/therapyPrompts";

const VOICE_LABEL = { storm: "Tief", river: "Ruhig", honey: "Warm", sunny: "Hell", spark: "Schnell" };
const APP_URL = "https://artanis-tania.base44.app";
const PARTNER_EMAIL = "freemonkeyyourlife@gmail.com";

const PURPOSE_NAME = {
  SITZUNG: "Sitzungs-Setup",
  MEDIEN: "Medien-Bündel",
  CHAT: "Chat-Verweis",
  VORSTELLUNG: "Vorstellung",
  KOMBI: "Kombi-Paket",
};

function setupLines(v) {
  const s = v.setup || {};
  const lines = [];
  const mode = THERAPY_MODES.find((m) => m.value === s.mode);
  const intensity = INTENSITIES.find((i) => i.value === s.intensity);
  lines.push(`Rollen: ${roleLabel({ ...s, therapistName: s.therapistName || "Tania" })}`);
  if (mode) lines.push(`Modus: ${mode.label}`);
  if (intensity) lines.push(`Intensität: ${intensity.label}`);
  lines.push(`Therapeutin: ${s.therapistName || "Tania"} (Stimme ${VOICE_LABEL[s.therapistVoice] || "Warm"})`);
  if (s.actor?.active) lines.push(`Akteur: ${s.actor.name || "Akteur"} (Stimme ${VOICE_LABEL[s.actor.voice] || "Tief"})`);
  (s.cast || []).filter((c) => c.mode === "PRESENT").forEach((c) => lines.push(`Anwesend: ${c.name} (Stimme ${VOICE_LABEL[c.voice] || "Ruhig"})`));
  return lines;
}

function buildEmail(v, message) {
  const parts = [];
  parts.push(`<h2 style="margin:0 0 8px;color:#0b0c0f;font-family:Montserrat,Arial,sans-serif">${v.name}</h2>`);
  parts.push(`<p style="margin:0 0 14px;color:#969ca6;font-family:Montserrat,Arial,sans-serif;font-size:13px">Art: ${PURPOSE_NAME[v.purpose] || v.purpose}</p>`);

  if ((v.purpose === "SITZUNG" || v.purpose === "KOMBI") && v.setup) {
    parts.push(`<p style="font-weight:700;color:#0b0c0f;font-family:Montserrat,Arial,sans-serif;font-size:13px;margin:0 0 6px">Setup</p>`);
    parts.push(`<ul style="margin:0 0 14px;padding-left:18px;color:#0b0c0f;font-family:Montserrat,Arial,sans-serif;font-size:13px">`);
    setupLines(v).forEach((l) => parts.push(`<li style="margin-bottom:3px">${l}</li>`));
    parts.push(`</ul>`);
  }
  if ((v.purpose === "MEDIEN" || v.purpose === "KOMBI") && (v.media || []).length) {
    parts.push(`<p style="font-weight:700;color:#0b0c0f;font-family:Montserrat,Arial,sans-serif;font-size:13px;margin:0 0 6px">Medien</p><ul style="margin:0 0 14px;padding-left:18px;color:#0b0c0f;font-family:Montserrat,Arial,sans-serif;font-size:13px">`);
    v.media.forEach((m) => parts.push(`<li style="margin-bottom:3px">${m.kind}: <a href="${m.url}" style="color:#e29578">${m.title || m.url}</a></li>`));
    parts.push(`</ul>`);
  }
  if ((v.purpose === "CHAT" || v.purpose === "KOMBI") && (v.chats || []).length) {
    parts.push(`<p style="font-weight:700;color:#0b0c0f;font-family:Montserrat,Arial,sans-serif;font-size:13px;margin:0 0 6px">Chats</p><ul style="margin:0 0 14px;padding-left:18px;color:#0b0c0f;font-family:Montserrat,Arial,sans-serif;font-size:13px">`);
    v.chats.forEach((c) => parts.push(`<li style="margin-bottom:3px">${c.label}</li>`));
    parts.push(`</ul>`);
  }
  if ((v.purpose === "VORSTELLUNG" || v.purpose === "KOMBI") && v.vorstellung) {
    parts.push(`<p style="font-weight:700;color:#0b0c0f;font-family:Montserrat,Arial,sans-serif;font-size:13px;margin:0 6px">Vorstellung</p>`);
    parts.push(`<p style="white-space:pre-wrap;color:#0b0c0f;font-family:Montserrat,Arial,sans-serif;font-size:13px;margin:0 0 14px">${v.vorstellung}</p>`);
  }
  if (message) {
    parts.push(`<p style="border-left:3px solid #e29578;padding-left:10px;color:#0b0c0f;font-family:Montserrat,Arial,sans-serif;font-size:13px;margin:0 0 14px;font-style:italic">${message}</p>`);
  }

  const link = `${APP_URL}/sitzungs-vorlagen`;
  return `<!doctype html><html><body style="margin:0;background:#0e0f11;padding:24px;font-family:Montserrat,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#0e0f11;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#e29578;padding:16px 24px"><span style="color:#0b0c0f;font-weight:900;font-size:15px">ARTANIS × TANIA · Vorlage geteilt</span></div>
    <div style="padding:24px;color:#f7f7f8">
      ${parts.join("")}
      <a href="${link}" style="display:inline-block;background:#e29578;color:#0b0c0f;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:12px;font-family:Montserrat,Arial,sans-serif">Vorlage öffnen</a>
      <p style="margin:14px 0 0;color:#969ca6;font-size:12px">Du bist eingeladen, dasselbe Setup für eure gemeinsamen Sitzungen zu nutzen. Öffne die Vorlagen-Bibliothek über den Button.</p>
    </div>
  </div></body></html>`;
}

// Vorlage mit der Partnerin teilen: per E-Mail (inkl. Setup-Zusammenfassung),
// sie direkt als Nutzerin mit Rolle einladen und einen Link kopieren — damit ihr
// beide dasselbe Setup für eure gemeinsamen Sitzungen nutzt.
export default function VorlagenTeilenDialog({ open, onClose, vorlage }) {
  const { toast } = useToast();
  const [email, setEmail] = useState(PARTNER_EMAIL);
  const [role, setRole] = useState("admin");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const link = `${APP_URL}/sitzungs-vorlagen`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Link kopiert", description: link });
    } catch {
      toast({ title: link });
    }
  };

  const send = async () => {
    const e = email.trim();
    if (!e) { toast({ title: "E-Mail fehlt", description: "Gib die Adresse deiner Partnerin ein." }); return; }
    setSending(true);
    try {
      // Einladen, damit sie registrierte Nutzerin wird (erhält E-Mail, sieht Vorlagen).
      try {
        await base44.users.inviteUser(e, role);
      } catch { /* schon eingeladen oder bereits Nutzerin */ }
      await base44.integrations.Core.SendEmail({
        to: e,
        subject: `Vorlage geteilt: ${vorlage.name}`,
        html: buildEmail(vorlage, message.trim()),
      });
      toast({ title: "Gesendet", description: `Einladung + Vorlage an ${e} geschickt.` });
      setEmail(PARTNER_EMAIL); setMessage("");
      onClose?.();
    } catch (err) {
      toast({ variant: "destructive", title: "Senden fehlgeschlagen", description: err?.message });
    } finally {
      setSending(false);
    }
  };

  if (!vorlage) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="max-w-md">
        <div className="flex items-center gap-2 mb-1">
          <Share2 className="w-4 h-4 text-primary" />
          <h3 className="font-display text-lg text-foreground">Vorlage teilen</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          „{vorlage.name}" an deine Partnerin senden — sie bekommt das komplette Setup per E-Mail und wird direkt eingeladen.
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">E-Mail der Partnerin</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partnerin@example.com"
              className="w-full px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">Rolle zuweisen</p>
            <div className="flex gap-2">
              {[{ v: "admin", l: "Admin" }, { v: "user", l: "Nutzerin" }].map((r) => (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => setRole(r.v)}
                  className={cn(
                    "px-3.5 py-2 rounded-full border text-sm transition-colors",
                    role === r.v ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r.l}
                </button>
              ))}
            </div>
            {role === "admin" && (
              <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground mt-2">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                Admin sieht und ändert alle Daten der App und verwaltet Nutzer. Nötig, damit sie die Vorlagen (admin-only) sieht.
              </p>
            )}
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">Persönliche Nachricht (optional)</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Lass uns dasselbe Setup nehmen …"
              className="w-full px-4 py-2.5 rounded-2xl bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-y"
            />
          </div>

          <button
            onClick={send}
            disabled={sending}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Einladen & per E-Mail senden
          </button>

          <div className="pt-3 border-t border-border">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">Oder Link teilen</p>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 w-full px-4 py-2.5 rounded-full bg-elevated border border-border text-sm text-foreground hover:border-primary/50 transition-colors"
            >
              <Link2 className="w-4 h-4" /> {link}
            </button>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5">
              <Mail className="w-3 h-3" /> Vorlagen sind admin-only — die Partnerin braucht die Admin-Einladung zum Ansehen.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}