import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import {
  Check, Copy, ExternalLink, KeyRound, Loader2, Save, Sparkles, Film, Mic,
  MessageSquare, CreditCard, Send, Bot, Cpu, Plus, CheckCircle2, AlertCircle,
} from "lucide-react";

// Eine Karte pro Service — Secret, ID, URL oder Schalter. Alles an einem Ort,
// alles klick-und-kopier-fertig. Secrets werden im Dashboard eingetragen
// (das Panel kann sie nicht sehen), IDs landen direkt in der Entität.

const SERVICES = [
  // BILD & VIDEO
  { key: "FAL_KEY", label: "fal.ai", category: "BILD", kind: "SECRET", secretName: "FAL_KEY", icon: Sparkles,
    note: "Bild- und Video-Erzeugung. Key aus fal.ai → Dashboard → Keys.", helpUrl: "https://fal.ai/dashboard/keys" },
  { key: "POLLINATIONS_API_KEY", label: "Pollinations", category: "BILD", kind: "SECRET", secretName: "POLLINATIONS_API_KEY", icon: Sparkles,
    note: "Freie Bild-Generierung. API-Key optional.", helpUrl: "https://pollinations.ai" },
  { key: "HF_MODEL_ID", label: "Hugging Face Modell", category: "MODELL", kind: "ID", icon: Cpu,
    note: "Modell-ID oder Repo-Pfad, z.B. owner/modellname. Für Bild-/Video-Modelle.", helpUrl: "https://huggingface.co/models" },
  { key: "LORA_MODEL_ID", label: "Trainiertes LoRA-Modell", category: "MODELL", kind: "ID", icon: Cpu,
    note: "Die Modell-ID nach dem Training. Wird für die Bild-Erzeugung mit deinem Charakter genutzt." },

  // STIMME
  { key: "ELEVENLABS_API_KEY", label: "ElevenLabs", category: "STIMME", kind: "SECRET", secretName: "ELEVENLABS_API_KEY", icon: Mic,
    note: "Stimmen erzeugen und klonen. Key aus ElevenLabs → Profile → API Keys.", helpUrl: "https://elevenlabs.io/app/settings/api-keys" },
  { key: "ELEVEN_VOICE_ID", label: "ElevenLabs Voice-ID", category: "STIMME", kind: "ID", icon: Mic,
    note: "Die Voice-ID deiner geklonten Stimme, z.B. VRxxxxxx. Aus ElevenLabs → Voices.", helpUrl: "https://elevenlabs.io/app/voice-lab" },

  // CHAT / LLM
  { key: "OPENROUTER_API_KEY", label: "OpenRouter", category: "CHAT", kind: "SECRET", secretName: "OPENROUTER_API_KEY", icon: MessageSquare,
    note: "LLM-Chat-Modelle. Key aus OpenRouter → Keys.", helpUrl: "https://openrouter.ai/keys" },

  // ZAHLUNG
  { key: "STRIPE_SECRET_KEY", label: "Stripe Secret Key", category: "ZAHLUNG", kind: "SECRET", secretName: "STRIPE_SECRET_KEY", icon: CreditCard,
    note: "Geheimschlüssel aus Stripe. Test: sk_test_... / Live: sk_live_...", helpUrl: "https://dashboard.stripe.com/apikeys" },
  { key: "STRIPE_PUBLISHABLE_KEY", label: "Stripe Publishable Key", category: "ZAHLUNG", kind: "SECRET", secretName: "STRIPE_PUBLISHABLE_KEY", icon: CreditCard,
    note: "Öffentlicher Schlüssel. Test: pk_test_... / Live: pk_live_...", helpUrl: "https://dashboard.stripe.com/apikeys" },
  { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe Webhook Secret", category: "ZAHLUNG", kind: "SECRET", secretName: "STRIPE_WEBHOOK_SECRET", icon: CreditCard,
    note: "Signatur-Secret für den Webhook. Wird automatisch gesetzt.", helpUrl: "https://dashboard.stripe.com/webhooks" },
  { key: "STRIPE_LIVE_MODE", label: "Stripe Live-Modus", category: "ZAHLUNG", kind: "BOOL", icon: CreditCard,
    note: "Schalter ein, sobald du Live-Keys eingetragen hast und echte Zahlungen annehmen willst." },

  // TELEGRAM
  { key: "TELEGRAM_BOT_TOKEN", label: "Telegram Bot Token", category: "TELEGRAM", kind: "SECRET", secretName: "TELEGRAM_BOT_TOKEN", icon: Send,
    note: "Bot-Token von BotFather.", helpUrl: "https://t.me/BotFather" },
  { key: "TELEGRAM_WEBHOOK_SECRET", label: "Telegram Webhook Secret", category: "TELEGRAM", kind: "SECRET", secretName: "TELEGRAM_WEBHOOK_SECRET", icon: Send,
    note: "Geheimes Token für eingehende Webhooks." },

  // SONSTIGES
  { key: "ACTOR_TOKEN_SECRET", label: "Actor Token Secret", category: "SONSTIGES", kind: "SECRET", secretName: "ACTOR_TOKEN_SECRET", icon: KeyRound,
    note: "Sichert die Echtzeit-Räume (Calls, Live)." },
];

