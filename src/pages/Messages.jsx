import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, ArrowLeft, ImagePlus, Mic, Square, Lock, UserPlus, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
  const [pendingImage, setPendingImage] = useState(null);
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
  const [viewMode, setViewMode] = useState("ai");
  const [dmUsers, setDmUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [dmParticipantName, setDmParticipantName] = useState("");
  const [incomingConversations, setIncomingConversations] = useState([]);
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const dmConvIdsRef = useRef(new Set());
  const activeChatRef = useRef(null);
  const fileInputRef = useRef(null);
  const userPhotoInputRef = useRef(null);
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
      setCreators(creatorData.sort((a, b) => (a.creatorCategory === "REAL" ? 0 : 1) - (b.creatorCategory === "REAL" ? 0 : 1)));
      setContentList(contentData);
      setStories(storyData);
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        const prefs = await base44.entities.UserPreference.filter({ userId: user.id });
        if (prefs.length > 0) setUserPref(prefs[0]);
        const incoming = await base44.entities.Conversation.filter({ participantId: user.id, conversationType: "HUMAN" });
        setIncomingConversations(incoming);
        dmConvIdsRef.current = new Set(incoming.map(c => c.id));
      } catch (e) { /* not logged in or no prefs */ }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    if (viewMode !== "dm" || !activeChat) return;
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversationId === activeChat && event.type === "create") {
        setMessages(prev => {
          const existing = prev[activeChat] || [];
          if (existing.some(m => m.id === event.data.id)) return prev;
          return { ...prev, [activeChat]: [...existing, event.data] };
        });
      }
    });
    return unsubscribe;
  }, [viewMode, activeChat]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type !== "create") return;
      const convId = event.data?.conversationId;
      if (!dmConvIdsRef.current.has(convId)) return;
      if (event.data?.created_by_id === currentUser.id) return;
      if (convId === activeChatRef.current) return;
      toast({ title: "💬 Neue Nachricht", description: "Du hast eine neue Direktnachricht erhalten!" });
    });
    return unsubscribe;
  }, [currentUser, toast]);

  const buildContext = () => {
    const persona = PERSONA_MODES[chatMode];

    // ── SCENARIO ANCHOR #1 (first thing the AI sees) ──
    let scenarioAnchor = "";
    if (scenario && scenario.promptContext) {
      scenarioAnchor = "═══ CURRENT SCENARIO — YOU ARE HERE ═══\n" + scenario.promptContext + "\n\n";
      if (Object.keys(setupAnswers).length > 0) {
        if (setupAnswers.userGender) scenarioAnchor += "USER GENDER: The user is " + setupAnswers.userGender + ". Adapt ALL questions, wardrobe, and roleplay to this gender. NEVER ask a male user about dresses, skirts, or female clothing. NEVER ask a female user about suits or male clothing.\n\n";
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
      scenarioAnchor += "5. WARDROBE CONSISTENCY IS CRITICAL. If the setup says someone is 'Nackt' (naked), they are NAKED — no clothes, no underwear, no towels, bare skin. If the setup says 'Bikini / Unterwäsche', they wear ONLY that. Never add clothes that weren't in the setup. Never dress someone who is naked.\n";
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

  const advanceSetup = () => {
    const q = scenario?.setupQuestions?.[setupStep];
    if (q && q.type !== "multiselect" && setupInput.trim()) {
      setSetupAnswers(prev => ({ ...prev, [q.key]: setupInput }));
    }
    setSetupInput("");
    setSetupStep(prev => prev + 1);
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

  const generateWithFallback = async (prompt, refImages, personaMode) => {
    // For solo female characters: do NOT include the user's body in the image.
    // The viewer wants to imagine themselves there — only HER, max POV hand.
    // For couple/male: user reference images are OK.
    const isSoloFemale = personaMode === "triania";
    let usedRefs = refImages;
    let promptText = prompt;
    if (isSoloFemale) {
      // Only use the creator's own reference images + avatar, not user's uploaded photos
      const creator = creators.find(c => c.id === activeChat);
      const creatorRefs = [
        ...(creator?.referenceImages || []),
        ...(creator?.avatar ? [creator.avatar] : []),
      ].filter(Boolean);
      usedRefs = creatorRefs.length > 0 ? creatorRefs : null;
      promptText = prompt + " CRITICAL: The woman MUST look EXACTLY like the person in the reference images — same face, body type, hair color and style, skin tone, features. She is the SAME person in every image. Only show her, never include a male body or face. At most, her hand reaching toward the camera.";
    } else if (usedRefs && usedRefs.length > 0) {
      promptText = prompt + " CRITICAL: Match the appearance of the person in the reference images — same face, body, hair, skin.";
    }
    if (usedRefs && usedRefs.length > 0) {
      try {
        const result = await base44.integrations.Core.GenerateImage({ prompt: promptText, existing_image_urls: usedRefs });
        return result.url;
      } catch (e) {
        console.error("Image generation with reference failed, retrying without:", e);
      }
    }
    try {
      const result = await base44.integrations.Core.GenerateImage({ prompt: promptText });
      return result.url;
    } catch (e) {
      console.error("Image generation failed, retrying toned-down:", e);
      try {
        const tonedDown = promptText.replace(/hardcore|explicit|cum/gi, "sensual suggestive alluring");
        const result = await base44.integrations.Core.GenerateImage({ prompt: tonedDown });
        return result.url;
      } catch (e2) {
        console.error("Image generation failed completely:", e2);
        return null;
      }
    }
  };

  const parseAndGenerateMedia = async (text, extraRefImages = []) => {
    let cleanText = text;
    let attachment = null;
    let isPPV = false;
    let ppvPrice = null;
    const creator = creators.find(c => c.id === activeChat);
    const creatorRefs = creator?.referenceImages?.length ? creator.referenceImages : [];
    const userRefs = userPref?.userReferenceImages || [];
    const allRefImages = [...creatorRefs, ...extraRefImages, ...userRefs].length ? [...creatorRefs, ...extraRefImages, ...userRefs] : null;

    let imgCtx = "";
    if (scenario) imgCtx += "Location: " + scenario.title + ". ";
    if (setupAnswers.aiWardrobe) imgCtx += "She is wearing: " + setupAnswers.aiWardrobe + ". ";
    if (setupAnswers.aiWardrobe === "Nackt") imgCtx += "She is completely naked — NO clothes at all, bare skin. ";
    if (setupAnswers.position) imgCtx += "Physical positioning: " + setupAnswers.position + ". ";
    if (setupAnswers.fetish && Array.isArray(setupAnswers.fetish) && setupAnswers.fetish.length > 0) imgCtx += "Fetishes/themes: " + setupAnswers.fetish.join(", ") + ". ";

    const ppvMatch = text.match(/\[SEND_PPV:\s*(.+?)\s*\|\s*(\d+(?:\.\d+)?)\s*\]/);
    if (ppvMatch) {
      isPPV = true;
      ppvPrice = parseFloat(ppvMatch[2]);
      cleanText = cleanText.replace(ppvMatch[0], "").trim();
      attachment = await generateWithFallback("POV first person view, amateur phone photo, " + imgCtx + "realistic, natural lighting matching the scene, slightly grainy, raw, intimate, not professional, minimal face visible, teasing and suggestive, focus on a single body part, leave something to the imagination, perfect flawless skin, sexy provocative angle, artistic erotic, sensual, " + ppvMatch[1].trim(), allRefImages, chatMode);
    }

    if (!attachment) {
      const imgMatch = text.match(/\[SEND_IMAGE:\s*(.+?)\s*\]/);
      if (imgMatch) {
        cleanText = cleanText.replace(imgMatch[0], "").trim();
        attachment = await generateWithFallback("POV first person view, amateur phone photo, " + imgCtx + "realistic, natural lighting matching the scene, slightly grainy, raw, intimate, not professional, minimal face visible, teasing and suggestive, focus on a single body part, leave something to the imagination, perfect flawless skin, sexy provocative angle, artistic erotic, sensual, " + imgMatch[1].trim(), allRefImages, chatMode);
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
    const img = pendingImage;
    if ((!msgText.trim() && !img) || !activeChat) return;
    if (viewMode === "dm") { return sendDmMessage(msgText); }
    const chatKey = activeChat;
    const userMsg = { senderType: "HUMAN", text: msgText, attachment: img || null, createdAt: new Date().toISOString() };
    setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), userMsg] }));
    setInput("");
    setPendingImage(null);
    setSending(true);

    try {
      const hist = (messages[chatKey] || []).slice(-12).map(m => {
        let t = m.text || "";
        if (m.attachment) t += t ? " [also sent a photo]" : "[sent a photo]";
        return `${m.senderType === "HUMAN" ? "User" : "You"}: ${t}`;
      }).join("\n");
      const userTurn = img
        ? "\n\nThe user sent you a photo" + (msgText.trim() ? " WITH this message: \"" + msgText + "\"" : "") + ". React to BOTH as one natural reply — answer what they wrote AND react to what you see in the photo. Then generate a response image that incorporates their photo (put yourself in the scene with what they showed you)."
        : "\n\nThe user said: \"" + userMsg.text + "\"";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildContext() + (hist ? "\n\nCONVERSATION SO FAR:\n" + hist : "") + userTurn + (scenario ? "\n\n⚠️ You are in: " + scenario.title + ". Stay in position. Only reference what exists here." : ""),
      });
      const aiText = typeof res === "string" ? res : (res.response || res.text || res.output || "I'll get back to you soon!");
      const delay = 3000 + Math.floor(Math.random() * 2000);
      await new Promise(r => setTimeout(r, delay));
      const { cleanText, attachment, isPPV, ppvPrice, suggestions } = await parseAndGenerateMedia(aiText, img ? [img] : []);
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
    if (!file) return;
    try {
      const result = await base44.integrations.Core.UploadPublicFile({ file });
      setPendingImage(result.file_url);
    } catch (err) {
      console.error(err);
      toast({ title: "Fehler", description: "Bild konnte nicht hochgeladen werden.", variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleUploadUserPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await base44.integrations.Core.UploadPublicFile({ file });
      const file_url = result.file_url;
      const newRefs = [...(userPref?.userReferenceImages || []), file_url];
      let updated;
      if (userPref) {
        updated = await base44.entities.UserPreference.update(userPref.id, { userReferenceImages: newRefs });
      } else {
        const user = await base44.auth.me();
        updated = await base44.entities.UserPreference.create({ userId: user.id, userReferenceImages: newRefs });
      }
      setUserPref(updated);
      toast({ title: "📸 Foto hinzugefügt!", description: "Dein Foto wird jetzt für alle Bildgenerierungen verwendet." });
    } catch (err) {
      console.error(err);
      toast({ title: "Fehler", description: "Foto konnte nicht hochgeladen werden.", variant: "destructive" });
    }
    e.target.value = "";
  };

  const loadDmUsers = async () => {
    try {
      const me = await base44.auth.me();
      const users = await base44.entities.User.list();
      setDmUsers(users.filter(u => u.id !== me.id));
    } catch (e) { console.error(e); }
  };

  const startDm = async (otherUser) => {
    try {
      const me = await base44.auth.me();
      const existing = await base44.entities.Conversation.filter({ userId: me.id, participantId: otherUser.id, conversationType: "HUMAN" });
      let conv;
      if (existing.length > 0) {
        conv = existing[0];
      } else {
        conv = await base44.entities.Conversation.create({ userId: me.id, userName: me.full_name || me.email, participantId: otherUser.id, participantName: otherUser.full_name || otherUser.email, conversationType: "HUMAN" });
      }
      setActiveChat(conv.id);
      setDmParticipantName(otherUser.full_name || otherUser.email);
      const msgs = await base44.entities.Message.filter({ conversationId: conv.id }, "created_date", 100);
      setMessages(prev => ({ ...prev, [conv.id]: msgs }));
    } catch (e) { console.error(e); }
  };

  const sendDmMessage = async (msgText) => {
    if ((!msgText.trim() && !pendingImage) || !activeChat) return;
    const chatKey = activeChat;
    try {
      const me = await base44.auth.me();
      const created = await base44.entities.Message.create({
        conversationId: chatKey,
        sender: me.full_name || me.email,
        senderType: "HUMAN",
        text: msgText,
        attachment: pendingImage || null
      });
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), created] }));
      setInput("");
      setPendingImage(null);
    } catch (e) { console.error(e); }
  };

  const resetChat = () => {
    if (!activeChat) return;
    setMessages(prev => { const next = { ...prev }; delete next[activeChat]; return next; });
    setScenario(null);
    setSetupStep(0);
    setSetupAnswers({});
    setSetupInput("");
    setInput("");
    setPendingImage(null);
    setSending(false);
  };

  const openIncomingDm = async (conv) => {
    const otherUser = dmUsers.find(u => u.id === conv.userId);
    const name = otherUser?.full_name || otherUser?.email || conv.userName || "Unbekannt";
    setActiveChat(conv.id);
    setDmParticipantName(name);
    const msgs = await base44.entities.Message.filter({ conversationId: conv.id }, "created_date", 100);
    setMessages(prev => ({ ...prev, [conv.id]: msgs }));
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-6">Messages</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        <div className={cn("rounded-2xl border border-border bg-card overflow-hidden flex flex-col", activeChat && "hidden lg:block")}>
          <div className="flex gap-1 p-2 border-b border-border">
            <button onClick={() => { setViewMode("ai"); setActiveChat(null); setDmParticipantName(""); }} className={cn("flex-1 py-1.5 rounded-full text-xs font-medium transition-colors", viewMode === "ai" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Chats</button>
            <button onClick={() => { setViewMode("dm"); setActiveChat(null); loadDmUsers(); }} className={cn("flex-1 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center justify-center gap-1.5", viewMode === "dm" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Direct Messages{incomingConversations.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{incomingConversations.length}</span>}</button>
          </div>
          <div className="overflow-y-auto flex-1">
            {viewMode === "ai" ? (
              <>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Real</p>
              {creators.filter(c => c.creatorCategory === "REAL" && c.stageName !== "Testdummy").map(c => (
                <button key={c.id} onClick={() => { setActiveChat(c.id); setChatMode(c.personaType === "SOLO_MALE" ? "artanis" : c.personaType === "COUPLE" ? "couple" : "triania"); setScenario(null); setSetupStep(0); setSetupAnswers({}); }} className={cn("w-full p-4 flex items-center gap-3 border-b border-border text-left transition-colors", activeChat === c.id ? "bg-primary/10" : "hover:bg-elevated")}>
                  {c.avatar ? (
                    <Image src={c.avatar} fittingType="fill" className="w-10 h-10 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary flex-shrink-0">{c.stageName[0]}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.stageName}</p>
                    <p className="text-xs text-muted-foreground">Real · AI persona</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-semibold uppercase flex-shrink-0">Real</span>
                </button>
              ))}
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">KI-Modelle</p>
              {creators.filter(c => c.creatorCategory === "AI_MODEL" && c.stageName !== "Testdummy").map(c => (
                <button key={c.id} onClick={() => { setActiveChat(c.id); setChatMode(c.personaType === "SOLO_MALE" ? "artanis" : c.personaType === "COUPLE" ? "couple" : "triania"); setScenario(null); setSetupStep(0); setSetupAnswers({}); }} className={cn("w-full p-4 flex items-center gap-3 border-b border-border text-left transition-colors", activeChat === c.id ? "bg-primary/10" : "hover:bg-elevated")}>
                  {c.avatar ? (
                    <Image src={c.avatar} fittingType="fill" className="w-10 h-10 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary flex-shrink-0">{c.stageName[0]}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.stageName}</p>
                    <p className="text-xs text-muted-foreground">KI-Modell</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-violet-600/90 text-white text-[10px] font-semibold uppercase flex-shrink-0">KI</span>
                </button>
              ))}
              </>
            ) : (
              <>
              {incomingConversations.length > 0 && (
                <>
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-primary">Will mit dir chatten</p>
                {incomingConversations.map(conv => {
                  const otherUser = dmUsers.find(u => u.id === conv.userId);
                  const name = otherUser?.full_name || otherUser?.email || conv.userName || "Unbekannt";
                  return (
                    <button key={conv.id} onClick={() => openIncomingDm(conv)} className={cn("w-full p-4 flex items-center gap-3 border-b border-border text-left transition-colors", activeChat === conv.id ? "bg-primary/10" : "hover:bg-elevated")}>
                      <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center font-display text-emerald-400 flex-shrink-0">{(name || "?")[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <p className="text-xs text-primary">Will mit dir chatten — klicken zum Öffnen</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase flex-shrink-0">Neu</span>
                    </button>
                  );
                })}
                </>
              )}
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Nutzer</p>
              {dmUsers.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">Keine anderen Nutzer verfügbar</p>
              ) : (
                dmUsers.map(u => (
                  <button key={u.id} onClick={() => startDm(u)} className={cn("w-full p-4 flex items-center gap-3 border-b border-border text-left transition-colors hover:bg-elevated")}>
                    <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary flex-shrink-0">{(u.full_name || u.email || "?")[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground">Direct message</p>
                    </div>
                  </button>
                ))
              )}
              </>
            )}
          </div>
        </div>

        <div className={cn("lg:col-span-2 rounded-2xl border border-border bg-card flex flex-col", !activeChat && "hidden lg:flex")}>
          {activeChat ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="lg:hidden"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
                {viewMode === "dm" ? (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-display text-primary">{(dmParticipantName || "?")[0]}</div>
                ) : creators.find(c => c.id === activeChat)?.avatar ? (
                  <Image src={creators.find(c => c.id === activeChat).avatar} fittingType="fill" className="w-10 h-10 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary">{creators.find(c => c.id === activeChat)?.stageName[0]}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{viewMode === "dm" ? dmParticipantName : creators.find(c => c.id === activeChat)?.stageName}</p>
                  <p className="text-xs text-muted-foreground">{viewMode === "dm" ? "Direct message — real person" : (creators.find(c => c.id === activeChat)?.creatorCategory === "REAL" ? "Real · AI persona" : "KI-Modell · AI chat")}</p>
                </div>
                {viewMode === "ai" && <StatusBadge experienceType="AI_INTERACTIVE" className="flex-shrink-0" />}
                {viewMode === "ai" && scenario && (
                  <button onClick={() => { setScenario(null); setSetupStep(0); setSetupAnswers({}); }} className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full bg-elevated whitespace-nowrap flex items-center gap-1">
                    {scenario.id === "free" ? "💬" : scenario.icon} {scenario.title}
                  </button>
                )}
                <button onClick={resetChat} title="Chat zurücksetzen" className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {viewMode === "ai" && !scenario ? (
                <ScenarioSelection onSelect={(s) => { setScenario(s); setSetupStep(0); setSetupAnswers({}); }} />
              ) : viewMode === "ai" && (scenario.setupQuestions && setupStep < scenario.setupQuestions.length) ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
                  <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{scenario.setupQuestions[setupStep].question}</p>
                  {scenario.setupQuestions[setupStep].type === "select" && (
                    <div className="flex flex-wrap gap-2 w-full max-w-lg justify-center mb-4">
                      {scenario.setupQuestions[setupStep].options.map(opt => (
                        <button key={opt} onClick={() => { const q = scenario.setupQuestions[setupStep]; setSetupAnswers(prev => ({ ...prev, [q.key]: opt })); setSetupInput(""); setSetupStep(prev => prev + 1); }} className="px-4 py-2 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">{opt}</button>
                      ))}
                    </div>
                  )}
                  {scenario.setupQuestions[setupStep].type === "multiselect" && (() => {
                    const q = scenario.setupQuestions[setupStep];
                    const selected = setupAnswers[q.key] || [];
                    return (
                      <div className="w-full max-w-lg mb-4">
                        <div className="flex flex-wrap gap-2 justify-center">
                          {q.options.map(opt => {
                            const isSelected = Array.isArray(selected) && selected.includes(opt);
                            return (
                              <button key={opt} onClick={() => {
                                setSetupAnswers(prev => {
                                  const cur = Array.isArray(prev[q.key]) ? prev[q.key] : [];
                                  const next = cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt].slice(0, 40);
                                  return { ...prev, [q.key]: next };
                                });
                              }} className={cn("px-4 py-2 rounded-full border text-sm transition-colors", isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground hover:border-primary/50")}>{isSelected ? "✓ " : ""}{opt}</button>
                            );
                          })}
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-3">{Array.isArray(selected) ? selected.length : 0} ausgewählt</p>
                        <div className="flex justify-center mt-3">
                          <button onClick={advanceSetup} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Weiter</button>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex gap-2 w-full max-w-md">
                    <input type="text" value={setupInput} onChange={(e) => setSetupInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") advanceSetup(); }} placeholder="Oder eigene Antwort..." className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none" autoFocus />
                    <button onClick={advanceSetup} className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Weiter</button>
                  </div>
                  <div className="flex gap-4 mt-3">
                    <button onClick={() => { setSetupInput(""); setSetupStep(prev => prev + 1); }} className="text-xs text-muted-foreground hover:text-foreground">Frage überspringen</button>
                    <button onClick={() => setSetupStep(scenario.setupQuestions.length)} className="text-xs text-muted-foreground hover:text-foreground">Alle überspringen</button>
                  </div>
                </div>
              ) : (
              <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages[activeChat] || (viewMode === "dm" ? [] : [{ senderType: "SYSTEM", text: "This is an AI assistant. Messages from the real creator will be marked differently." }])).map((msg, i, arr) => {
                  const isLastAi = viewMode === "ai" && msg.senderType === "AI" && !sending && arr.slice(i + 1).every(m => m.senderType !== "AI");
                  return (
                  <div key={i} className={cn("flex gap-2", (viewMode === "dm" ? msg.created_by_id === currentUser?.id : msg.senderType === "HUMAN") ? "justify-end" : "justify-start")}>
                    {(viewMode === "dm" ? msg.created_by_id !== currentUser?.id : msg.senderType !== "HUMAN") && (
                      viewMode === "dm" ? (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"><span className="text-xs font-display text-primary">{(dmParticipantName || "?")[0]}</span></div>
                      ) : creators.find(c => c.id === activeChat)?.avatar ? (
                        <Image src={creators.find(c => c.id === activeChat).avatar} fittingType="fill" className="w-8 h-8 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0"><span className="text-xs font-display text-violet-400">{creators.find(c => c.id === activeChat)?.stageName[0]}</span></div>
                      )
                    )}
                    <div className={cn("max-w-[70%] px-4 py-2.5 rounded-2xl text-sm", (viewMode === "dm" ? msg.created_by_id === currentUser?.id : msg.senderType === "HUMAN") ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground")}>
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="block mb-1"><Image src={msg.attachment} fittingType="fill" className="w-48 h-48 rounded-lg transition-opacity hover:opacity-80" /></button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-0 bg-background/95 overflow-hidden">
                              <img src={msg.attachment} alt="" className="w-full h-full object-contain max-h-[85vh] rounded-lg" />
                            </DialogContent>
                          </Dialog>
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
              {viewMode === "ai" && <QuickActions onAction={(text) => sendMessage(text)} disabled={sending} scenario={scenario} />}
              {pendingImage && (
                <div className="px-4 pt-3 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <Image src={pendingImage} fittingType="fill" className="w-16 h-16 rounded-lg" />
                    <button onClick={() => setPendingImage(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs leading-none">×</button>
                  </div>
                  <span className="text-xs text-muted-foreground">Bild angehängt — schreib was dazu oder sende direkt.</span>
                </div>
              )}
              <div className="p-4 border-t border-border flex gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <input ref={userPhotoInputRef} type="file" accept="image/*" onChange={handleUploadUserPhoto} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={sending || isRecording} className="w-10 h-10 rounded-full bg-elevated text-muted-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0 hover:text-foreground transition-colors"><ImagePlus className="w-4 h-4" /></button>
                {viewMode === "ai" && <button onClick={() => userPhotoInputRef.current?.click()} disabled={sending} className="relative w-10 h-10 rounded-full bg-elevated text-muted-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0 hover:text-foreground transition-colors" title="Deine Referenzfotos (werden für Bildgenerierungen verwendet)"><UserPlus className="w-4 h-4" />{userPref?.userReferenceImages?.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{userPref.userReferenceImages.length}</span>}</button>}
                <button onClick={toggleRecording} disabled={sending} className={cn("w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 flex-shrink-0 transition-colors", isRecording ? "bg-red-500 text-white animate-pulse" : "bg-elevated text-muted-foreground hover:text-foreground")}>{isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
                <input type="text" value={isRecording ? "" : input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder={transcribing ? "Transkribiere Audio..." : isRecording ? "Aufnahme läuft — Mikrofon tippen zum Stoppen" : "Nachricht schreiben oder sprechen..."} disabled={isRecording || transcribing} className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none disabled:opacity-60" />
                <button onClick={() => sendMessage()} disabled={(!input.trim() && !pendingImage) || sending} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0"><Send className="w-4 h-4" /></button>
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