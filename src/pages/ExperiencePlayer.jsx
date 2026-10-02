import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { ChevronRight, Lock, Coins, ArrowLeft, Check, Send, Sparkles, Zap } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { getTokens, spendTokens } from "@/lib/tokens";
import StoryProgress from "@/components/story/StoryProgress";
import ConciergeTip from "@/components/story/ConciergeTip";
import { conciergeTip } from "@/lib/storyConcierge";

export default function ExperiencePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experience, setExperience] = useState(null);
  const [stages, setStages] = useState([]);
  const [choices, setChoices] = useState({});
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [points, setPoints] = useState(0);
  const [tokens, setTokens] = useState(() => getTokens());
  const [chatCount, setChatCount] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [displayName, setDisplayName] = useState(() => {
    try { return localStorage.getItem("display_name") || "Guest"; } catch { return "Guest"; }
  });
  const [concierge, setConcierge] = useState(null);
  const [tips, setTips] = useState({});
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);
  const askedRef = useRef(new Set());

  useEffect(() => { load(); return () => audioRef.current?.pause(); }, [id]);
  useEffect(() => {
    const u = () => setTokens(getTokens());
    window.addEventListener("tokens-changed", u);
    return () => window.removeEventListener("tokens-changed", u);
  }, []);

  const load = async () => {
    try {
      const exp = await base44.entities.Experience.get(id);
      setExperience(exp);
      const [allStages, allChoices] = await Promise.all([
        base44.entities.ExperienceStage.filter({ experienceId: id }),
        base44.entities.ExperienceChoice.list(),
      ]);
      const sorted = allStages.sort((a, b) => (a.order || 0) - (b.order || 0));
      setStages(sorted);
      const map = {};
      allChoices.forEach(c => {
        if (!map[c.stageId]) map[c.stageId] = [];
        map[c.stageId].push(c);
      });
      Object.keys(map).forEach(k => map[k].sort((a, b) => (a.order || 0) - (b.order || 0)));
      setChoices(map);
      const narrators = await base44.entities.Narrator.filter({ active: true }, "order", 1).catch(() => ({ items: [] }));
      setConcierge(narrators.items?.[0] || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const currentStage = stages[currentStageIdx];
  const stageChoices = currentStage ? (choices[currentStage.id] || []) : [];
  const progress = stages.length > 0 ? ((currentStageIdx + 1) / stages.length) * 100 : 0;

  // Der Concierge meldet sich einmal pro Station — danach steht sein Satz fest.
  useEffect(() => {
    const key = currentStage?.id;
    if (!key || askedRef.current.has(key)) return;
    askedRef.current.add(key);
    setTips((t) => ({ ...t, [key]: { loading: true } }));
    let alive = true;
    conciergeTip({
      narrator: concierge,
      experience,
      stage: currentStage,
      index: currentStageIdx,
      count: stages.length,
      history: stages.slice(0, currentStageIdx).map((s) => s.title).filter(Boolean),
    })
      .then((res) => { if (alive) setTips((t) => ({ ...t, [key]: { ...res, loading: false } })); })
      .catch(() => { if (alive) setTips((t) => ({ ...t, [key]: { loading: false } })); });
    return () => { alive = false; };
  }, [currentStage?.id, concierge]);

  const speakTip = async (text) => {
    if (!text) return;
    try {
      const res = await base44.integrations.Core.GenerateSpeech({ text, voice: concierge?.voice || "honey" });
      const audio = new Audio(res.url);
      audioRef.current = audio;
      setSpeaking(true);
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      await audio.play();
    } catch (e) { setSpeaking(false); }
  };

  const stopSpeak = () => {
    audioRef.current?.pause();
    setSpeaking(false);
  };

  const goToStage = (stageId) => {
    setTransitioning(true);
    setTimeout(() => {
      const idx = stages.findIndex(s => s.id === stageId);
      if (idx >= 0) setCurrentStageIdx(idx);
      else setCompleted(true);
      setTransitioning(false);
    }, 400);
  };

  const handleContinue = () => {
    setPoints(p => p + 10);
    if (currentStage?.nextStageId) goToStage(currentStage.nextStageId);
    else setCompleted(true);
  };

  const handleChoice = (choice) => {
    setPoints(p => p + 20);
    goToStage(choice.nextStageId);
  };

  const handleUnlock = () => {
    if (spendTokens(5)) {
      setPoints(p => p + 30);
      handleContinue();
    }
  };

  const handleClickPoints = () => {
    const target = parseInt(currentStage?.triggerValue || "30");
    const np = points + 5;
    setPoints(np);
    if (np >= target) handleContinue();
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { text: chatInput, sender: "user" }]);
    setChatInput("");
    const nc = chatCount + 1;
    setChatCount(nc);
    const target = parseInt(currentStage?.triggerValue || "3");
    if (nc >= target) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { text: "Mmm, I like where this is going...", sender: "ai" }]);
        setTimeout(() => handleContinue(), 800);
      }, 600);
    } else {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { text: "Tell me more...", sender: "ai" }]);
      }, 600);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (completed) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6 accent-glow">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground mb-2">Erlebnis abgeschlossen</h1>
          <p className="text-muted-foreground mb-6">Du hast {points} Punkte gesammelt</p>
          <div className="flex gap-3 justify-center">
            <Link to="/interactive" className="px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold">Zurück zu den Erlebnissen</Link>
            <button onClick={() => { setCurrentStageIdx(0); setCompleted(false); setPoints(0); setChatCount(0); setChatMessages([]); }} className="px-5 py-3 rounded-full glass border border-border text-foreground text-sm font-semibold">Nochmal spielen</button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Dieses Erlebnis hat noch keine Stationen.</p>
          <Link to="/interactive" className="text-primary hover:underline">Zurück zu den Erlebnissen</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Background Media */}
      <div className={cn("absolute inset-0 transition-opacity duration-400", transitioning ? "opacity-0" : "opacity-100")}>
        {currentStage.mediaAsset ? (
          <Image src={currentStage.mediaAsset} fittingType="fill" className="w-full h-full" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-elevated to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass-strong flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          {experience && <StatusBadge experienceType={experience.experienceType} className="hidden sm:inline-flex" />}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-strong">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-foreground">{tokens}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-strong">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{points}</span>
            </div>
          </div>
        </div>
        <div className="h-1 rounded-full bg-elevated/60 overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <StoryProgress stages={stages} currentIndex={currentStageIdx} />
      </div>

      {/* Der Concierge schaut über die Schulter */}
      <div className="absolute top-32 lg:top-36 left-4 lg:left-6 z-20 pointer-events-auto">
        <ConciergeTip
          narrator={concierge}
          tip={tips[currentStage.id]?.tip}
          nudge={tips[currentStage.id]?.nudge}
          loading={!!tips[currentStage.id]?.loading}
          speaking={speaking}
          onSpeak={() => speakTip(tips[currentStage.id]?.tip)}
          onStop={stopSpeak}
        />
      </div>

      {/* Overlay Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 lg:p-12 pb-40 pointer-events-none">
        <div className={cn("transition-all duration-400", transitioning ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100")}>
          {currentStage.title && (
            <p className="text-xs tracking-[0.15em] uppercase text-primary mb-2">{currentStage.title}</p>
          )}
          {currentStage.overlayText && (
            <p className="font-display text-2xl lg:text-4xl text-foreground mb-4 max-w-2xl">
              {currentStage.overlayText.replace("{name}", displayName)}
            </p>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 lg:p-8 pb-8">
        <div className="max-w-2xl mx-auto">
          {currentStage.triggerType === "CHAT_COUNT" && chatMessages.length > 0 && (
            <div className="mb-4 space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] px-3 py-2 rounded-2xl text-sm", msg.sender === "user" ? "bg-primary text-primary-foreground" : "glass text-foreground")}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentStage.triggerType === "USER_CHOICE" ? (
            <div className="flex flex-col gap-2">
              {stageChoices.map((choice) => (
                <button key={choice.id} onClick={() => handleChoice(choice)} className="w-full py-4 rounded-full glass-strong border border-border text-foreground text-sm font-semibold hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center justify-center gap-2">
                  {choice.label} <ChevronRight className="w-4 h-4" />
                </button>
              ))}
              {stageChoices.length === 0 && (
                <button onClick={handleContinue} className="w-full py-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">Weiter <ChevronRight className="w-4 h-4" /></button>
              )}
            </div>
          ) : currentStage.triggerType === "CHAT_COUNT" ? (
            <div className="flex gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} placeholder={`Chat to continue (${chatCount}/${currentStage.triggerValue || 3})`} className="flex-1 px-5 py-3.5 rounded-full glass-strong border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              <button onClick={handleSendMessage} disabled={!chatInput.trim()} className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0"><Send className="w-5 h-5" /></button>
            </div>
          ) : currentStage.triggerType === "POINTS" ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">{points}/{currentStage.triggerValue || 30} points — tap to build excitement</p>
              <button onClick={handleClickPoints} className="w-32 h-32 rounded-full bg-primary/20 border-2 border-primary text-primary font-semibold text-sm flex items-center justify-center hover:bg-primary/30 transition-all active:scale-95 accent-glow">
                <Sparkles className="w-8 h-8" />
              </button>
            </div>
          ) : currentStage.triggerType === "MANUAL_UNLOCK" ? (
            <button onClick={handleUnlock} disabled={tokens < 5} className="w-full py-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:accent-glow-strong transition-all flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Unlock Next Stage — 5 Tokens
            </button>
          ) : (
            <button onClick={handleContinue} className="w-full py-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:accent-glow-strong transition-all flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}