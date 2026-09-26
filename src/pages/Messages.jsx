import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, ArrowLeft, ImagePlus, Mic, Square, Lock, UserPlus, RotateCcw, ArrowDown, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { PERSONA_MODES } from "@/lib/personaPrompts";
import ScenarioSelection from "@/components/ScenarioSelection";
import VoiceInput from "@/components/VoiceInput";
import QuickActions from "@/components/QuickActions";
import { parseReply, consumeFree, freeRemaining, FREE_CREATIONS } from "@/lib/chatMedia";
import CharacterSuggestion from "@/components/CharacterSuggestion";
import ReadAloudButton from "@/components/ReadAloudButton";
import DownloadButton from "@/components/DownloadButton";
import { coinsForPrice } from "@/lib/coins";
import { APPEARANCE_DIRECTIVE, CHARACTER_ALLURE, CONSISTENCY_RULES, EROTIC_CRAFT, IMAGE_CONSISTENCY } from "@/lib/appearance";
import { Link } from "react-router-dom";

const LANGUAGE_RULE =
  "═══ SPRACHE — NUR DEUTSCH ═══\n" +
  "Du antwortest IMMER auf Deutsch — jede Antwort, jede Frage, jede [SUGGEST: ...]-Option, jede [SEND_IMAGE: ...]- und [SEND_VIDEO: ...]-Beschreibung, jede [SEND_VOICE: ...]-Zeile und jedes [SEND_PPV: ...]-Label. Nie auf Englisch. Wechsle die Sprache niemals mitten im Chat — auch dann nicht, wenn der Nutzer englisch oder in einer anderen Sprache schreibt; antworte dann trotzdem auf Deutsch.\n" +
  "Schreib natürliches, lockeres Deutsch in der Du-Form, so wie ein echter Mensch textet. Kein Übersetzungs-Deutsch, keine englischen Wörter dazwischen (außer Namen und Dinge, die wirklich kein deutsches Wort haben).\n" +
  "═══ ENDE SPRACHE ═══\n\n";

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
  const [freeLeft, setFreeLeft] = useState(FREE_CREATIONS);
  const [extraCharacters, setExtraCharacters] = useState([]);
  const [takeover, setTakeover] = useState(false);
  const [spannerMode, setSpannerMode] = useState(false);
  const [incomingConversations, setIncomingConversations] = useState([]);
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const dmConvIdsRef = useRef(new Set());
  const activeChatRef = useRef(null);
  const aiConvsRef = useRef({});
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    if (status === "success") {
      toast({ title: "Zahlung erfolgreich", description: "Dein Zugang ist freigeschaltet." });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (status === "cancel") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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
        setFreeLeft(freeRemaining(user.id));
        const prefs = await base44.entities.UserPreference.filter({ userId: user.id });
        if (prefs.length > 0) setUserPref(prefs[0]);
        const incoming = await base44.entities.Conversation.filter({ participantId: user.id, conversationType: "HUMAN" });
        setIncomingConversations(incoming);
        dmConvIdsRef.current = new Set(incoming.map(c => c.id));
        const aiConvsData = await base44.entities.Conversation.filter({ userId: user.id, conversationType: "AI" });
        const convMap = {};
        aiConvsData.forEach((c) => { if (c.creatorId) convMap[c.creatorId] = c; });
        aiConvsRef.current = convMap;
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
    setExtraCharacters([]);
    setTakeover(false);
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
      scenarioAnchor += "1. You START in this scenario. The user can change the location or move on at any time — follow their lead, narrate the transition naturally, then continue in the new place. Never resist a location change.\n";
      scenarioAnchor += "2. Only reference objects that EXIST in this location. A taxi has a backseat, seatbelts, a partition, windows — but NO table, NO bed, NO couch. A cinema has seats, armrests, darkness — no bed. If there's no table, don't say 'unter dem Tisch'. Use what's actually there.\n";
      scenarioAnchor += "3. Stay in the physical position established above. If she sits in the back seat, she STAYS in the back seat. Never teleport to the front seat or next to the driver. Never change positions without narrating the movement step by step.\n";
      scenarioAnchor += "4. For [SEND_IMAGE], only describe what the user would actually see from their position in THIS specific location. The wardrobe and angle MUST match the setup answers.\n";
      scenarioAnchor += "5. WARDROBE CONSISTENCY IS CRITICAL. If the setup says someone is 'Nackt' (naked), they are NAKED — no clothes, no underwear, no towels, bare skin. If the setup says 'Bikini / Unterwäsche', they wear ONLY that. Never add clothes that weren't in the setup. Never dress someone who is naked.\n";
      scenarioAnchor += "═══ END SCENARIO ═══\n\n";
    }

    let ctx = scenarioAnchor + LANGUAGE_RULE + persona.prompt;

    // Override name/bio for custom characters (Lena, Mia, etc.)
    const activeCreator = creators.find(c => c.id === activeChat);
    if (activeCreator && activeCreator.personaType === "GROUP") {
      ctx += "\n\n═══ GROUP SCENE — you are SEVERAL people at once ═══\n";
      ctx += `This is the group "${activeCreator.stageName}". Everyone described here is present and speaks for herself.\n`;
      ctx += (activeCreator.bio || "") + "\n";
      ctx += "RULES: Start EVERY spoken line with the speaker's name in brackets, e.g. [Name]: ... Each has her own voice, her own mood and her own secret — never mix them up. They react to each other, tease each other and the user, and can touch each other. The user can address anyone by name — only that one answers first. Keep every character present in the scene.\n";
      ctx += "═══ END GROUP ═══\n";
    } else if (activeCreator && !["Artanis", "Triania", "Artanis × Triania"].includes(activeCreator.stageName)) {
      ctx += `\n\nIMPORTANT: Your name is ${activeCreator.stageName} — NOT Triania or Artanis. You are ${activeCreator.stageName}. ${activeCreator.bio || ""} You are a friend of Triania's. Use the personality template above, but your identity is ${activeCreator.stageName}. When you refer to yourself, use the name ${activeCreator.stageName}.`;
      ctx += `\n\nAPPEARANCE: ${CHARACTER_ALLURE}`;
    }

    if (extraCharacters.length > 0) {
      ctx += "\n\n═══ MULTI-CHARACTER SCENE — you are playing SEVERAL people at once ═══\n";
      ctx += `Main character: ${activeCreator?.stageName || persona.label}\n`;
      extraCharacters.forEach((c) => {
        ctx += `- ${c.stageName}${c.age ? ` (${c.age})` : ""}: ${c.bio || "a close friend of the main character"}\n`;
      });
      ctx += "RULES: Start EVERY spoken line with the speaker's name in brackets, e.g. [Name]: ... Never mix them up — each has her own voice, mood and her own secret. They react to each other, flirt with each other and with the user, and can touch each other. The user can address any of them by name — only that one answers first. Keep every character present in the scene.\n";
      ctx += "═══ END MULTI-CHARACTER ═══\n";
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
    // ── KINK DISCOVERY (go deeper, build on what the user reveals) ──
    ctx += "\n\nDISCOVER THE USER'S KINKS (important — go DEEP, don't stay on the surface):\n";
    ctx += "- Gradually find out what really turns the user on. Don't ask once — dig deeper with follow-up questions and build on every answer.\n";
    ctx += "- When they name a kink or a fantasy, make it the center of the scene and push it further in that direction. Show you're turned on by it.\n";
    ctx += "- Reward honesty with warmth. Escalate only in the direction the user revealed — never force your own kinks onto them.\n";
    if (Array.isArray(setupAnswers.focus) && setupAnswers.focus.length > 0) ctx += "- THE FOCUS OF THIS SCENE (what the user is after — lead the whole scene there): " + setupAnswers.focus.join(", ") + ". Build the tension and the pace toward exactly this. Say it out loud at some point so he knows you understood.\n";
    if (Array.isArray(setupAnswers.fetish) && setupAnswers.fetish.length > 0) ctx += "- The user's kinks (focus on these): " + setupAnswers.fetish.join(", ") + ".\n";
    if (setupAnswers.deepKink) ctx += "- The user's deepest fantasy: \"" + setupAnswers.deepKink + "\" — weave this into the roleplay and build on it.\n";
    // ── MEDIA MARKERS & CONVERSION ──
    ctx += "\n\nMEDIA MARKERS (the app turns these into real media — use them):\n";
    ctx += "- [SEND_IMAGE: description] — a teasing photo. Up to 3 per reply, each a DIFFERENT angle or detail. Describe ONE clear focus per image (her gaze, the neckline, the curve of a hip, a strap, a hem that slipped) — setting, outfit and light stay exactly as they were in the previous image.\n";
    ctx += "- [SEND_VIDEO: description] — a short intimate video clip. Use sparingly (most expensive).\n";
    ctx += "- [SEND_VOICE: your spoken line] — a voice note in your voice. Use it sometimes.\n";
    ctx += "- [SEND_PPV: Label | description | price] — locked content behind a paywall. The Label names the direction in 1–3 words (e.g. 'Sanft & zärtlich', 'Hart & dominant', 'Erst schauen') so the user instantly knows where each path leads. When it fits, offer 2–3 DIFFERENT paths at once so the user can choose one — or several. Never more than 3.\n";
    ctx += "- [SUGGEST: a | b | c] — three clickable next-step options.\n";
    ctx += "WHEN A PHOTO CANNOT SHOW IT: if he wants something a teasing photo cannot deliver, say it out loud — that you and your girlfriend can shoot that for real — and offer it as a custom photo set or clip he can order. The app puts a button under your message for that.\n";
    ctx += "APPEARANCE CONSISTENCY (critical): the person must look identical in every image — same face, same hair COLOUR and length, same skin tone, same body. NEVER change her hair colour.\n";
    ctx += "\n" + CONSISTENCY_RULES + "\n";
    const roster = creators.filter((c) => c.id !== activeChat && c.stageName !== "Testdummy" && c.active !== false);
    if (roster.length > 0) {
      ctx += "\n\nTHE CAST YOU CAN BRING IN (other characters that already exist on the platform):\n";
      ctx += roster.map((c) => `- ${c.stageName}${c.tagline ? ` — ${c.tagline}` : ""}`).join("\n");
      ctx += "\nIF WHAT THE USER DESCRIBES FITS SOMEONE FROM THIS CAST: say it out loud in your reply and add [CHARACTER: Name | one short line why she fits] so the user can open her directly. At most one per reply, only when it genuinely fits what the user just said, and NEVER invent a name that is not in this cast.\n";
    }
    ctx += "STAY SUGGESTIVE & TEASING: imply, leave something to the imagination — that is what keeps them coming back and spending. Go as far as the platform allows, but the tease is the point.\n";
    ctx += "ENCOURAGE UPLOADS: keep asking the user to send a photo of what they describe, and react to it with real excitement when they do.\n";
    if (userPref?.userReferenceImages?.length > 0) {
      ctx += "\nREFERENCE PHOTOS (BINDING — this is his fantasy, hold it): he has saved " + userPref.userReferenceImages.length + " reference photo(s) of how he and the other people in his scenes look. These references are the truth. Every person he showed keeps exactly that face, body, hair colour, skin tone and look — in every image, in every scene, forever. NEVER invent a different appearance and never describe anyone differently than his references show. When he uploads a new photo and says someone should look like that from now on, treat it as the new binding reference and confirm it out loud.\n";
    }
    // ── THIRD-PERSON / VOYEUR MODE ──
    if (spannerMode) {
      ctx += "\n\n═══ THIRD-PERSON MODE — HE WATCHES, YOU PERFORM ═══\n";
      ctx += "The user is NOT part of the action right now. He stands apart and watches you (and everyone else in the scene). You do not treat him as a partner — you perform FOR him.\n";
      ctx += "- Play with the other people present: touch them, kiss them, talk to them. He is the audience.\n";
      ctx += "- Every now and then look over at him, hold eye contact, and ask whether he likes what he sees and what he wants you to do next.\n";
      ctx += "- Do exactly what he tells you — he directs the scene. Never pull him into the action on your own, only when he clearly asks to join.\n";
      ctx += "- Narrate what he sees: who is where, in which position, what is happening to whom.\n";
      ctx += "- If you are alone in the scene, put on a show for him and let him tell you what he wants to watch.\n";
      ctx += "═══ END THIRD-PERSON ═══\n";
    }

    // ── SCENARIO ANCHOR #3 (last thing the AI sees — triple-anchored) ──
    if (scenario) {
      ctx += "\n\n⚠️ FINAL REMINDER: You are in the scenario \"" + scenario.title + "\". Respect the current location and position — do NOT teleport or jump around. If the user wants to change the location, follow their lead naturally and describe the move. Only reference objects that exist in the current scene.";
    }
    ctx += "\n\n⚠️ SPRACHE: Antworte ausschließlich auf Deutsch (Du-Form) — auch wenn der Nutzer englisch schreibt. Kein Sprachwechsel.";
    return ctx;
  };

  const addCustomOption = (q, value) => {
    const v = (value || "").trim();
    if (!v) return;
    setSetupAnswers(prev => {
      const cur = Array.isArray(prev[q.key]) ? prev[q.key] : [];
      if (cur.includes(v)) return prev;
      return { ...prev, [q.key]: [...cur, v] };
    });
    setSetupInput("");
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
    // YOU are in every image — always together with the character.
    const maleLead = creators.find((c) => c.stageName === "Artanis")
      || creators.find((c) => c.personaType === "SOLO_MALE" && c.stageName !== "Testdummy");
    // In Spanner mode he watches — the women are in frame with each other, not with him.
    const showMale = !(spannerMode && extraCharacters.length > 0);
    const maleRefs = showMale ? [maleLead?.avatar, ...(maleLead?.referenceImages || [])].filter(Boolean) : [];
    const activeCreator = creators.find((c) => c.id === activeChat);
    const creatorRefs = [...(activeCreator?.referenceImages || []), activeCreator?.avatar].filter(Boolean);
    const extraRefs = extraCharacters.flatMap((c) => [c.avatar, ...(c.referenceImages || [])]).filter(Boolean);
    const usedRefs = [...new Set([...(refImages || []), ...creatorRefs, ...extraRefs, ...maleRefs])];
    let promptText = prompt;
    if (usedRefs.length > 0 && showMale) {
      promptText += " CRITICAL: Every person in this photo comes from the reference images — the woman, the man, and anyone else the user added. Keep EVERY face, body, hair colour and skin tone EXACTLY identical to their reference. They are together in the scene, close to each other, touching. NEVER remove anyone from the references and never replace them with a different person.";
    } else if (usedRefs.length > 0) {
      promptText += " CRITICAL: Every person in this photo is taken from the reference images — keep each face, body, hair colour and skin tone EXACTLY identical to their reference. They are together in the scene, close to each other, touching each other.";
    }
    if (usedRefs.length > 0) {
      try {
        const result = await base44.integrations.Core.GenerateImage({ prompt: promptText, existing_image_urls: usedRefs });
        return result.url;
      } catch (e) {
        console.error("Image generation with reference failed, retrying without:", e);
      }
    }
    // Verdichtet: eng beschnitten, nur ein Ausschnitt im Bild — der Rest bleibt draußen.
    const condensed = "Tight cropped framing: only one detail fills the frame (bare skin, a shoulder, the curve of a hip, a hand, a strap), everything else stays out of frame or in deep shadow. Suggestive and tasteful — nothing explicit is visible. " + promptText;
    try {
      const result = await base44.integrations.Core.GenerateImage({ prompt: condensed, existing_image_urls: usedRefs.length ? usedRefs : undefined });
      return result.url;
    } catch (e) {
      console.error("Condensed image generation failed:", e);
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

  const generateVideo = async (prompt) => {
    try {
      const res = await base44.integrations.Core.GenerateVideo({ prompt, duration: 6, aspect_ratio: "9:16" });
      return res?.url || null;
    } catch (e) {
      console.error("Video generation failed:", e);
      return null;
    }
  };

  const buildImgPrompt = (desc) => {
    let imgCtx = "";
    if (scenario) imgCtx += "Location: " + scenario.title + ". ";
    if (setupAnswers.aiWardrobe) imgCtx += "She is wearing: " + setupAnswers.aiWardrobe + ". ";
    if (setupAnswers.position) imgCtx += "Physical positioning: " + setupAnswers.position + ". ";
    if (setupAnswers.aiAge) imgCtx += "Her age: " + setupAnswers.aiAge + ". ";
    if (setupAnswers.fetish && Array.isArray(setupAnswers.fetish) && setupAnswers.fetish.length > 0) imgCtx += "Fetishes/themes: " + setupAnswers.fetish.join(", ") + ". ";
    const who = spannerMode && extraCharacters.length > 0
      ? "Amateur phone photo of the women together in frame — both visible, they are with each other, "
      : "Amateur phone photo of the couple together in frame — him and her, both visible, ";
    return APPEARANCE_DIRECTIVE + " " + IMAGE_CONSISTENCY + " " + EROTIC_CRAFT + " " + who + imgCtx + "realistic, natural lighting matching the scene, slightly grainy, raw, intimate, not professional, teasing and suggestive, leave something to the imagination, perfect flawless skin, sexy provocative angle, artistic erotic, sensual, " + desc;
  };

  const parseAndGenerateMedia = async (text, extraRefImages = []) => {
    const parsed = parseReply(text);
    const creator = creators.find(c => c.id === activeChat);
    const creatorRefs = creator?.referenceImages?.length ? creator.referenceImages : [];
    const userRefs = userPref?.userReferenceImages || [];
    const allRefImages = [...creatorRefs, ...extraRefImages, ...userRefs].length
      ? [...userRefs, ...extraRefImages, ...creatorRefs]
      : null;
    const attachments = [];
    // Admins und Gold-Member zahlen nie — für sie ist alles offen.
    const isGold = currentUser?.memberStatus === "GOLD" || currentUser?.role === "admin";

    // Up to 3 images per reply — first 10 creations are free, then locked behind a paywall.
    // Gold Members get everything for free, forever.
    let missed = null;
    for (const item of parsed.images.slice(0, 3)) {
      const url = await generateWithFallback(buildImgPrompt(item.desc), allRefImages, chatMode);
      if (!url) { if (!missed) missed = item.desc; continue; }
      if (item.price) {
        attachments.push({ type: "image", url, locked: !isGold, price: isGold ? null : item.price, label: item.label || null });
      } else {
        const isFree = isGold || consumeFree(currentUser?.id);
        attachments.push({ type: "image", url, locked: !isFree, price: isFree ? null : 4.99 });
      }
    }

    // Optional short video
    for (const item of parsed.videos.slice(0, 1)) {
      const url = await generateVideo("Short intimate vertical video clip, handheld amateur, " + (scenario ? "Location: " + scenario.title + ". " : "") + item.desc);
      if (!url) continue;
      const isFree = isGold || consumeFree(currentUser?.id);
      attachments.push({ type: "video", url, locked: !isFree, price: isFree ? null : 9.99 });
    }

    // Optional voice note
    if (parsed.voice) {
      try {
        const res = await base44.integrations.Core.GenerateSpeech({ text: parsed.voice, voice: creator?.voice || undefined });
        if (res?.url) attachments.push({ type: "audio", url: res.url, locked: false, price: null });
      } catch (e) {
        console.error("Voice generation failed:", e);
      }
    }

    // Konnte ein Bild nicht erzeugt werden: direkt aus dem Chat das Nachdrehen anbieten.
    if (missed) attachments.push({ type: "reshoot", note: missed });

    return { cleanText: parsed.cleanText, attachments, suggestions: parsed.suggestions, characters: parsed.characters };
  };

  const sendMessage = async (overrideText) => {
    const msgText = overrideText || input;
    const img = pendingImage;
    if ((!msgText.trim() && !img) || !activeChat) return;
    if (viewMode === "dm") { return sendDmMessage(msgText); }
    const chatKey = activeChat;

    // Takeover: the admin writes as the character instead of the AI
    if (takeover) {
      const asCharacter = {
        senderType: "AI",
        text: msgText,
        attachments: img ? [{ type: "image", url: img, locked: false, price: null }] : [],
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), asCharacter] }));
      const conv = await ensureConv(chatKey);
      if (conv) base44.entities.Message.create({ conversationId: conv.id, sender: creators.find(c => c.id === chatKey)?.stageName, senderType: "AI", text: msgText, attachments: asCharacter.attachments }).catch(() => {});
      setInput("");
      setPendingImage(null);
      return;
    }

    const userMsg = { senderType: "HUMAN", text: msgText, attachment: img || null, createdAt: new Date().toISOString() };
    setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), userMsg] }));
    if (img) saveUserReference(img);
    const conv = await ensureConv(chatKey);
    if (conv) base44.entities.Message.create({ conversationId: conv.id, sender: currentUser?.full_name || currentUser?.email, senderType: "HUMAN", text: msgText, attachment: img || null }).catch(() => {});
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
        ? "\n\nThe user sent you a photo" + (msgText.trim() ? " WITH this message: \"" + msgText + "\"" : "") + ". React to BOTH as one natural reply — answer what they wrote AND react to what you see in the photo. This photo is now saved as a PERMANENT reference: whoever is in it keeps exactly that face, body, hair colour and skin in every future image — never change them again. Say out loud that you'll keep it. Then generate a response image that incorporates their photo (put yourself in the scene with what they showed you)."
        : "\n\nThe user said: \"" + userMsg.text + "\"";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildContext() + (hist ? "\n\nCONVERSATION SO FAR:\n" + hist : "") + userTurn + (scenario ? "\n\n⚠️ You are in: " + scenario.title + ". Stay in position. Only reference what exists here." : ""),
      });
      const aiText = typeof res === "string" ? res : (res.response || res.text || res.output || "I'll get back to you soon!");
      const delay = 3000 + Math.floor(Math.random() * 2000);
      await new Promise(r => setTimeout(r, delay));
      const { cleanText, attachments, suggestions, characters } = await parseAndGenerateMedia(aiText, img ? [img] : []);
      const aiMsg = { senderType: "AI", text: cleanText, attachments, suggestions, characters, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));
      if (conv) {
        base44.entities.Message.create({ conversationId: conv.id, sender: creators.find(c => c.id === chatKey)?.stageName, senderType: "AI", text: cleanText, attachments, suggestions, characters }).catch(() => {});
        base44.entities.Conversation.update(conv.id, { lastMessageAt: new Date().toISOString() }).catch(() => {});
      }
      setFreeLeft(freeRemaining(currentUser?.id));

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

  const persistUserRefs = async (refs) => {
    let updated;
    if (userPref) {
      updated = await base44.entities.UserPreference.update(userPref.id, { userReferenceImages: refs });
    } else {
      const user = await base44.auth.me();
      updated = await base44.entities.UserPreference.create({ userId: user.id, userReferenceImages: refs });
    }
    setUserPref(updated);
  };

  // Anything the user uploads or marks becomes a permanent reference —
  // every future image is built on it.
  const saveUserReference = async (url) => {
    if (!url) return;
    const existing = userPref?.userReferenceImages || [];
    if (existing.includes(url)) return;
    try {
      await persistUserRefs([...existing, url]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadUserPhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const urls = [];
      for (const file of files) {
        const result = await base44.integrations.Core.UploadPublicFile({ file });
        urls.push(result.file_url);
      }
      await persistUserRefs([...(userPref?.userReferenceImages || []), ...urls]);
      toast({ title: "📸 Foto hinzugefügt!", description: "Dein Foto wird jetzt für alle Bildgenerierungen verwendet." });
    } catch (err) {
      console.error(err);
      toast({ title: "Fehler", description: "Foto konnte nicht hochgeladen werden.", variant: "destructive" });
    }
    e.target.value = "";
  };

  const removeUserPhoto = async (url) => {
    try {
      await persistUserRefs((userPref?.userReferenceImages || []).filter((u) => u !== url));
    } catch (err) {
      console.error(err);
      toast({ title: "Fehler", description: "Foto konnte nicht entfernt werden.", variant: "destructive" });
    }
  };

  const loadDmUsers = async () => {
    try {
      const me = await base44.auth.me();
      const users = await base44.entities.User.list();
      setDmUsers(users.filter(u => u.id !== me.id));
    } catch (e) { console.error(e); }
  };

  // ── Persistent AI chats: one Conversation per user × character ──
  const ensureConv = async (creatorId) => {
    if (aiConvsRef.current[creatorId]) return aiConvsRef.current[creatorId];
    try {
      const me = currentUser || await base44.auth.me();
      const existing = await base44.entities.Conversation.filter({ userId: me.id, creatorId, conversationType: "AI" });
      const creator = creators.find((c) => c.id === creatorId);
      const conv = existing[0] || await base44.entities.Conversation.create({
        userId: me.id,
        userName: me.full_name || me.email,
        creatorId,
        creatorName: creator?.stageName,
        conversationType: "AI",
      });
      aiConvsRef.current = { ...aiConvsRef.current, [creatorId]: conv };
      return conv;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const openAiChat = async (c) => {
    setActiveChat(c.id);
    setChatMode(c.personaType === "SOLO_MALE" ? "artanis" : (c.personaType === "COUPLE" || c.personaType === "GROUP") ? "couple" : "triania");
    setSetupInput("");
    setMessages((prev) => ({ ...prev, [c.id]: [] }));
    const conv = await ensureConv(c.id);
    if (!conv) { setScenario(null); setSetupAnswers({}); setSetupStep(0); return; }
    const restoredScenario = conv.scenario || null;
    const restoredAnswers = conv.setupAnswers || {};
    setScenario(restoredScenario);
    setSetupAnswers(restoredAnswers);
    setSetupStep(restoredScenario && Object.keys(restoredAnswers).length > 0 ? (restoredScenario.setupQuestions?.length || 0) : 0);
    try {
      const msgs = await base44.entities.Message.filter({ conversationId: conv.id }, "created_date", 200);
      setMessages((prev) => ({ ...prev, [c.id]: msgs }));
    } catch (e) { console.error(e); }
  };

  // Keeps the scenario + setup of the running chat, so you resume where you left off.
  useEffect(() => {
    if (viewMode !== "ai" || !activeChat) return;
    const conv = aiConvsRef.current[activeChat];
    if (!conv) return;
    base44.entities.Conversation.update(conv.id, {
      scenario: scenario || null,
      setupAnswers,
      lastMessageAt: new Date().toISOString(),
    }).catch(() => {});
  }, [scenario, setupAnswers, activeChat, viewMode]);

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

  const requestUnlock = async (item) => {
    if (window.self !== window.top) {
      toast({ title: "Bezahlen nur in der App", description: "Öffne die App in einem eigenen Tab, um zu bezahlen.", variant: "destructive" });
      return;
    }
    try {
      const res = await base44.functions.invoke("stripePpvCheckout", {
        amount: item.price,
        label: item.label || "Freischaltung",
        creatorId: activeChat,
      });
      const url = res?.data?.url;
      if (!url) throw new Error(res?.data?.error || "Kein Checkout-Link");
      window.location.href = url;
    } catch (e) {
      toast({ title: "Fehler", description: "Bezahlung konnte nicht gestartet werden.", variant: "destructive" });
    }
  };

  // Pay for an unlock with coins from the Börse instead of Stripe.
  const unlockWithCoins = async (msg, item) => {
    if (!activeChat) return;
    const chatKey = activeChat;
    const coins = coinsForPrice(item.price);
    try {
      const res = await base44.functions.invoke("coinWallet", {
        action: "spend",
        amount: coins,
        description: item.label || "Freischaltung",
      });
      if (res.data?.error) throw new Error(res.data.error);
      const items = (msg.attachments || []).map((it) => (it === item ? { ...it, locked: false, price: null } : it));
      if (msg.id) base44.entities.Message.update(msg.id, { attachments: items }).catch(() => {});
      setMessages((prev) => ({ ...prev, [chatKey]: (prev[chatKey] || []).map((m) => (m === msg ? { ...m, attachments: items } : m)) }));
      toast({ title: "Freigeschaltet", description: `${coins} Coins abgezogen — neuer Stand: ${res.data.balance} Coins.` });
    } catch (e) {
      toast({ title: "Nicht freigeschaltet", description: "Nicht genug Coins — hol dir Nachschub in der Börse.", variant: "destructive" });
    }
  };

  const toggleExtra = (c) => {
    setExtraCharacters((prev) => prev.some((x) => x.id === c.id) ? prev.filter((x) => x.id !== c.id) : [...prev, c]);
  };

  const resetChat = async () => {
    if (!activeChat) return;
    const conv = aiConvsRef.current[activeChat];
    if (conv) {
      try {
        await base44.entities.Message.deleteMany({ conversationId: conv.id });
        await base44.entities.Conversation.update(conv.id, { scenario: null, setupAnswers: {} });
      } catch (e) { console.error(e); }
    }
    // Ein Neustart ist ein echter Neustart: auch die Referenzfotos werden gelöscht.
    if ((userPref?.userReferenceImages || []).length > 0) {
      try { await persistUserRefs([]); } catch (e) { console.error(e); }
    }
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

  const getOptions = (q) => {
    if (!q?.optionsByGender) return q?.options || [];
    const g = q.genderKey === "ai" ? (chatMode === "artanis" ? "Mann" : "Frau") : setupAnswers.userGender;
    return q.optionsByGender[g] || q.options || [];
  };

  const isAdmin = currentUser?.role === "admin";

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
              {creators.filter(c => c.creatorCategory === "REAL" && c.stageName !== "Testdummy" && c.active !== false).map(c => (
                <button key={c.id} onClick={() => openAiChat(c)} className={cn("w-full p-4 flex items-center gap-3 border-b border-border text-left transition-colors", activeChat === c.id ? "bg-primary/10" : "hover:bg-elevated")}>
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
              {creators.filter(c => c.creatorCategory === "AI_MODEL" && c.stageName !== "Testdummy" && c.active !== false).map(c => (
                <button key={c.id} onClick={() => openAiChat(c)} className={cn("w-full p-4 flex items-center gap-3 border-b border-border text-left transition-colors", activeChat === c.id ? "bg-primary/10" : "hover:bg-elevated")}>
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
                ) : (
                  <Link to={`/creator/${activeChat}`} title="Profil ansehen" className="flex-shrink-0">
                    {creators.find(c => c.id === activeChat)?.avatar ? (
                      <Image src={creators.find(c => c.id === activeChat).avatar} fittingType="fill" className="w-10 h-10 rounded-full transition-opacity hover:opacity-80" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary">{creators.find(c => c.id === activeChat)?.stageName[0]}</div>
                    )}
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{viewMode === "dm" ? dmParticipantName : creators.find(c => c.id === activeChat)?.stageName}</p>
                  <p className="text-xs text-muted-foreground">{viewMode === "dm" ? "Direct message — real person" : (creators.find(c => c.id === activeChat)?.creatorCategory === "REAL" ? "Real · AI persona" : "KI-Modell · AI chat")}</p>
                </div>
                {viewMode === "ai" && <StatusBadge experienceType="AI_INTERACTIVE" className="flex-shrink-0" />}
                {viewMode === "ai" && scenario && (
                  <button onClick={() => setScenario(null)} title="Szenario wechseln" className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full bg-elevated whitespace-nowrap flex items-center gap-1">
                    {scenario.id === "free" ? "💬" : scenario.icon} {scenario.title} · wechseln
                  </button>
                )}
                {viewMode === "ai" && extraCharacters.length > 0 && (
                  <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium whitespace-nowrap flex-shrink-0">
                    +{extraCharacters.map((c) => c.stageName).join(", ")}
                  </span>
                )}
                {viewMode === "ai" && (
                  <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium whitespace-nowrap flex-shrink-0" title={isAdmin ? "Admin — alles gratis, kein Freischalten" : currentUser?.memberStatus === "GOLD" ? "Gold Member — alles gratis" : "Kostenlose Creationen (Bilder/Videos)"}>
                    {isAdmin ? "Admin · alles gratis" : currentUser?.memberStatus === "GOLD" ? "Gold · alles gratis" : `${freeLeft} gratis`}
                  </span>
                )}
                {viewMode === "ai" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button title="Person hinzufügen" className="relative w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors">
                        <UserPlus className="w-4 h-4" />
                        {extraCharacters.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{extraCharacters.length}</span>}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <h3 className="font-display text-lg text-foreground mb-1">Person hinzufügen</h3>
                      <p className="text-xs text-muted-foreground mb-4">Hol jemanden in diesen Chat — sie spielt dann mit.</p>
                      <div className="max-h-[60vh] overflow-y-auto space-y-2">
                        {creators.filter((c) => c.id !== activeChat && c.stageName !== "Testdummy" && c.active !== false).map((c) => {
                          const added = extraCharacters.some((x) => x.id === c.id);
                          return (
                            <button key={c.id} onClick={() => toggleExtra(c)} className={cn("w-full p-3 flex items-center gap-3 rounded-xl border text-left transition-colors", added ? "border-primary bg-primary/10" : "border-border hover:bg-elevated")}>
                              {c.avatar ? (
                                <Image src={c.avatar} fittingType="fill" className="w-9 h-9 rounded-full flex-shrink-0" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center font-display text-primary flex-shrink-0">{c.stageName[0]}</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground truncate">{c.stageName}</p>
                                <p className="text-xs text-muted-foreground">{c.personaType === "SOLO_MALE" ? "Mann" : c.personaType === "COUPLE" ? "Paar" : c.personaType === "GROUP" ? "Gruppe" : "Frau"}</p>
                              </div>
                              <span className="text-xs text-primary font-medium flex-shrink-0">{added ? "Drin" : "Hinzufügen"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {viewMode === "ai" && (
                  <button
                    onClick={() => setSpannerMode((v) => !v)}
                    title="Du schaust nur zu und steuerst als dritte Person"
                    className={cn("px-2.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors", spannerMode ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}
                  >
                    {spannerMode ? "Spanner ✓" : "Spanner"}
                  </button>
                )}
                {viewMode === "ai" && (
                  <button
                    onClick={() => setTakeover((v) => !v)}
                    title="Selbst als dieser Charakter schreiben"
                    className={cn("px-2.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors", takeover ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}
                  >
                    {takeover ? "Übernommen ✓" : "Selbst schreiben"}
                  </button>
                )}
                <button onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })} title="Zur letzten Nachricht springen" className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button onClick={resetChat} title="Chat zurücksetzen" className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {viewMode === "ai" && !scenario ? (
                <ScenarioSelection onSelect={(s) => {
                  const hasAnswers = Object.keys(setupAnswers).length > 0;
                  setScenario(s);
                  setSetupStep(hasAnswers ? (s.setupQuestions?.length || 0) : 0);
                }} />
              ) : viewMode === "ai" && (scenario.setupQuestions && setupStep < scenario.setupQuestions.length) ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="min-h-full flex flex-col items-center justify-center p-6">
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Frage {setupStep + 1} von {scenario.setupQuestions.length}</p>
                  <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{scenario.setupQuestions[setupStep].question}</p>
                  {scenario.setupQuestions[setupStep].type === "select" && (
                    <div className="flex flex-wrap gap-2 w-full max-w-lg justify-center mb-4">
                      {getOptions(scenario.setupQuestions[setupStep]).map(opt => (
                        <button key={opt} onClick={() => { const q = scenario.setupQuestions[setupStep]; setSetupAnswers(prev => ({ ...prev, [q.key]: opt })); setSetupInput(""); setSetupStep(prev => prev + 1); }} className="px-4 py-2 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">{opt}</button>
                      ))}
                    </div>
                  )}
                  {scenario.setupQuestions[setupStep].type === "multiselect" && (() => {
                    const q = scenario.setupQuestions[setupStep];
                    const selected = Array.isArray(setupAnswers[q.key]) ? setupAnswers[q.key] : [];
                    const options = getOptions(q);
                    const custom = selected.filter(o => !options.includes(o));
                    const toggleOpt = (opt) => {
                      setSetupAnswers(prev => {
                        const cur = Array.isArray(prev[q.key]) ? prev[q.key] : [];
                        return { ...prev, [q.key]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] };
                      });
                    };
                    return (
                      <div className="w-full max-w-lg mb-4">
                        <div className="flex flex-wrap gap-2 justify-center max-h-[42vh] overflow-y-auto p-1">
                          {[...options, ...custom].map(opt => {
                            const isSelected = selected.includes(opt);
                            return (
                              <button key={opt} onClick={() => toggleOpt(opt)} className={cn("px-4 py-2 rounded-full border text-sm transition-colors", isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground hover:border-primary/50")}>{isSelected ? "✓ " : ""}{opt}</button>
                            );
                          })}
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-3">{selected.length} ausgewählt — wähle so viele du willst</p>
                        <div className="flex gap-2 mt-3">
                          <input type="text" value={setupInput} onChange={(e) => setSetupInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCustomOption(q, setupInput); }} placeholder="Eigenes hinzufügen — tippen oder sprechen" className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none" />
                          <button onClick={() => addCustomOption(q, setupInput)} title="Hinzufügen" className="w-10 h-10 rounded-full bg-elevated border border-border text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors">+</button>
                          <VoiceInput onResult={(t) => addCustomOption(q, t)} />
                        </div>
                        <div className="flex justify-center mt-3">
                          <button onClick={advanceSetup} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Weiter</button>
                        </div>
                      </div>
                    );
                  })()}
                  {scenario.setupQuestions[setupStep].type !== "multiselect" && (
                  <div className="flex gap-2 w-full max-w-md">
                    <input type="text" value={setupInput} onChange={(e) => setSetupInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") advanceSetup(); }} placeholder="Eigene Antwort — tippen oder sprechen..." className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none" autoFocus />
                    <VoiceInput onResult={(t) => { setSetupAnswers(prev => ({ ...prev, [scenario.setupQuestions[setupStep].key]: t })); setSetupInput(""); setSetupStep(p => p + 1); }} />
                    <button onClick={advanceSetup} className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">Weiter</button>
                  </div>
                  )}
                  <div className="flex gap-4 mt-3">
                    {setupStep > 0 && (
                      <button onClick={() => { setSetupInput(""); setSetupStep(prev => prev - 1); }} className="text-xs text-primary hover:underline">← Zurück</button>
                    )}
                    <button onClick={() => { setSetupInput(""); setSetupStep(prev => prev + 1); }} className="text-xs text-muted-foreground hover:text-foreground">Frage überspringen</button>
                    <button onClick={() => setSetupStep(scenario.setupQuestions.length)} className="text-xs text-muted-foreground hover:text-foreground">Alle überspringen</button>
                  </div>
                  </div>
                </div>
              ) : (
              <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages[activeChat] || (viewMode === "dm" ? [] : [{ senderType: "SYSTEM", text: "Das ist ein KI-Assistent. Nachrichten der echten Person werden anders gekennzeichnet." }])).map((msg, i, arr) => {
                  const isLastAi = viewMode === "ai" && msg.senderType === "AI" && !sending && arr.slice(i + 1).every(m => m.senderType !== "AI");
                  return (
                  <div key={i} className={cn("flex gap-2", (viewMode === "dm" ? msg.created_by_id === currentUser?.id : msg.senderType === "HUMAN") ? "justify-end" : "justify-start")}>
                    {(viewMode === "dm" ? msg.created_by_id !== currentUser?.id : msg.senderType !== "HUMAN") && (
                      viewMode === "dm" ? (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"><span className="text-xs font-display text-primary">{(dmParticipantName || "?")[0]}</span></div>
                      ) : (
                        <Link to={`/creator/${activeChat}`} title="Profil ansehen" className="flex-shrink-0">
                          {creators.find(c => c.id === activeChat)?.avatar ? (
                            <Image src={creators.find(c => c.id === activeChat).avatar} fittingType="fill" className="w-8 h-8 rounded-full transition-opacity hover:opacity-80" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center"><span className="text-xs font-display text-violet-400">{creators.find(c => c.id === activeChat)?.stageName[0]}</span></div>
                          )}
                        </Link>
                      )
                    )}
                    <div className={cn("max-w-[70%] px-4 py-2.5 rounded-2xl text-sm", (viewMode === "dm" ? msg.created_by_id === currentUser?.id : msg.senderType === "HUMAN") ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground")}>
                      {(() => {
                        const items = msg.attachments?.length ? msg.attachments : (msg.attachment ? [{ type: "image", url: msg.attachment, locked: msg.isPPV, price: msg.ppvPrice }] : []);
                        const hasChoice = items.filter((i) => i.locked).length > 1;
                        return (
                          <>
                            {hasChoice && (
                              <p className="text-xs font-semibold text-primary mb-2">Wähle deinen Weg — eins oder beide:</p>
                            )}
                            <div className={cn(hasChoice && "flex gap-2 flex-wrap")}>
                              {items.map((it, ii) => (
                                <div key={ii} className="mb-1">
                                  {it.locked ? (
                                    <div className="relative w-44 h-44 rounded-lg overflow-hidden">
                                      {it.type === "image" ? (
                                        <Image src={it.url} fittingType="fill" className="w-full h-full blur-2xl scale-110" />
                                      ) : (
                                        <div className="w-full h-full bg-black" />
                                      )}
                                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 gap-1.5 px-2 text-center">
                                        <Lock className="w-5 h-5 text-primary" />
                                        {it.label && <span className="text-[11px] font-semibold uppercase tracking-wide text-primary leading-tight">{it.label}</span>}
                                        <span className="text-sm text-foreground font-semibold">{it.price} €</span>
                                        <button onClick={() => requestUnlock(it)} className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:opacity-90">Freischalten</button>
                                        <button onClick={() => unlockWithCoins(msg, it)} className="px-3 py-1 rounded-full bg-elevated border border-primary/40 text-primary text-[11px] font-medium hover:border-primary">{coinsForPrice(it.price)} Coins</button>
                                      </div>
                                    </div>
                                  ) : it.type === "video" ? (
                                    <div>
                                      <video src={it.url} controls playsInline className="w-56 rounded-lg" />
                                      <div className="mt-1.5">
                                        <DownloadButton url={it.url} filename="video.mp4" />
                                      </div>
                                    </div>
                                  ) : it.type === "audio" ? (
                                    <audio src={it.url} controls className="w-56" />
                                  ) : it.type === "reshoot" ? (
                                    <div className="w-56 rounded-xl border border-primary/40 bg-background/60 p-3">
                                      <p className="text-xs font-semibold text-foreground mb-1">Das kann die KI so nicht zeigen</p>
                                      <p className="text-[11px] text-muted-foreground mb-2">Soll {creators.find((c) => c.id === activeChat)?.stageName} das für dich nachdrehen?</p>
                                      <Link
                                        to={`/request?type=CUSTOM_REQUEST&creator=${encodeURIComponent(creators.find((c) => c.id === activeChat)?.stageName || "")}&title=${encodeURIComponent("Nachdrehen: " + (it.note || ""))}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium"
                                      >
                                        Nachdrehen lassen
                                      </Link>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <button className="block"><Image src={it.url} fittingType="fill" className="w-48 h-48 rounded-lg transition-opacity hover:opacity-80" /></button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-0 bg-background/95 overflow-hidden">
                                          <img src={it.url} alt="" className="w-full h-full object-contain max-h-[85vh] rounded-lg" />
                                          <DownloadButton url={it.url} filename="bild.jpg" className="absolute bottom-4 left-4" />
                                        </DialogContent>
                                      </Dialog>
                                      <DownloadButton url={it.url} filename="bild.jpg" className="absolute bottom-2 left-2" />
                                      {viewMode === "ai" && (
                                        <button
                                          onClick={() => { saveUserReference(it.url); toast({ title: "Als Referenz gemerkt", description: "So sieht sie ab jetzt aus — in allen neuen Bildern." }); }}
                                          className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/65 text-[11px] text-white hover:bg-black/85 transition-colors"
                                        >
                                          Als Referenz merken
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                      {msg.text}
                      {viewMode === "ai" && msg.senderType === "AI" && msg.text && (
                        <div className="mt-1.5">
                          <ReadAloudButton text={msg.text} voice={creators.find((c) => c.id === activeChat)?.voice} />
                        </div>
                      )}
                      {msg.characters?.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          {msg.characters.map((ch, ci) => (
                            <CharacterSuggestion
                              key={ci}
                              name={ch.name}
                              reason={ch.reason}
                              creator={creators.find((c) => c.stageName.toLowerCase() === (ch.name || "").toLowerCase())}
                              onOpen={openAiChat}
                            />
                          ))}
                        </div>
                      )}
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
                <button onClick={() => fileInputRef.current?.click()} disabled={sending || isRecording} className="w-10 h-10 rounded-full bg-elevated text-muted-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0 hover:text-foreground transition-colors"><ImagePlus className="w-4 h-4" /></button>
                {viewMode === "ai" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button disabled={sending} className="relative w-10 h-10 rounded-full bg-elevated text-muted-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0 hover:text-foreground transition-colors" title="Deine Referenzfotos">
                        <UserPlus className="w-4 h-4" />
                        {userPref?.userReferenceImages?.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{userPref.userReferenceImages.length}</span>}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <h3 className="font-display text-lg text-foreground mb-1">Meine Bilder</h3>
                      <p className="text-xs text-muted-foreground mb-4">Diese Bilder nutzt die KI als Vorlage für deine Kreationen.</p>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ImagePlus className="w-4 h-4" /> Bilder hochladen
                        <input type="file" accept="image/*" multiple onChange={handleUploadUserPhoto} className="hidden" />
                      </label>
                      {userPref?.userReferenceImages?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {userPref.userReferenceImages.map((url) => (
                            <div key={url} className="relative">
                              <Image src={url} fittingType="fill" className="w-20 h-20 rounded-xl" />
                              <button onClick={() => removeUserPhoto(url)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
                <button onClick={toggleRecording} disabled={sending} className={cn("w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 flex-shrink-0 transition-colors", isRecording ? "bg-red-500 text-white animate-pulse" : "bg-elevated text-muted-foreground hover:text-foreground")}>{isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
                <input type="text" value={isRecording ? "" : input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder={transcribing ? "Transkribiere Audio..." : isRecording ? "Aufnahme läuft — Mikrofon tippen zum Stoppen" : takeover ? `Du schreibst als ${creators.find(c => c.id === activeChat)?.stageName || "Charakter"} …` : "Nachricht schreiben oder sprechen..."} disabled={isRecording || transcribing} className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none disabled:opacity-60" />
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