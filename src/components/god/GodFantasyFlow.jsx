import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Mic, Wand2, Play, RefreshCw, User } from "lucide-react";
import VoiceInput from "@/components/VoiceInput";
import NarratorAvatar3D from "@/components/narrator/NarratorAvatar3D";
import { speakAsVoice } from "@/lib/voiceChat";
import { cn } from "@/lib/utils";

// Der Fantasie-Workflow: Entwurf einsprechen oder tippen → daraus eine Story
// bauen → und dann durchspielen. Ein geführter Zug, nicht drei einzelne Punkte.
export default function GodFantasyFlow() {
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [creatorId, setCreatorId] = useState("");
  const [narrators, setNarrators] = useState([]);
  const [narratorId, setNarratorId] = useState("");
  const [narrator, setNarrator] = useState(null);
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("entwurf"); // entwurf | fertig
  const [built, setBuilt] = useState(null); // { storyId, experienceId, title, preview }
  const [error, setError] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    base44.entities.Creator.list()
      .then((list) => {
        const real = (list || []).filter((c) => c.creatorCategory === "REAL" && c.active !== false);
        setCreators(real.length ? real : (list || []));
        if (real[0]) setCreatorId(real[0].id);
      })
      .catch(() => {});
  }, []);

  // Die Erzählerin holen — mit ihrer Stimme. Sie ist das Gesicht der KI hier.
  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Narrator.filter({ active: { $ne: false } }, "order", 1);
        const list = res?.items || [];
        setNarrators(list);
        const lead = list[0] || null;
        if (lead) setNarratorId(lead.id);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!narratorId) return;
    const n = narrators.find((x) => x.id === narratorId) || null;
    setNarrator(n);
    (async () => {
      if (n?.voiceProfileId) {
        try {
          const v = await base44.entities.Voice.filter({ id: n.voiceProfileId });
          setVoiceProfile(v?.items?.[0] || { baseVoice: n.voice || "honey" });
        } catch { setVoiceProfile({ baseVoice: n.voice || "honey" }); }
      } else {
        setVoiceProfile({ baseVoice: n?.voice || "honey" });
      }
    })();
  }, [narratorId, narrators]);

  const say = async (text) => {
    if (!text || !voiceProfile) return;
    try {
      setSpeaking(true);
      const url = await speakAsVoice(voiceProfile, text, { fast: true });
      if (url) {
        audioRef.current?.pause();
        const a = new Audio(url);
        audioRef.current = a;
        a.onended = () => setSpeaking(false);
        a.onerror = () => setSpeaking(false);
        a.play().catch(() => setSpeaking(false));
      } else {
        setSpeaking(false);
      }
    } catch { setSpeaking(false); }
  };

  useEffect(() => () => audioRef.current?.pause(), []);

  const creatorName = creators.find((c) => c.id === creatorId)?.stageName || "";

  const build = async () => {
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const llm = await base44.integrations.Core.InvokeLLM({
        prompt: `Aus diesem Entwurf eine kurze, stimmige erotische Story bauen. Schreibe auf Deutsch. Liefere Titel, Kurzfassung (preview, 2 Sätze), die ganze Geschichte (content, ca. 400-600 Wörter, mit Szenen), den Text der ersten Spielszene (stageText, der Ausgangspunkt) und drei kurze Wahl-Labels (choices), wie es weitergehen könnte.\n\nEntwurf:\n${draft}`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            preview: { type: "string" },
            content: { type: "string" },
            stageText: { type: "string" },
            choices: { type: "array", items: { type: "string" } },
          },
        },
      });

      const story = await base44.entities.Story.create({
        creatorId: creatorId || undefined,
        creatorName: creatorName || undefined,
        title: llm.title || "Fantasie",
        preview: llm.preview || "",
        content: llm.content || draft,
        visibility: "PRIVATE",
        published: false,
        madeWithUser: true,
      });

      const exp = await base44.entities.Experience.create({
        creatorId: creatorId || undefined,
        creatorName: creatorName || undefined,
        title: llm.title || "Fantasie",
        description: llm.preview || "",
        experienceType: "AI_INTERACTIVE",
        visibility: "PRIVATE",
        published: true,
      });

      const stage = await base44.entities.ExperienceStage.create({
        experienceId: exp.id,
        order: 0,
        title: llm.title || "Auftakt",
        overlayText: llm.stageText || llm.content || draft,
        triggerType: "USER_CHOICE",
      });

      const choiceLabels = (llm.choices && llm.choices.length ? llm.choices : ["Weiter", "Anders wenden", "Enden"]).slice(0, 3);
      for (let i = 0; i < choiceLabels.length; i++) {
        await base44.entities.ExperienceChoice.create({
          stageId: stage.id,
          label: choiceLabels[i],
          order: i,
        });
      }

      const built = { storyId: story.id, experienceId: exp.id, title: llm.title || "Fantasie", preview: llm.preview || "" };
      setBuilt(built);
      setStep("fertig");
      // Sie erzählt, was entstanden ist — die KI ist die Erzählerin.
      if (built.preview) say(built.preview);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Beim Bauen ging etwas schief.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setDraft("");
    setBuilt(null);
    setStep("entwurf");
    setError("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border-2 border-primary/30 bg-background/40 p-3">
        <p className="text-[12px] font-bold text-primary mb-1">Fantasie → Story → Durchspielen</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Sprich oder schreib deinen Entwurf — daraus entsteht eine Story und eine spielbare Szene.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 py-1">
        <NarratorAvatar3D narrator={narrator} speaking={speaking || busy} />
        {narrators.length > 1 && (
          <select
            value={narratorId}
            onChange={(e) => setNarratorId(e.target.value)}
            className="bg-elevated border border-border rounded-full px-2 py-1 text-[11px] text-foreground focus:outline-none max-w-[200px]"
          >
            {narrators.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        )}
      </div>

      {step === "entwurf" && (
        <>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <select
              value={creatorId}
              onChange={(e) => setCreatorId(e.target.value)}
              className="bg-elevated border border-border rounded-full px-2 py-1 text-[12px] text-foreground focus:outline-none max-w-[200px]"
            >
              {creators.map((c) => (
                <option key={c.id} value={c.id}>{c.stageName || c.realName || c.id}</option>
              ))}
            </select>
            <span className="text-[11px] text-muted-foreground">für wen die Story ist</span>
          </div>

          <div className="rounded-2xl border-2 border-border bg-elevated p-2 flex items-start gap-2">
            <VoiceInput onResult={(t) => setDraft((d) => (d ? `${d}\n${t}` : t))} />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              placeholder="Sprich oder schreib die Fantasie — Ort, Stimmung, wer, was passieren soll …"
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={build}
            disabled={!draft.trim() || busy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {busy ? "baut Story & Szene …" : "Story bauen"}
          </button>
          {error && <p className="text-[12px] text-destructive">{error}</p>}
        </>
      )}

      {step === "fertig" && built && (
        <>
          <div className="rounded-2xl border-2 border-primary/40 bg-elevated p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Fertig</p>
            <p className="text-[15px] font-bold text-foreground mt-1">{built.title}</p>
            <p className="text-[12px] text-muted-foreground mt-1 line-clamp-3">{built.preview}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/experience/${built.experienceId}`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss"
            >
              <Play className="w-4 h-4" /> Durchspielen
            </button>
            <button
              onClick={() => say(built.preview)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[13px] font-bold text-foreground"
            >
              <Mic className="w-4 h-4" /> Erzählerin anhören
            </button>
            <button
              onClick={() => navigate("/stories")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[13px] font-bold text-foreground"
            >
              Zu den Storys
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[13px] font-bold text-foreground"
            >
              <RefreshCw className="w-4 h-4" /> Neue Fantasie
            </button>
          </div>
        </>
      )}
    </div>
  );
}