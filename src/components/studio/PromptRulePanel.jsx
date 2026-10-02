import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, Plus, Trash2, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_RULE, ruleKindLabel } from "@/lib/promptRules";
import { inputCls, labelCls, chipCls, btnCls, btnAccentCls } from "@/lib/narratorUi";

const KINDS = ["ALLGEMEIN", "BILD", "VIDEO", "TEXT", "STORY"];
const LEARN_TITLE = "Gelernt aus deinen Worten";

const rows = (res) => (Array.isArray(res) ? res : res?.items || []);

// Die Schule: hier steht, wie hier erzählt und gebaut wird. Jede Regel gilt ab
// sofort in jedem Prompt — und was gelernt wurde, steht gleich darunter.
export default function PromptRulePanel() {
  const { toast } = useToast();
  const [rules, setRules] = useState([]);
  const [learned, setLearned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", kind: "ALLGEMEIN", rule: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const all = rows(await base44.entities.PromptRule.filter({}, { sort: "order", limit: 50 }).catch(() => []));
    setLearned(all.find((r) => r.title === LEARN_TITLE)?.examples || []);
    setRules(all.filter((r) => r.title !== LEARN_TITLE));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!form.title.trim() || !form.rule.trim()) return;
    setBusy(true);
    try {
      await base44.entities.PromptRule.create({
        title: form.title.trim(),
        kind: form.kind,
        rule: form.rule.trim(),
        order: rules.length,
        active: true,
      });
      setForm({ title: "", kind: "ALLGEMEIN", rule: "" });
      await load();
      toast({ title: "Gilt ab jetzt in jedem Prompt" });
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (rec) => {
    await base44.entities.PromptRule.update(rec.id, { active: rec.active === false });
    await load();
  };

  const remove = async (rec) => {
    await base44.entities.PromptRule.delete(rec.id);
    await load();
  };

  return (
    <div className="glass rounded-2xl border-2 border-border p-5">
      <p className="font-display text-2xl text-foreground flex items-center gap-2 mb-1">
        <GraduationCap className="w-6 h-6 text-primary" /> Deine feste Regel
      </p>
      <p className="text-[14px] font-semibold text-muted-foreground max-w-3xl mb-4 leading-relaxed">
        So wird hier erzählt und gebaut — sie steht über jedem Prompt und gilt für Bild, Video, Text und Szene.
      </p>

      <div className="rounded-2xl border-2 border-border bg-background p-4 mb-4">
        <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Immer dabei</p>
        <p className="text-[13px] font-semibold text-foreground/85 whitespace-pre-wrap leading-relaxed">{DEFAULT_RULE}</p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Wird geladen …
        </p>
      ) : (
        <div className="space-y-2 mb-5">
          {rules.map((r) => (
            <div key={r.id} className="rounded-xl border-2 border-border bg-background p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-foreground">{r.title}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {ruleKindLabel(r.kind) || "Alles"}
                </span>
                <button
                  onClick={() => toggle(r)}
                  className={cn(chipCls(r.active !== false), "ml-auto")}
                >
                  {r.active !== false ? "Gilt" : "Aus"}
                </button>
                <button
                  onClick={() => remove(r)}
                  className="w-8 h-8 rounded-full bg-destructive/15 text-destructive flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[13px] font-semibold text-foreground/80 whitespace-pre-wrap mt-2">{r.rule}</p>
            </div>
          ))}
          {!rules.length && (
            <p className="text-[13px] font-semibold text-muted-foreground">
              Noch keine eigenen Regeln — die feste Regel oben reicht schon.
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Wie soll sie heißen?</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="z. B. Immer erst die Situation"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Wofür</label>
            <div className="flex flex-wrap gap-1.5">
              {KINDS.map((k) => (
                <button key={k} onClick={() => setForm({ ...form, kind: k })} className={chipCls(form.kind === k)}>
                  {ruleKindLabel(k) || "Alles"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls}>Was gilt</label>
          <textarea
            value={form.rule}
            onChange={(e) => setForm({ ...form, rule: e.target.value })}
            rows={3}
            placeholder="Sag es in deinen Worten — so, wie du es mir sonst erzählst."
            className={cn(inputCls, "resize-none")}
          />
        </div>
        <button
          onClick={add}
          disabled={busy || !form.title.trim() || !form.rule.trim()}
          className={btnAccentCls}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Regel aufnehmen
        </button>
      </div>

      {learned.length > 0 && (
        <div className="mt-5">
          <label className={labelCls}>
            <Check className="w-3.5 h-3.5 inline mr-1" /> Gelernt aus deinen Worten · {learned.length}
          </label>
          <div className="space-y-2">
            {learned.slice(0, 4).map((e, i) => (
              <div key={i} className="rounded-xl border border-border bg-background p-3">
                <p className="text-[12px] font-semibold text-muted-foreground line-clamp-2">„{e.rough}"</p>
                <p className="text-[12px] font-semibold text-foreground/80 line-clamp-2 mt-1">→ {e.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}