const CATEGORY_LABELS = {
  BILD: "Bild & Video",
  STIMME: "Stimmen",
  CHAT: "Chat / KI",
  ZAHLUNG: "Zahlungen (Stripe)",
  TELEGRAM: "Telegram",
  MODELL: "Modelle",
  SONSTIGES: "Sonstiges",
};

const CATEGORY_ORDER = ["BILD", "MODELL", "STIMME", "CHAT", "ZAHLUNG", "TELEGRAM", "SONSTIGES"];

export default function GodAnbindungen() {
  const [records, setRecords] = useState({});
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(null);
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await base44.entities.Anbindung.list({ limit: 200 });
      const items = res.items || res || [];
      const map = {};
      items.forEach((r) => { map[r.key] = r; });
      setRecords(map);
      const d = {};
      items.forEach((r) => { d[r.key] = r.value || ""; });
      setDrafts(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (svc) => {
    const value = drafts[svc.key] ?? "";
    setBusy(svc.key);
    try {
      const existing = records[svc.key];
      if (existing) {
        await base44.entities.Anbindung.update(existing.id, { value, boolValue: svc.kind === "BOOL" ? value === "true" : existing.boolValue });
      } else {
        const created = await base44.entities.Anbindung.create({
          key: svc.key, label: svc.label, category: svc.category, kind: svc.kind,
          value, secretName: svc.secretName, helpUrl: svc.helpUrl, note: svc.note,
          boolValue: svc.kind === "BOOL" ? value === "true" : false,
        });
        setRecords((m) => ({ ...m, [svc.key]: created }));
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (svc) => {
    const existing = records[svc.key];
    const next = !(existing?.boolValue);
    setBusy(svc.key);
    try {
      if (existing) {
        await base44.entities.Anbindung.update(existing.id, { boolValue: next });
      } else {
        const created = await base44.entities.Anbindung.create({
          key: svc.key, label: svc.label, category: svc.category, kind: "BOOL",
          boolValue: next, note: svc.note, helpUrl: svc.helpUrl,
        });
        setRecords((m) => ({ ...m, [svc.key]: created }));
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const statusOf = (svc) => {
    if (svc.kind === "SECRET") return "secret";
    if (svc.kind === "BOOL") return records[svc.key]?.boolValue ? "on" : "off";
    const v = records[svc.key]?.value;
    return v ? "set" : "missing";
  };

  const grouped = useMemo(() => {
    const g = {};
    SERVICES.forEach((s) => { (g[s.category] ||= []).push(s); });
    return CATEGORY_ORDER.filter((c) => g[c]).map((c) => [c, g[c]]);
  }, []);

  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="rounded-2xl border-2 border-primary/30 bg-background/40 p-3 flex items-start gap-2">
        <KeyRound className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[12px] text-muted-foreground leading-snug">
          <span className="font-bold text-foreground">So geht's:</span> Bei <span className="text-primary font-bold">Secrets</span> auf <span className="font-bold text-foreground">Kopieren</span> klicken, dann im Dashboard unter <span className="font-bold text-foreground">Secrets → Add Secret</span> einfügen. Bei <span className="text-primary font-bold">IDs & URLs</span> den Wert ins Feld tippen und <span className="font-bold text-foreground">Speichern</span> drücken — fertig.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Anbindungen werden geladen …
        </div>
      ) : (
        grouped.map(([cat, svcs]) => (
          <div key={cat} className="flex flex-col gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary px-1">{CATEGORY_LABELS[cat]}</p>
            {svcs.map((svc) => {
              const Icon = svc.icon || KeyRound;
              const status = statusOf(svc);
              const draft = drafts[svc.key] ?? "";
              return (
                <div key={svc.key} className="rounded-2xl border border-border bg-elevated p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-[13px] font-bold text-foreground">{svc.label}</span>
                    <StatusPill status={status} />
                    {svc.helpUrl && (
                      <a href={svc.helpUrl} target="_blank" rel="noreferrer" className="ml-auto text-muted-foreground hover:text-primary">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  {svc.note && <p className="text-[11px] text-muted-foreground leading-snug">{svc.note}</p>}

                  {svc.kind === "SECRET" && (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-[12px] text-foreground font-mono truncate">
                        {svc.secretName}
                      </code>
                      <button
                        onClick={() => copy(svc.secretName, svc.key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn text-[12px] font-bold transition-colors",
                          copied === svc.key ? "glass-btn-accent text-gloss" : "text-foreground"
                        )}
                      >
                        {copied === svc.key ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === svc.key ? "Kopiert!" : "Kopieren"}
                      </button>
                    </div>
                  )}

                  {svc.kind === "ID" && (
                    <div className="flex items-center gap-2">
                      <input
                        value={draft}
                        onChange={(e) => setDrafts((d) => ({ ...d, [svc.key]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") save(svc); }}
                        placeholder="Wert eintragen …"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                      />
                      <button
                        onClick={() => save(svc)}
                        disabled={busy === svc.key}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn glass-btn-accent text-[12px] font-bold text-gloss disabled:opacity-50"
                      >
                        {busy === svc.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : records[svc.key]?.value ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {records[svc.key]?.value ? "Speichern" : "Eintragen"}
                      </button>
                    </div>
                  )}

                  {svc.kind === "URL" && (
                    <div className="flex items-center gap-2">
                      <input
                        value={draft}
                        onChange={(e) => setDrafts((d) => ({ ...d, [svc.key]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") save(svc); }}
                        placeholder="https://…"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                      />
                      <button
                        onClick={() => save(svc)}
                        disabled={busy === svc.key}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn glass-btn-accent text-[12px] font-bold text-gloss disabled:opacity-50"
                      >
                        {busy === svc.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Speichern
                      </button>
                    </div>
                  )}

                  {svc.kind === "BOOL" && (
                    <button
                      onClick={() => toggle(svc)}
                      disabled={busy === svc.key}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors",
                        records[svc.key]?.boolValue
                          ? "glass-btn glass-btn-accent text-gloss"
                          : "glass-btn text-foreground"
                      )}
                    >
                      {busy === svc.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      {records[svc.key]?.boolValue ? "Live-Modus AN" : "Live-Modus AUS"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    secret: { label: "im Dashboard", icon: KeyRound, cls: "text-badge-ai border-badge-ai/40" },
    set: { label: "gesetzt", icon: CheckCircle2, cls: "text-primary border-primary/40" },
    on: { label: "AN", icon: CheckCircle2, cls: "text-primary border-primary/40" },
    off: { label: "AUS", icon: AlertCircle, cls: "text-muted-foreground border-border" },
    missing: { label: "fehlt", icon: AlertCircle, cls: "text-destructive border-destructive/40" },
  };
  const s = map[status] || map.missing;
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold", s.cls)}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}