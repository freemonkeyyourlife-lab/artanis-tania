import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, ArrowLeft, ImagePlus, Mic, Square, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { PERSONA_MODES } from "@/lib/personaPrompts";
import ScenarioSelection from "@/components/ScenarioSelection";
import QuickActions from "@/components/QuickActions";

export default function Messages() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatMode, setChatMode] = useState("artanis");
  const [contentList, setContentList] = useState([]);
  const [stories, setStories] = useState([]);
  const [userPref, setUserPref] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [scenario, setScenario] = useState(null);
  const [setupStep, setSetupStep] = useState(0);
  const [setupAnswers, setSetupAnswers] = useState({});
  const [setupInput, setSetupInput] = useState("");
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [creatorData, contentData, storyData] = await Promise.all([
        base44.entities.Creator.list(),
        base44.entities.Content.filter({ published: true }, "-created_date", 20),
        base44.entities.Story.filter({ published: true }, "-created_date", 20)
      ]);
      setCreators(creatorData);
      setContentList(contentData);
      setStories(storyData);
      try {
        const user = await base44.auth.me();
        const prefs = await base44.entities.UserPreference.filter({ userId: user.id });
        if (prefs.length > 0) setUserPref(prefs[0]);
      } catch (e) { /* not logged in or no prefs */ }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const buildContext = () => {
    const persona = PERSONA_MODES[chatMode];

    // ── SCENARIO ANCHOR #1 (first thing the AI sees) ──
    let scenarioAnchor = "";
    if (scenario && scenario.promptContext) {
      scenarioAnchor = "═══ CURRENT SCENARIO — YOU ARE HERE ═══\n" + scenario.promptContext + "\n\n";
      if (Object.keys(setupAnswers).length > 0) {
        scenarioAnchor += "ESTABLISHED FACTS (FIXED — never contradict, never teleport, never change):\n";
        scenario.setupQuestions.forEach(q => {
          if (setupAnswers[q.key]) scenarioAnchor += `• ${q.question} → ${setupAnswers[q.key]}\n`;
        });
        scenarioAnchor += "\n";
      }
      scenarioAnchor += "SPATIAL RULES (CRITICAL — breaking these ruins the experience):\n";
      scenarioAnchor += "1. You are in this scenario. Never leave it, never change the location mid-conversation.\n";
      scenarioAnchor += "2. Only reference objects that EXIST in this location. A taxi has a backseat, seatbelts, a partition, windows — but NO table, NO bed, NO couch. A cinema has seats, armrests, darkness — no bed. If there's no table, don't say 'unter dem Tisch'. Use what's actually there.\n";
      scenarioAnchor += "3. Stay in the physical position established above. If she sits in the back seat, she STAYS in the back seat. Never teleport to the front seat or next to the driver. Never change positions without narrating the movement step by step.\n";
      scenarioAnchor += "4. For [SEND_IMAGE], only describe what the user would actually see from their position in THIS specific location. The wardrobe and angle MUST match the setup answers.\n";
      scenarioAnchor += "═══ END SCENARIO ═══\n\n";
    }

    let ctx = scenarioAnchor + persona.prompt;

    // Override name/bio for custom characters (Lena, Mia, etc.)
    const activeCreator = creators.find(c => c.id === activeChat);
    if (activeCreator && !["Artanis", "Triania", "Artanis × Triania"].includes(activeCreator.stageName)) {
      ctx += `\n\nIMPORTANT: Your name is ${activeCreator.stageName} — NOT Triania or Artanis. You are ${activeCreator.stageName}. ${activeCreator.bio || ""} You are a friend of Triania's. Use the personality template above, but your identity is ${activeCreator.stageName}. When you refer to yourself, use the name ${activeCreator.stageName}.`;
    }

    if (contentList.length > 0) {
      ctx += "\n\nAVAILABLE CONTENT (offer matching items when the user's fantasy aligns — use the exact title):\n" +
        contentList.map(c => {
          const price = c.isFree ? 'free' : (c.price || 0) > 0 ? `${c.price}€` : 'free';
          return `- "${c.title}" — ${c.contentType.replace(/_/g, ' ').toLowerCase()}, ${price}`;
        }).join('\n');
    }
    if (stories.length > 0) {
      ctx += "\n\nYOUR STORIES (tell these as your own experiences when the topic aligns — as if you were there. Don't quote them, retell naturally in your voice):\n" +
        stories.map(s => {
          const content = s.content ? s.content.substring(0, 800) : s.preview || "";
          return `### "${s.title}"\n${content}`;
        }).join('\n\n');
    }
    if (userPref) {
      ctx += "\n\nUSER PREFERENCES (adapt to these — this is what the user is into, focus on their interests and ask about them):\n";
      if (userPref.interests?.length) ctx += `- Interests: ${userPref.interests.join(", ")}\n`;
      if (userPref.topicsToDiscuss?.length) ctx += `- Wants to discuss: ${userPref.topicsToDiscuss.join(", ")}\n`;
      if (userPref.sexualPreferences?.length) ctx += `- Sexual preferences: ${userPref.sexualPreferences.join(", ")}\n`;
      if (userPref.whatTheyWantToSee) ctx += `- Wants to see: ${userPref.whatTheyWantToSee}\n`;
      if (userPref.fantasyDescription) ctx += `- Fantasies: ${userPref.fantasyDescription}\n`;
    }
    // ── SCENARIO ANCHOR #3 (last thing the AI sees — triple-anchored) ──
    if (scenario) {
      ctx += "\n\n⚠️ FINAL REMINDER: You are in the scenario \"" + scenario.title + "\". Stay in the established location and position. Do NOT teleport, do NOT change position, do NOT reference objects that don't exist in this scene. Only describe what's physically possible here.";
    }
    return ctx;
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        setTranscribing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioFile = new File([audioBlob], "voice.webm", { type: "audio/webm" });
          const uploadResult = await base44.integrations.Core.UploadPublicFile({ file: audioFile });
          const transcriptRes = await base44.integrations.Core.TranscribeAudio({ audio_url: uploadResult.file_url });
          const text = typeof transcriptRes === "string" ? transcriptRes : (transcriptRes.transcript || transcriptRes.text || transcriptRes.output || "");
          if (text) setInput(prev => prev ? prev + " " + text : text);
        } catch (e) {
          console.error(e);
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
    }
  };

  const generateWithFallback = async (prompt, refImages) => {
    if (refImages && refImages.length > 0) {
      try {
        const result = await base44.integrations.Core.GenerateImage({ prompt, existing_image_urls: refImages });
        return result.url;
      } catch (e) {
        console.error("Image generation with reference failed, retrying without:", e);
      }
    }
    try {
      const result = await base44.integrations.Core.GenerateImage({ prompt });
      return result.url;
    } catch (e) {
      console.error("Image generation failed:", e);
      return null;
    }
  };

  const parseAndGenerateMedia = async (text, extraRefImages = []) => {
    let cleanText = text;
    let attachment = null;
    let isPPV = false;
    let ppvPrice = null;
    const creator = creators.find(c => c.id === activeChat);
    const creatorRefs = creator?.referenceImages?.length ? creator.referenceImages : [];
    const allRefImages = [...creatorRefs, ...extraRefImages].length ? [...creatorRefs, ...extraRefImages] : null;

    const ppvMatch = text.match(/\[SEND_PPV:\s*(.+?)\s*\|\s*(\d+(?:\.\d+)?)\s*\]/);
    if (ppvMatch) {
      isPPV = true;
      ppvPrice = parseFloat(ppvMatch[2]);
      cleanText = cleanText.replace(ppvMatch[0], "").trim();
      attachment = await generateWithFallback("POV first person view, amateur phone photo, " + (scenario ? "location: " + scenario.title + ". " : "") + "realistic, natural lighting matching the scene, slightly grainy, raw, intimate, not professional, minimal face visible, mysterious, suggestive not explicit, " + ppvMatch[1].trim(), allRefImages);
    }

    if (!attachment) {
      const imgMatch = text.match(/\[SEND_IMAGE:\s*(.+?)\s*\]/);
      if (imgMatch) {
        cleanText = cleanText.replace(imgMatch[0], "").trim();
        attachment = await generateWithFallback("POV first person view, amateur phone photo, " + (scenario ? "location: " + scenario.title + ". " : "") + "realistic, natural lighting matching the scene, slightly grainy, raw, intimate, not professional, minimal face visible, mysterious, suggestive not explicit, " + imgMatch[1].trim(), allRefImages);
      }
    }

    let suggestions = [];
    const suggestMatch = cleanText.match(/\[SUGGEST:\s*(.+?)\s*\]/);
    if (suggestMatch) {
      suggestions = suggestMatch[1].split("|").map(s => s.trim()).filter(Boolean);
      cleanText = cleanText.replace(suggestMatch[0], "").trim();
    }

    return { cleanText, attachment, isPPV, ppvPrice, suggestions };
  };

  const sendMessage = async (overrideText) => {
    const msgText = overrideText || input;
    if (!msgText.trim() || !activeChat) return;
    const chatKey = activeChat;
    const userMsg = { senderType: "HUMAN", text: msgText, createdAt: new Date().toISOString() };
    setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), userMsg] }));
    setInput("");
    setSending(true);

    try {
      const hist = (messages[chatKey] || []).slice(-12).map(m => {
        let t = m.text || "";
        if (m.attachment) t += t ? " [also sent a photo]" : "[sent a photo]";
        return `${m.senderType === "HUMAN" ? "User" : "You"}: ${t}`;
      }).join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildContext() + (hist ? "\n\nCONVERSATION SO FAR:\n" + hist : "") + "\n\nThe user said: \"" + userMsg.text + "\"" + (scenario ? "\n\n⚠️ You are in: " + scenario.title + ". Stay in position. Only reference what exists here." : ""),
      });
      const aiText = typeof res === "string" ? res : (res.response || res.text || res.output || "I'll get back to you soon!");
      const delay = 3000 + Math.floor(Math.random() * 2000);
      await new Promise(r => setTimeout(r, delay));
      const { cleanText, attachment, isPPV, ppvPrice, suggestions } = await parseAndGenerateMedia(aiText);
      const aiMsg = { senderType: "AI", text: cleanText, attachment, isPPV, ppvPrice, suggestions, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));

      const userMsgCount = [...(messages[chatKey] || []), userMsg].filter(m => m.senderType === "HUMAN").length;
      if (userMsgCount > 0 && userMsgCount % 5 === 0) {
        toast({
          title: "🎁 Belohnung freigeschaltet!",
          description: `Du hast ${userMsgCount} Nachrichten gesendet! Exklusive Inhalte wurden für dich freigeschaltet.`,
        });
      }
    } catch (e) {
      const aiMsg = { senderType: "AI", text: "I'm here and ready to chat! What would you like to talk about?", createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));
    } finally {
      setSending(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    const chatKey = activeChat;
    setSending(true);
    try {
      const result = await base44.integrations.Core.UploadPublicFile({ file });
      const file_url = result.file_url;
      const userMsg = { senderType: "HUMAN", text: "", attachment: file_url, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), userMsg] }));
      const delay = 3000 + Math.floor(Math.random() * 2000);
      await new Promise(r => setTimeout(r, delay));
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildContext() + "\n\nThe user sent you a photo. React enthusiastically — tell them what you see or imagine, how it makes you feel, and ask them something about it. IMPORTANT: Generate a response image that incorporates the user's photo as visual reference — put yourself in the scene with what they showed you. For example, if they sent a dick pic, use [SEND_IMAGE: POV, your hand wrapped around his hard cock] or [SEND_IMAGE: POV, looking down at him, your hand on him]. If they sent their body, generate an image with you next to them or touching them. The response image should feel like you're physically interacting with what they showed you. Match the user's language.",
      });
      const aiText = typeof res === "string" ? res : (res.response || res.text || res.output || "Sieht geil aus!");
      const { cleanText, attachment, isPPV, ppvPrice, suggestions } = await parseAndGenerateMedia(aiText, [file_url]);
      const aiMsg = { senderType: "AI", text: cleanText, attachment, isPPV, ppvPrice, suggestions, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));

      const userMsgCount = [...(messages[chatKey] || []), userMsg].filter(m => m.senderType === "HUMAN").length;
      if (userMsgCount > 0 && userMsgCount % 5 === 0) {
        toast({
          title: "🎁 Belohnung freigeschaltet!",
          description: `Du hast ${userMsgCount} Nachrichten gesendet! Exklusive Inhalte wurden für dich freigeschaltet.`,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
      e.target.value = "";
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-6">Messages</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        <div className={cn("rounded-2xl border border-border bg-card overflow-y-auto", activeChat && "hidden lg:block")}>
          {creators.map(c => (
            <button key={c.id} onClick={() => { setActiveChat(c.id); const n = c.stageName.toLowerCase(); setChatMode(c.personaType === "SOLO_MALE" ? "artanis" : c.personaType === "COUPLE" ? "couple" : "triania"); setScenario(null); setSetupStep(0); setSetupAnswers({}); }} className={cn("w-full p-4 flex items-center gap-3 border-b border-border text-left transition-colors", activeChat === c.id ? "bg-primary/10" : "hover:bg-elevated")}>
              {c.avatar ? (
                <Image src={c.avatar} fittingType="fill" className="w-10 h-10 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary flex-shrink-0">{c.stageName[0]}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.stageName}</p>
                <p className="text-xs text-muted-foreground">{c.onlineStatus === "AI_AVAILABLE" ? "AI Available" : c.onlineStatus}</p>
              </div>
              {c.onlineStatus === "AI_AVAILABLE" && <StatusBadge experienceType="AI_INTERACTIVE" />}
            </button>
          ))}
        </div>

        <div className={cn("lg:col-span-2 rounded-2xl border border-border bg-card flex flex-col", !activeChat && "hidden lg:flex")}>
          {activeChat ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="lg:hidden"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
                {creators.find(c => c.id === activeChat)?.avatar ? (
                  <Image src={creators.find(c => c.id === activeChat).avatar} fittingType="fill" className="w-10 h-10 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary">{creators.find(c => c.id === activeChat)?.stageName[0]}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{creators.find(c => c.id === activeChat)?.stageName}</p>
                  <p className="text-xs text-muted-foreground">{PERSONA_MODES[chatMode].label} mode — AI chat</p>
                </div>
                <StatusBadge experienceType="AI_INTERACTIVE" className="flex-shrink-0" />
                {scenario && (
                  <button onClick={() => { setScenario(null); setSetupStep(0); setSetupAnswers({}); }} className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full bg-elevated whitespace-nowrap flex items-center gap-1">
                    {scenario.id === "free" ? "💬" : scenario.icon} {scenario.title}
                  </button>
                )}
              </div>
              {["Artanis", "Triania", "Artanis × Triania"].includes(creators.find(c => c.id === activeChat)?.stageName) && (
              <div className="px-4 pb-3 flex gap-1.5 border-b border-border overflow-x-auto scrollbar-hide">
                {Object.entries(PERSONA_MODES).map(([key, mode]) => (
                  <button key={key} onClick={() => setChatMode(key)} className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap", chatMode === key ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}>{mode.label}</button>
                ))}
              </div>
              )}
              {!scenario ? (
                <ScenarioSelection onSelect={(s) => { setScenario(s); setSetupStep(0); setSetupAnswers({}); }} />
              ) : (scenario.setupQuestions && setupStep < scenario.setupQuestions.length) ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
                  <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{scenario.setupQuestions[setupStep].question}</p>
                  {scenario.setupQuestions[setupStep].type === "select" && (
                    <div className="flex flex-wrap gap-2 w-full max-w-lg justify-center mb-4">
                      {scenario.setupQuestions[setupStep].options.map(opt => (
                        <button key={opt} onClick={() => { const q = scenario.setupQuestions[setupStep]; setSetupAnswers(prev => ({ ...prev, [q.key]: opt })); setSetupInput(""); setSetupStep(prev => prev + 1); }} className="px-4 py-2 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">{opt}</button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 w-full max-w-md">
                    <input type="text" value={setupInput} onChange={(e) => setSetupInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && setupInput.trim()) { const q = scenario.setupQuestions[setupStep]; setSetupAnswers(prev => ({ ...prev, [q.key]: setupInput })); setSetupInput(""); setSetupStep(prev => prev + 1); } }} placeholder="Oder eigene Antwort..." className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none" autoFocus />
                    <button onClick={() => { if (setupInput.trim()) { const q = scenario.setupQuestions[setupStep]; setSetupAnswers(prev => ({ ...prev, [q.key]: setupInput })); setSetupInput(""); setSetupStep(prev => prev + 1); } }} className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Weiter</button>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <button onClick={() => { setSetupInput(""); setSetupStep(prev => prev + 1); }} className="text-xs text-muted-foreground hover:text-foreground">Frage überspringen</button>
                    <button onClick={() => setSetupStep(scenario.setupQuestions.length)} className="text-xs text-muted-foreground hover:text-foreground">Alle überspringen</button>
                  </div>
                </div>
              ) : (
              <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages[activeChat] || [{ senderType: "SYSTEM", text: "This is an AI assistant. Messages from the real creator will be marked differently." }]).map((msg, i, arr) => {
                  const isLastAi = msg.senderType === "AI" && !sending && arr.slice(i + 1).every(m => m.senderType !== "AI");
                  return (
                  <div key={i} className={cn("flex gap-2", msg.senderType === "HUMAN" ? "justify-end" : "justify-start")}>
                    {msg.senderType !== "HUMAN" && (
                      creators.find(c => c.id === activeChat)?.avatar ? (
                        <Image src={creators.find(c => c.id === activeChat).avatar} fittingType="fill" className="w-8 h-8 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0"><span className="text-xs font-display text-violet-400">{creators.find(c => c.id === activeChat)?.stageName[0]}</span></div>
                      )
                    )}
                    <div className={cn("max-w-[70%] px-4 py-2.5 rounded-2xl text-sm", msg.senderType === "HUMAN" ? "bg-primary text-primary-foreground" : msg.senderType === "AI" ? "bg-elevated text-foreground" : "bg-transparent text-muted-foreground text-xs italic")}>
                      {msg.attachment && (
                        msg.isPPV ? (
                          <div className="relative w-48 h-48 rounded-lg mb-1 overflow-hidden">
                            <Image src={msg.attachment} fittingType="fill" className="w-full h-full blur-2xl scale-110" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-1">
                              <Lock className="w-5 h-5 text-primary" />
                              <span className="text-sm text-foreground font-semibold">{msg.ppvPrice}€</span>
                              <button className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:opacity-90">Freischalten</button>
                            </div>
                          </div>
                        ) : (
                          <Image src={msg.attachment} fittingType="fill" className="w-48 h-48 rounded-lg mb-1" />
                        )
                      )}
                      {msg.text}
                      {msg.suggestions && msg.suggestions.length > 0 && isLastAi && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.suggestions.map((s, si) => (
                            <button key={si} onClick={() => sendMessage(s)} className="px-3 py-1.5 rounded-full bg-background border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
                {sending && (
                  <div className="flex gap-2 justify-start">
                    {creators.find(c => c.id === activeChat)?.avatar ? (
                      <Image src={creators.find(c => c.id === activeChat).avatar} fittingType="fill" className="w-8 h-8 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0"><span className="text-xs font-display text-violet-400">{creators.find(c => c.id === activeChat)?.stageName[0]}</span></div>
                    )}
                    <div className="bg-elevated rounded-2xl px-4 py-3 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <QuickActions onAction={(text) => sendMessage(text)} disabled={sending} />
              <div className="p-4 border-t border-border flex gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={sending || isRecording} className="w-10 h-10 rounded-full bg-elevated text-muted-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0 hover:text-foreground transition-colors"><ImagePlus className="w-4 h-4" /></button>
                <button onClick={toggleRecording} disabled={sending} className={cn("w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 flex-shrink-0 transition-colors", isRecording ? "bg-red-500 text-white animate-pulse" : "bg-elevated text-muted-foreground hover:text-foreground")}>{isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
                <input type="text" value={isRecording ? "" : input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder={transcribing ? "Transkribiere Audio..." : isRecording ? "Aufnahme läuft — Mikrofon tippen zum Stoppen" : "Nachricht schreiben oder sprechen..."} disabled={isRecording || transcribing} className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none disabled:opacity-60" />
                <button onClick={() => sendMessage()} disabled={!input.trim() || sending} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0"><Send className="w-4 h-4" /></button>
              </div>
              </>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Select a conversation to start chatting</p></div>
          )}
        </div>
      </div>
    </div>
  );
}