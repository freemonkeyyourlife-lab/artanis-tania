import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import {
  Loader2, Plus, Copy, Check, Trash2, RefreshCw, Power, Link2, CreditCard, Crown, BookOpen, QrCode, MessageSquare, ChevronDown, ChevronUp,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// Godmode-Paketverwaltung: hier legst du VIP-Abos und Story-Kapitel-Einzelkaeufe
// an, vergleichst und aenderst die Preise selbst. Pro Paket entsteht ein offener
// Stripe-Zahlungslink (2D non-OTP und 3D Secure automatisch), den du ueberall teilen kannst.

const ARTEN = [
  { key: "VIP_ABO", label: "VIP-Abo", hint: "wiederkehrend", icon: Crown },
  { key: "KAPITEL", label: "Story-Kapitel", hint: "Einzelkauf", icon: BookOpen },
];
const INTERVALL = { WEEK: "Woche", MONTH: "Monat", YEAR: "Jahr" };

const eur = (cents) => (Number(cents || 0) / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function GodPaketPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", art: "VIP_ABO", betrag: "", intervall: "MONTH", beschreibung: "" });
  const [editBetrag, setEditBetrag] = useState({});
  const [copied, setCopied] = useState(null);
  const [qrOpen, setQrOpen] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await base44.functions.invoke("stripePaket", { action: "list" });
      setItems(res.items || []);
    } catch (e) {
      setErr(e?.message || "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const run = async (label, fn) => {
    if (busy) return;
    setBusy(true);
    setErr("");
    try { await fn(); }
    catch (e) { setErr(`${label}: ${e?.message || "fehlgeschlagen"}`); }
    finally { setBusy(false); }
  };

  const create = () => run("Anlegen", async () => {
    if (!form.name.trim() || !form.betrag) return;
    await base44.functions.invoke("stripePaket", {
      action: "create",
      name: form.name.trim(),
      art: form.art,
      betrag: Number(form.betrag),
      intervall: form.intervall,
      beschreibung: form.beschreibung.trim(),
    });
    setForm({ name: "", art: "VIP_ABO", betrag: "", intervall: "MONTH", beschreibung: "" });
    await load();
  });

  const savePrice = (p) => run("Preis", async () => {
    const betrag = Number(editBetrag[p.id]);
    if (!Number.isFinite(betrag) || betrag <= 0) return;
    await base44.functions.invoke("stripePaket", { action: "updatePrice", id: p.id, betrag });
    setEditBetrag((e) => { const n = { ...e }; delete n[p.id]; return n; });
    await load();
  });

  const toggle = (p) => run("Aktiv", async () => {
    await base44.functions.invoke("stripePaket", { action: "toggleActive", id: p.id });
    await load();
  });

  const newLink = (p) => run("Link", async () => {
    await base44.functions.invoke("stripePaket", { action: "newLink", id: p.id });
    await load();
  });

  const remove = (p) => run("Löschen", async () => {
    if (!confirm(`"${p.name}" entfernen? Das Stripe-Produkt wird deaktiviert.`)) return;
    await base44.functions.invoke("stripePaket", { action: "delete", id: p.id });
    await load();
  });

  const copy = async (url, id) => {
    try { await navigator.clipboard.writeText(url); setCopied(id); setTimeout(() => setCopied(null), 1500); } catch {}
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="rounded-2xl border-2 border-border bg-elevated p-3">
        <p className="text-[13px] font-bold text-foreground flex items-center gap-1.5 mb-1">
          <Plus className="w-4 h-4 text-primary" /> Neues Paket anlegen
        </p>
        <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
          Du wählst Typ und Preis. Stripe legt Produkt, Preis und einen offenen Zahlungslink an — Karten mit und ohne 3D Secure werden automatisch erkannt.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {ARTEN.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                onClick={() => setForm((f) => ({ ...f, art: a.key, intervall: a.key === "VIP_ABO" ? f.intervall : "MONTH" }))}
                className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5", form.art === a.key ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground")}
              >
                <Icon className="w-3 h-3" /> {a.label}
              </button>
            );
          })}
        </div>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Name, z. B. VIP Plus"
          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-2"
        />
        <div className="flex gap-2 mb-2">
          <div className="flex items-center gap-1 px-2 py-2 rounded-xl bg-background border border-border flex-1">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.betrag}
              onChange={(e) => setForm((f) => ({ ...f, betrag: e.target.value }))}
              placeholder="0,00"
              className="w-full bg-transparent text-[13px] text-foreground focus:outline-none"
            />
            <span className="text-[11px] font-bold text-muted-foreground">EUR</span>
          </div>
          {form.art === "VIP_ABO" && (
            <select
              value={form.intervall}
              onChange={(e) => setForm((f) => ({ ...f, intervall: e.target.value }))}
              className="bg-background border border-border rounded-xl px-2 text-[12px] text-foreground focus:outline-none"
            >
              {Object.entries(INTERVALL).map(([k, v]) => (
                <option key={k} value={k}>pro {v}</option>
              ))}
            </select>
          )}
        </div>
        <input
          value={form.beschreibung}
          onChange={(e) => setForm((f) => ({ ...f, beschreibung: e.target.value }))}
          placeholder="Beschreibung (optional)"
          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-2"
        />
        <button
          onClick={create}
          disabled={busy || !form.name.trim() || !form.betrag}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Anlegen & Link erzeugen
        </button>
      </div>

      {err && (
        <p className="text-[11px] text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2">{err}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Pakete werden geladen …
        </div>
      ) : items.length === 0 ? (
        <p className="text-[12px] text-muted-foreground py-4 text-center">
          Noch keine Pakete. Lege oben das erste an — VIP-Abo oder Story-Kapitel.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((p) => {
            const a = ARTEN.find((x) => x.key === p.art) || ARTEN[0];
            const Icon = a.icon;
            const editing = editBetrag[p.id] !== undefined;
            return (
              <div key={p.id} className={cn("rounded-2xl border-2 bg-elevated p-3 flex flex-col gap-2", p.aktiv ? "border-border" : "border-border opacity-60")}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-[14px] font-bold text-foreground flex-1 min-w-0 truncate">{p.name}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">{a.label}</span>
                  <button
                    onClick={() => toggle(p)}
                    title={p.aktiv ? "Deaktivieren" : "Aktivieren"}
                    className={cn("w-7 h-7 rounded-full glass-btn flex items-center justify-center", p.aktiv ? "text-primary" : "text-muted-foreground")}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-background border border-border flex-1">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editBetrag[p.id]}
                          onChange={(e) => setEditBetrag((s) => ({ ...s, [p.id]: e.target.value }))}
                          className="w-full bg-transparent text-[13px] text-foreground focus:outline-none"
                        />
                        <span className="text-[11px] font-bold text-muted-foreground">EUR</span>
                      </div>
                      <button onClick={() => savePrice(p)} disabled={busy} className="px-3 py-1 rounded-full glass-btn glass-btn-accent text-[11px] font-bold text-gloss disabled:opacity-50">Speichern</button>
                      <button onClick={() => setEditBetrag((e) => { const n = { ...e }; delete n[p.id]; return n; })} className="px-2 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground">Abbrechen</button>
                    </>
                  ) : (
                    <>
                      <p className="text-[16px] font-bold text-primary">
                        {eur(p.betragCents)}{p.wiederkehrend ? ` / ${INTERVALL[p.intervall] || "Monat"}` : " einmalig"}
                      </p>
                      <button onClick={() => setEditBetrag((s) => ({ ...s, [p.id]: (p.betragCents / 100).toString() }))} className="px-3 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground">Preis ändern</button>
                    </>
                  )}
                </div>

                {p.stripeLinkUrl && (
                  <div className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <input
                      readOnly
                      value={p.stripeLinkUrl}
                      className="flex-1 px-2 py-1 rounded-lg bg-background border border-border text-[11px] text-muted-foreground truncate focus:outline-none"
                    />
                    <button onClick={() => copy(p.stripeLinkUrl, p.id)} className="px-2 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground inline-flex items-center gap-1">
                      {copied === p.id ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                      {copied === p.id ? "Kopiert" : "Kopieren"}
                    </button>
                    <button onClick={() => newLink(p)} disabled={busy} title="Neuen offenen Link erzeugen" className="w-7 h-7 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {p.stripeLinkUrl && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQrOpen(qrOpen === p.id ? null : p.id)}
                      title="QR-Code anzeigen — zum Scannen am Tisch, auf Flyern oder im Chat"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground"
                    >
                      <QrCode className="w-3.5 h-3.5" /> QR-Code
                      {qrOpen === p.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <a
                      href={`sms:?&body=${encodeURIComponent(`${p.name} — ${eur(p.betragCents)}${p.wiederkehrend ? " / " + (INTERVALL[p.intervall] || "Monat") : ""}\n${p.stripeLinkUrl}`)}`}
                      title="Link per SMS verschicken"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> SMS
                    </a>
                    <a
                      href={p.stripeLinkUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Zahlungsseite öffnen"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Öffnen
                    </a>
                  </div>
                )}

                {qrOpen === p.id && p.stripeLinkUrl && (
                  <div className="flex flex-col items-center gap-2 rounded-2xl bg-background border border-border p-3">
                    <div className="rounded-xl bg-white p-3">
                      <QRCodeSVG value={p.stripeLinkUrl} size={156} level="M" />
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center leading-snug">
                      Scannen öffnet die Zahlungsseite — Kreditkarte mit und ohne 3D Secure, mobiles Bezahlen.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3" /> Karten mit und ohne 3D Secure
                  </p>
                  <button onClick={() => remove(p)} disabled={busy} className="inline-flex items-center gap-1 px-2 py-1 rounded-full glass-btn text-destructive text-[11px] font-bold">
                    <Trash2 className="w-3 h-3" /> Entfernen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
        Preise sind nur hier änderbar — in Stripe selbst legt jeder neue Preis einen Ersatz an und der alte wird archiviert. Der offene Link bleibt teilbar, solange das Paket aktiv ist.
      </p>
    </div>
  );
}