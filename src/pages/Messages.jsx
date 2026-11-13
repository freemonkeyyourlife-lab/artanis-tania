import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Play, ArrowLeft, ImagePlus, Mic, Square, Lock, UserPlus, RotateCcw, ArrowDown, X, Video, Phone, Loader2, Banknote, Cast, Brain } from "lucide-react";
import NarratorAvatar3D from "@/components/narrator/NarratorAvatar3D";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { PERSONA_MODES } from "@/lib/personaPrompts";
import ChatMessageBar from "@/components/chat/ChatMessageBar";
import ScenarioSelection from "@/components/ScenarioSelection";
import VoiceInput from "@/components/VoiceInput";
import InfoDot from "@/components/InfoDot";
import QuickActions from "@/components/QuickActions";
import { parseReply, consumeFree, freeRemaining, FREE_CREATIONS, sanitizeImagePrompt } from "@/lib/chatMedia";
import CharacterSuggestion from "@/components/CharacterSuggestion";
import SceneReadButton from "@/components/chat/SceneReadButton";
import RolePicker from "@/components/chat/RolePicker";
import CharacterDirector from "@/components/chat/CharacterDirector";
import StoryExportButton from "@/components/chat/StoryExportButton";
import ChatPromptButton from "@/components/chat/ChatPromptButton";
import ChatCastMenu from "@/components/chat/ChatCastMenu";
import MoodQuickMenu from "@/components/chat/MoodQuickMenu";
import { moodFor, setMoodFor, moodPrompt, moodVoice } from "@/lib/moodStyle";
import { takePendingMood, setSceneNote, sceneNotePrompt, setVoiceOverride, voiceOverrideFor } from "@/lib/moodMode";
import { speechPrompt, styleFor, setStyleFor, SPEECH_STYLES } from "@/lib/speechStyle";
import { DEFAULT_ROLE, roleFor, setRoleFor, aiCast, speakAsFromRole, rolePrompt } from "@/lib/chatRole";
import { splitScene, playScene } from "@/lib/sceneVoice";
import VoiceChatBar from "@/components/voice/VoiceChatBar";
import VoiceEditorDialog from "@/components/voice/VoiceEditorDialog";
import SpeakerBar from "@/components/chat/SpeakerBar";
import { playLevelFor, setPlayLevelFor, playPrompt } from "@/lib/playStyle";
import VoiceConvertButton from "@/components/voice/VoiceConvertButton";
import VoiceConvertToggle from "@/components/voice/VoiceConvertToggle";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";
import { speakAsVoice, voiceNotesOn, myVoiceConvertOn, myVoiceConvertDecided, setMyVoiceConvertOn } from "@/lib/voiceChat";
import DownloadButton from "@/components/DownloadButton";
import { coinsForPrice } from "@/lib/coins";
import { CARTOON_STYLE, CHARACTER_ALLURE, CONSISTENCY_RULES, IMAGE_SAFE_RULES, PHOTOREAL } from "@/lib/appearance";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useCallSession } from "@/lib/CallContext";
import { requestStage } from "@/lib/callStage";
import ChatTabs from "@/components/chat/ChatTabs";
import ChatText from "@/components/chat/ChatText";
import QuickPayButton from "@/components/pay/QuickPayButton";
import { hasProAccess } from "@/lib/proAccess";
import { publicName } from "@/lib/displayName";
import { ownerIsPresent } from "@/lib/presence";
import { announceToNarrator } from "@/lib/narratorHearing";

const ACTIVE_CHAT_KEY = "artanis_active_chat";
const TEXT_MODEL_KEY = "artanis_text_model";
// Wie breit die Liste links steht — den Balken daneben ziehst du dir selbst zurecht.
const LIST_W_KEY = "artanis_chat_list_w";
// So lange darf der echte Charakter selbst antworten, bevor die KI übernimmt.
// Nur kurz Vorsprung für die echte Person — lange Pausen lassen den Chat tot wirken.
const HUMAN_WINDOW_MS = 15000;

const LANGUAGE_RULE =
  "═══ SPRACHE — NUR DEUTSCH ═══\n" +
  "Du antwortest IMMER auf Deutsch — jede Antwort, jede Frage, jede [SUGGEST: ...]-Option, jede [SEND_IMAGE: ...]- und [SEND_VIDEO: ...]-Beschreibung, jede [SEND_VOICE: ...]-Zeile und jedes [SEND_PPV: ...]-Label. Nie auf Englisch. Wechsle die Sprache niemals mitten im Chat — auch dann nicht, wenn der Nutzer englisch oder in einer anderen Sprache schreibt; antworte dann trotzdem auf Deutsch.\n" +
  "Schreib natürliches, lockeres Deutsch in der Du-Form, so wie ein echter Mensch textet. Kein Übersetzungs-Deutsch, keine englischen Wörter dazwischen (außer Namen und Dinge, die wirklich kein deutsches Wort haben).\n" +
  "═══ ENDE SPRACHE ═══\n\n";

// Kurz, klar getrennt: was passiert in Kursiv, was gesagt wird normal.
const FORMAT_RULE =
  "═══ FORM & LÄNGE — WICHTIG ═══\n" +
  "HALTE DICH KURZ: 2–4 kurze Sätze pro Nachricht, höchstens ein kurzer Absatz. Keine Monologe, keine Aufzählungen, keine Wiederholungen. Lieber knapp und öfter.\n" +
  "TRENNE HANDLUNG UND REDE: Alles, was passiert und was man sieht (sie betritt den Raum, alle Blicke gehen auf sie), steht in *Sternchen und kursiv* — immer in einer EIGENEN Zeile. Gesprochenes steht in normaler Schrift, ohne Anführungszeichen. Beispiel:\n" +
  "*Sie lehnt sich in die Tür, das Licht fällt auf ihre Schultern.*\n" +
  "Na — hast du auf mich gewartet?\n" +
  "Danach höchstens drei [SUGGEST: …]-Optionen in einer eigenen Zeile. Sonst nichts.\n" +
  "═══ ENDE FORM ═══\n\n";

// "Noch ein Bild" läuft der Reihe nach durch diese Aufnahmen — immer derselbe Look.
const EXTRA_SHOTS = [
  "she looks straight into the camera, three-quarter view, wide shot, her whole upper body and her face in frame",
  "she looks over her shoulder at the camera, wide shot, head, chest and hips in frame",
  "she sits on the edge of the bed, wide shot, her whole body in frame, the room visible around her",
  "she stands leaning against the wall, wide shot, head, chest and hips in frame",
  "she lies on the bed on her side, wide shot, her upper body and her face in frame",
  "she walks towards the camera, wide shot, her whole body in frame",
  "she stands by the window with the light behind her, wide shot, head, chest and hips in frame",
  "she sits on the floor, wide shot, her whole body in frame, the room visible around her",
];

export default function Messages() {
  const [creators, setCreators] = useState([]);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [openChats, setOpenChats] = useState([]);
  const [messages, setMessages] = useState({});
  const [drafts, setDrafts] = useState({});
  const [pendingFiles, setPendingFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [listWidth, setListWidth] = useState(() => {
    try { return Number(localStorage.getItem(LIST_W_KEY)) || 360; } catch (e) { return 360; }
  });
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
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
  const [dmPartnerId, setDmPartnerId] = useState(null);
  const [freeLeft, setFreeLeft] = useState(FREE_CREATIONS);
  const [textModels, setTextModels] = useState([]);
  const [activeModelId, setActiveModelId] = useState(() => {
    try { return localStorage.getItem(TEXT_MODEL_KEY) || ""; } catch (e) { return ""; }
  });
  // Nur ein selbst gewähltes Modell wird vorgeschaltet — das automatisch
  // vorbelegte antwortet nicht und würde jede Antwort nur verzögern.
  const [modelPicked, setModelPicked] = useState(() => {
    try { return !!localStorage.getItem(TEXT_MODEL_KEY); } catch (e) { return false; }
  });
  const [extraCharacters, setExtraCharacters] = useState([]);
  // Wer bin ich in der Szene: ich selbst, Regie, oder ich spiele Figuren — pro Gespräch gemerkt.
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [roleReady, setRoleReady] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const speakAs = speakAsFromRole(role);
  const spannerMode = role.mode === "DIRECTOR";
  // Wie viel Gas die Szene hat — pro Gespräch gemerkt.
  const [playLevel, setPlayLevel] = useState("NORMAL");
  // Die Stimmung der Szene — Schlagworte, die die Tonlage sofort umstellen.
  const [moods, setMoods] = useState([]);
  const [incomingConversations, setIncomingConversations] = useState([]);

  // Gedächtnis pro Chat — nur auf Wunsch. Aus = sie weiß nicht, was vorher besprochen wurde, und fängt neu an.
  const [memoryOn, setMemoryOn] = useState(false);
  useEffect(() => {
    try { setMemoryOn(activeChat ? localStorage.getItem(`chat_mem_${activeChat}`) === "1" : false); } catch {}
  }, [activeChat]);
  const toggleMemory = () => setMemoryOn((v) => {
    const n = !v;
    try { if (activeChat) localStorage.setItem(`chat_mem_${activeChat}`, n ? "1" : "0"); } catch {}
    return n;
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session, joined } = useCallSession();
  const callRunning = joined && !!session;
  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const extraShotRef = useRef(0);
  const dmConvIdsRef = useRef(new Set());
  const activeChatRef = useRef(null);
  const aiConvsRef = useRef({});
  const fileInputRef = useRef(null);
  const restoredRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Jedes offene Gespräch behält seinen eigenen Entwurf.
  const input = activeChat ? (drafts[activeChat] || "") : "";

  // Ein Wunsch aus dem "Sag was du willst"-Knopf landet direkt im Eingabefeld.
  useEffect(() => {
    if (!activeChat) return;
    let wish = "";
    try {
      wish = localStorage.getItem("artanis_wish_pick") || "";
      if (wish) localStorage.removeItem("artanis_wish_pick");
    } catch (e) {
      return;
    }
    if (wish) setDrafts((prev) => ({ ...prev, [activeChat]: prev[activeChat] || wish }));
  }, [activeChat]);
  const setInput = (value) => {
    if (!activeChat) return;
    setDrafts((prev) => ({
      ...prev,
      [activeChat]: typeof value === "function" ? value(prev[activeChat] || "") : value,
    }));
  };

  // Alles Angehängte liegt hier — eins nach dem anderen, so viele du magst.
  const pendingImage = pendingFiles[0]?.url || null;

  const attachFiles = async (files) => {
    const added = [];
    for (const file of files) {
      try {
        const result = await base44.integrations.Core.UploadPublicFile({ file });
        const kind = file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "audio" : "image";
        added.push({ type: kind, url: result.file_url, name: file.name });
      } catch (err) {
        console.error(err);
      }
    }
    if (added.length) setPendingFiles((prev) => [...prev, ...added]);
    else toast({ title: "Nicht angehängt", description: "Die Datei kam nicht durch.", variant: "destructive" });
  };

  const onDropFiles = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) attachFiles(files);
  };

  // Den Balken zwischen Liste und Chat ziehen — die Breite bleibt gemerkt.
  const startResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = listWidth;
    const move = (ev) => setListWidth(Math.min(720, Math.max(240, startW + ev.clientX - startX)));
    const stop = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
      setListWidth((w) => {
        try { localStorage.setItem(LIST_W_KEY, String(w)); } catch (err) { /* ignore */ }
        return w;
      });
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", stop);
  };

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
      const [creatorData, contentData, storyData, voiceData] = await Promise.all([
        base44.entities.Creator.list(),
        base44.entities.Content.filter({ published: true }, "-created_date", 20),
        base44.entities.Story.filter({ published: true }, "-created_date", 20),
        base44.entities.Voice.list()
      ]);
      setCreators(creatorData.sort((a, b) => (a.creatorCategory === "REAL" ? 0 : 1) - (b.creatorCategory === "REAL" ? 0 : 1)));
      setContentList(contentData);
      setStories(storyData);
      setVoices(voiceData);
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setFreeLeft(freeRemaining(user.id));
        const prefs = await base44.entities.UserPreference.filter({ userId: user.id });
        if (prefs.length > 0) setUserPref(prefs[0]);
        const modelData = await base44.entities.TextModel.filter({ enabled: true });
        setTextModels(modelData);
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

  // Immer unten bleiben — auch wenn Bilder erst nachträglich fertig geladen werden.
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    const t = setTimeout(() => { el.scrollTop = el.scrollHeight; }, 700);
    return () => clearTimeout(t);
  }, [messages, activeChat, sending]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Der offene Chat überlebt ein Neuladen — man landet nie wieder draußen.
  useEffect(() => {
    if (!activeChat) return;
    try {
      localStorage.setItem(ACTIVE_CHAT_KEY, JSON.stringify({ viewMode, id: activeChat }));
    } catch (e) { /* ignore */ }
  }, [activeChat, viewMode]);

  // Nach einem Reload automatisch wieder im letzten Gespräch stehen.
  useEffect(() => {
    if (loading || restoredRef.current) return;
    restoredRef.current = true;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(ACTIVE_CHAT_KEY) || "null"); } catch (e) { /* ignore */ }
    if (!saved?.id) return;
    if (saved.viewMode === "dm") {
      (async () => {
        try {
          const conv = await base44.entities.Conversation.get(saved.id);
          const name = conv.participantName || conv.userName || "Unbekannt";
          setViewMode("dm");
          addTab({ id: conv.id, type: "dm", name });
          setActiveChat(conv.id);
          setDmParticipantName(name);
          const msgs = await base44.entities.Message.filter({ conversationId: conv.id }, "created_date", 100);
          setMessages((prev) => ({ ...prev, [conv.id]: msgs }));
        } catch (e) { console.error(e); }
      })();
    } else {
      const creator = creators.find((c) => c.id === saved.id);
      if (creator) openAiChat(creator);
    }
  }, [loading, creators]);

  useEffect(() => {
    setExtraCharacters([]);
    setPendingFiles([]);
    // Was der Stimmungs-Modus eingestellt hat, gilt für dieses eine Erlebnis.
    const pending = activeChat ? takePendingMood() : null;
    if (pending?.creatorId) {
      setMoodFor(activeChat, pending.moodIds || []);
      setPlayLevelFor(activeChat, pending.playLevel || "NORMAL");
      setSceneNote(activeChat, pending.sceneNote || "");
      setStyleFor(activeChat, pending.creatorId, { preset: pending.styleId || null, note: pending.styleNote || "" });
      // Der Klang zieht sofort mit: Tempo, Tonlage, Intensität und Stimmung der Stimme.
      setVoiceOverride(activeChat, pending.voice || null);
    }
    setPlayLevel(pending?.creatorId ? pending.playLevel || "NORMAL" : playLevelFor(activeChat));
    setMoods(pending?.creatorId ? pending.moodIds || [] : moodFor(activeChat));
    const savedRole = roleFor(activeChat);
    setRole(savedRole || DEFAULT_ROLE);
    setRoleReady(!!savedRole);
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

  // Schreibt der echte Charakter selbst, kommt die Zeile sofort an — nicht erst nach dem Neuladen.
  useEffect(() => {
    if (viewMode !== "ai" || !activeChat) return;
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type !== "create" || !event.data?.humanOverride) return;
      // Eigene Zeilen stehen schon im Chat — sie kommen nicht noch einmal an.
      if (event.data.created_by_id === currentUser?.id) return;
      const conv = aiConvsRef.current[activeChat];
      if (!conv || event.data.conversationId !== conv.id) return;
      setMessages((prev) => {
        const existing = prev[activeChat] || [];
        if (existing.some((m) => m.id === event.data.id)) return prev;
        return { ...prev, [activeChat]: [...existing, event.data] };
      });
      autoRead(activeChat, event.data.text, event.data.sender, event.data.id);
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

  // Die Stimmbank: der Charakter spricht mit der Stimme, die ihm zugeordnet ist.
  const voiceProfileFor = (creatorId) => {
    const creator = creators.find((c) => c.id === creatorId);
    const base = voices.find((v) => v.id === creator?.voiceProfileId) || null;
    const override = voiceOverrideFor(creatorId);
    if (!override) return base;
    return { ...(base || { baseVoice: creator?.voice || "honey" }), ...override };
  };

  // Wer hier schreibt, und mit welcher Stimme er gerade klingt.
  const activeCreator = creators.find((c) => c.id === activeChat) || null;
  const activeProfile = voiceProfileFor(activeChat);

  // Wer im Raum ist, wen ich spiele und wen die KI spielt.
  const nameOf = (id) => creators.find((c) => c.id === id)?.stageName;
  const roomIds = activeChat ? [activeChat, ...extraCharacters.map((c) => c.id)] : [];
  const aiNames = aiCast(roomIds, role).map(nameOf).filter(Boolean);
  const playedNames = role.playing.map(nameOf).filter(Boolean);
  const listenerNames = (role.muted || []).map(nameOf).filter(Boolean);

  const commitRole = (next) => {
    // Wer nur zuhört, bleibt gemerkt — auch wenn die Rollenauswahl ihn nicht kennt.
    const merged = { ...next, muted: next.muted || role.muted || [] };
    setRole(merged);
    setRoleFor(activeChat, merged);
    setRoleReady(true);
    setRoleDialog(false);
  };

  // Was diese Figur gerade ist: spielt mit, du spielst sie, hört nur zu — oder ist nicht dabei.
  const castState = (id) => {
    if ((role.muted || []).includes(id)) return "MUTE";
    if (role.mode === "PLAY" && role.playing.includes(id)) return "ME";
    return roomIds.includes(id) ? "AI" : "OFF";
  };

  // Ein Klick im Menü — Figur reinholen, rausnehmen oder ihre Rolle umschalten.
  const setCastState = (id, next) => {
    if (id === activeChat && next === "OFF") return;
    const creator = creators.find((c) => c.id === id);
    if (!creator) return;
    if (next !== "OFF" && !roomIds.includes(id)) setExtraCharacters((prev) => [...prev, creator]);
    if (next === "OFF") setExtraCharacters((prev) => prev.filter((c) => c.id !== id));
    const playing = role.playing.filter((x) => x !== id);
    const muted = (role.muted || []).filter((x) => x !== id);
    if (next === "ME") playing.push(id);
    if (next === "MUTE") muted.push(id);
    commitRole({
      mode: playing.length ? "PLAY" : role.mode === "PLAY" ? "ME" : role.mode,
      playing,
      muted,
      current: playing.includes(role.current) ? role.current : playing[0] || null,
    });
  };

  // Wer im Chat dabei ist — mit Rolle, Stimme und Wortwahl, so wie es der Export braucht.
  const castForExport = () => roomIds.map((id) => {
    const c = creators.find((x) => x.id === id);
    const st = castState(id);
    const style = SPEECH_STYLES.find((p) => p.id === styleFor(activeChat, id).preset);
    return {
      name: c?.stageName || "Figur",
      role: st === "ME" ? "Ich spiele" : st === "MUTE" ? "Hört zu" : "Redet mit",
      voice: voices.find((v) => v.id === c?.voiceProfileId)?.name || c?.voice || "",
      style: style?.label || "",
    };
  });

  // Jede Figur spricht mit ihrer eigenen Stimme, die Erzählung mit einer ruhigen Erzählstimme.
  const voiceForName = (fallbackName) => (name) => {
    if (name === "__NARRATOR__") return { baseVoice: "river" };
    const find = (n) => {
      const low = String(n || "").toLowerCase();
      if (!low) return null;
      return creators.find((c) => c.stageName.toLowerCase() === low)
        || creators.find((c) => low.startsWith(c.stageName.toLowerCase().split(" ")[0]));
    };
    const c = find(name) || find(fallbackName) || activeCreator;
    const base = voices.find((v) => v.id === c?.voiceProfileId) || { baseVoice: c?.voice || "honey" };
    const override = c?.id ? voiceOverrideFor(c.id) : null;
    return override ? { ...base, ...override } : base;
  };
  const readScene = (text, speakerName, key) => playScene(splitScene(text, speakerName), voiceForName(speakerName), key, moodVoice(moods));
  // Jede neue Zeile wird von selbst vorgelesen — solange Vorlesen an ist.
  const autoRead = (chatKey, text, speakerName, key) => {
    if (!text || chatKey !== activeChatRef.current || !voiceNotesOn(chatKey, true)) return;
    readScene(text, speakerName, key);
  };

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
      scenarioAnchor += "6. MOVE THE STORY ON — A SCENE MUST NEVER STALL. After a handful of exchanges in the same place, actively push the story forward yourself: suggest leaving, going somewhere private, the drive home, the next drink, the hotel. Offer it as one of the [SUGGEST] options. Never loop the same location forever — a taxi ride does not last all evening, it ends at a door.\n";
      scenarioAnchor += "═══ END SCENARIO ═══\n\n";
    }

    let ctx = scenarioAnchor + LANGUAGE_RULE + FORMAT_RULE + persona.prompt;

    // Override name/bio for custom characters (Lena, Mia, etc.)
    const activeCreator = creators.find(c => c.id === activeChat);
    if (activeCreator && activeCreator.personaType === "GROUP") {
      ctx += "\n\n═══ GROUP SCENE — you are SEVERAL people at once ═══\n";
      ctx += `This is the group "${activeCreator.stageName}". Everyone described here is present and speaks for herself.\n`;
      ctx += (activeCreator.bio || "") + "\n";
      ctx += "RULES: Start EVERY spoken line with the speaker's name in brackets, e.g. [Name]: ... Each has her own voice, her own mood and her own secret — never mix them up. They react to each other, tease each other and the user, and can touch each other. The user can address anyone by name — only that one answers first. Keep every character present in the scene.\n";
      ctx += "═══ END GROUP ═══\n";
    } else if (activeCreator && activeCreator.personaPrompt) {
      // Ein an der Dockingstation angedockter Charakter bringt seine eigene Anweisung mit.
      ctx += "\n\n" + activeCreator.personaPrompt;
    } else if (activeCreator && !["Artanis", "Tania", "Artanis × Tania"].includes(activeCreator.stageName)) {
      ctx += `\n\nIMPORTANT: Your name is ${activeCreator.stageName} — NOT Tania or Artanis. You are ${activeCreator.stageName}. ${activeCreator.bio || ""} You are a friend of Tania's. Use the personality template above, but your identity is ${activeCreator.stageName}. When you refer to yourself, use the name ${activeCreator.stageName}.`;
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
    const roster = creators.filter((c) => c.id !== activeChat && c.active !== false);
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
    ctx += rolePrompt(role, playedNames, aiNames, listenerNames);

    // ── SCENARIO ANCHOR #3 (last thing the AI sees — triple-anchored) ──
    if (scenario) {
      ctx += "\n\n⚠️ FINAL REMINDER: You are in the scenario \"" + scenario.title + "\". Respect the current location and position — do NOT teleport or jump around. If the user wants to change the location, follow their lead naturally and describe the move. Only reference objects that exist in the current scene.";
    }
    // Letzte, stärkste Anweisung: hinzugefügte Personen dürfen nicht stumm bleiben.
    const speakers = [activeCreator, ...extraCharacters].filter((c) => c && !(role.muted || []).includes(c.id));
    if (speakers.length > 1) {
      const names = speakers.map((c) => c.stageName);
      ctx += `\n\n⚠️ ES SIND ${names.length} FRAUEN IM RAUM: ${names.join(", ")}. JEDE von ihnen MUSS in JEDER Antwort mindestens einen Satz sagen, immer mit ihrem Namen in eckigen Klammern davor — z.B. [${names[1] || names[0]}]: … Keine Antwort darf eine von ihnen stumm lassen. Alle sind im Bild zu sehen, und keine verlässt den Raum.`;
    }
    ctx += playPrompt(playLevel);
    ctx += moodPrompt(moods);
    ctx += speechPrompt(activeChat, [activeCreator, ...extraCharacters]);
    ctx += sceneNotePrompt(activeChat);
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

  // Ist der Schalter an, geht deine Aufnahme sofort mit der Stimme des
  // Charakters raus — sonst tippt das Mikrofon wie gewohnt nur den Text ein.
  const [convertVoice, setConvertVoice] = useState(false);

  useEffect(() => {
    if (!activeChat) return;
    if (!myVoiceConvertDecided(activeChat)) setConvertVoice(myVoiceConvertOn(activeChat, !!voiceProfileFor(activeChat)));
  }, [activeChat, voices]);

  const toggleVoiceConvert = (next) => {
    setConvertVoice(next);
    setMyVoiceConvertOn(activeChat, next);
  };

  const convertRecorder = useVoiceRecorder(async (fileUri) => {
    const profile = voiceProfileFor(activeChat);
    const character = creators.find((c) => c.id === activeChat) || null;
    if (!profile) {
      toast({ title: "Keine Stimme hinterlegt", description: "Ordne dem Charakter zuerst in der Stimmbank eine Stimme zu.", variant: "destructive" });
      return;
    }
    try {
      const res = await base44.functions.invoke("voiceConvert", {
        fileUri,
        voiceId: profile.externalVoiceId || "",
        baseVoice: profile.baseVoice || "honey",
        mood: profile.mood,
        intensity: profile.intensity,
        ending: profile.ending,
      });
      if (res.data?.error) throw new Error(res.data.error);
      await stageVoice(res.data.url, character);
    } catch (e) {
      toast({ title: "Umwandeln hat nicht geklappt", description: e.message || "Bitte noch einmal versuchen.", variant: "destructive" });
    }
  });

  const voiceNoteMode = convertVoice && !!activeProfile;

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
        let url = null;
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioFile = new File([audioBlob], "voice.webm", { type: "audio/webm" });
          url = (await base44.integrations.Core.UploadPublicFile({ file: audioFile })).file_url;
        } catch (e) {
          console.error(e);
          setTranscribing(false);
        }
        // Aufnahme beendet = gesendet. Kein zweites Abhören, kein extra Klick.
        if (url) await sendVoiceNote(url);
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
      || creators.find((c) => c.personaType === "SOLO_MALE");
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
    // Erst normal, dann entschärft: der Bildfilter blockt sonst gern und es käme nie ein Bild an.
    const attempts = [
      { text: promptText, refs: usedRefs },
      { text: sanitizeImagePrompt(promptText), refs: usedRefs },
      { text: sanitizeImagePrompt(promptText), refs: [] },
    ];
    for (const attempt of attempts) {
      try {
        const result = await base44.integrations.Core.GenerateImage({
          prompt: attempt.text,
          existing_image_urls: attempt.refs.length ? attempt.refs : undefined,
        });
        if (result?.url) return result.url;
      } catch (e) {
        console.error("Bildversuch fehlgeschlagen:", e);
      }
    }
    return null;
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
    const mainCreator = creators.find((c) => c.id === activeChat);
    const women = [mainCreator, ...extraCharacters].filter(Boolean);
    const womenNames = women.map((c) => c.stageName).join(", ");
    const showMale = !(spannerMode && extraCharacters.length > 0);
    const who = showMale
      ? `Amateur phone photo. EXACTLY ${women.length + 1} people are in frame: the ${women.length === 1 ? "woman" : "women"} ${womenNames}, each one clearly visible and recognisable, together with the SAME man as in his reference photo. `
      : `Amateur phone photo. EXACTLY ${women.length} people are in frame: ${womenNames} — all of them together, each one clearly visible and recognisable. `;
    const sameMan = showMale ? "The man is ALWAYS the same man — the one from the man's reference photo. Never a different man, never a different face. " : "";
    const fixedOutfit = "OUTFIT IS FIXED: every woman wears EXACTLY the same clothes as in her own reference photo — same garment, same colour, same cut. No outfit change, no new clothes, nobody dressed differently. ";
    // Zeichentrick-Charaktere bekommen die gezeichnete Fassung, alle anderen das echte Foto.
    const style = mainCreator?.artStyle === "CARTOON" ? CARTOON_STYLE : PHOTOREAL;
    return style + IMAGE_SAFE_RULES + who + sameMan + fixedOutfit + imgCtx + "realistic, natural lighting matching the scene, slightly grainy, raw, intimate, not professional, tasteful and teasing, leave something to the imagination, " + desc;
  };

  // Die Medien zur Antwort — Bilder, Video, Sprachnachricht. Läuft NACH der
  // Textantwort und hängt sich an dieselbe Nachricht.
  const generateMediaFor = async (parsed, extraRefImages = []) => {
    const creator = creators.find(c => c.id === activeChat);
    const creatorRefs = creator?.referenceImages?.length ? creator.referenceImages : [];
    const userRefs = userPref?.userReferenceImages || [];
    // Die Vorlagen der Figur stehen IMMER vorne — ihr Gesicht, ihre Haare,
    // ihr Make-up und ihr Outfit geben jedes Bild vor.
    const allRefImages = [...creatorRefs, ...extraRefImages, ...userRefs].length
      ? [...creatorRefs, ...extraRefImages, ...userRefs]
      : null;
    const attachments = [];
    // Admins und Gold-Member zahlen nie — für sie ist alles offen.
    const isGold = hasProAccess(currentUser);

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

    // Eine eigene Sprachnachricht gibt es nur, wenn die Figur selbst eine schickt —
    // der ganze Text wird ohnehin mit allen Stimmen vorgelesen.
    const spoken = parsed.voice;
    if (spoken) {
      try {
        const url = await speakAsVoice(voiceProfileFor(activeChat), spoken);
        if (url) attachments.push({ type: "audio", url, locked: false, price: null });
      } catch (e) {
        console.error("Voice generation failed:", e);
      }
    }

    // Konnte ein Bild nicht erzeugt werden: direkt aus dem Chat das Nachdrehen anbieten.
    if (missed) attachments.push({ type: "reshoot", note: missed });

    return attachments;
  };

  const sendMessage = async (overrideText, extraFiles) => {
    const listening = speakAs === "LISTEN";
    const msgText = overrideText || input;
    if (extraFiles?.length) return sendMessageWith(msgText, [...pendingFiles, ...extraFiles]);
    return sendMessageWith(msgText, pendingFiles);
  };

  const sendMessageWith = async (msgText, files) => {
    const listening = speakAs === "LISTEN";
    const img = files.find((f) => f.type === "image")?.url || null;
    // Die eigene Sprachnachricht zählt als gesagter Text — nicht als Bild.
    const visual = files.filter((f) => f.type !== "audio");
    if ((!listening && !msgText.trim() && !files.length) || !activeChat) return;
    // Die Begleiterin hört mit: fällt eines ihrer Wörter, meldet sie sich.
    announceToNarrator(msgText);
    if (viewMode === "dm") { return sendDmMessage(msgText, files); }
    const chatKey = activeChat;
    if (!aiNames.length) {
      toast({ title: "Niemand spielt mit sich selbst", description: "Hol noch jemanden dazu oder gib eine Figur frei — oben unter Rollen.", variant: "destructive" });
      return;
    }
    const aiSenderName = aiNames[0];
    // Schreibe ich als eine Figur, geht die Zeile als diese Figur raus.
    const asCharacter = !listening && speakAs !== "ME" ? creators.find((c) => c.id === speakAs) || null : null;
    // In der Regie wird Geschriebenes zur Regieanweisung.
    const direction = listening && msgText.trim() ? "🎬 Regie: " + msgText : "";

    if (asCharacter) {
      const asMsg = { senderType: "AI", sender: asCharacter.stageName, text: msgText, attachments: files, humanOverride: true, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), asMsg] }));
      autoRead(chatKey, msgText, asCharacter.stageName, asMsg.createdAt);
    } else if (!listening || direction) {
      const userMsg = { senderType: "HUMAN", text: direction || msgText, attachment: img || null, attachments: files, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), userMsg] }));
      await saveUserReferences(files.filter((f) => f.type === "image").map((f) => f.url));
    }
    const conv = await ensureConv(chatKey);
    if (conv && asCharacter) {
      base44.entities.Message.create({ conversationId: conv.id, sender: asCharacter.stageName, senderType: "AI", text: msgText, attachments: files, humanOverride: true }).catch(() => {});
    } else if (conv && (!listening || direction)) {
      base44.entities.Message.create({ conversationId: conv.id, sender: publicName(currentUser), senderType: "HUMAN", text: direction || msgText, attachment: img || null, attachments: files }).catch(() => {});
    }
    setInput("");
    setPendingFiles([]);
    setSending(true);

    try {
      // Hat der echte Charakter übernommen oder selbst geantwortet, bleibt die KI still.
      // Schreibst du selbst als Figur, antworten die anderen immer.
      if (!asCharacter && await waitForHuman(conv)) return;
      const hist = memoryOn ? (messages[chatKey] || []).slice(-12).map(m => {
        let t = m.text || "";
        if (m.attachment) t += t ? " [also sent a photo]" : "[sent a photo]";
        const who = m.senderType === "HUMAN" ? "User" : (m.humanOverride && m.sender ? m.sender : "You");
        return `${who}: ${t}`;
      }).join("\n") : "";
      const userTurn = direction
        ? `\n\nRegieanweisung vom Nutzer (er spielt nicht mit, er führt Regie): "${msgText}". Setzt sie jetzt sofort um — die Figuren spielen miteinander weiter, abwechselnd, jede mit ihrem Namen in eckigen Klammern.`
        : listening
        ? "\n\nDer Nutzer hört nur zu und sagt nichts. Spiel die Szene von allein weiter: die Figuren im Raum reden und handeln miteinander, ohne ihn. Knüpfe direkt an das letzte Gesagte an und bring die Szene ein Stück voran."
        : asCharacter
          ? `\n\nDer Nutzer schreibt gerade als ${asCharacter.stageName}. ${asCharacter.stageName} hat gesagt: "${msgText}". Antworte als die ANDEREN im Raum — ${asCharacter.stageName} selbst kommt jetzt nicht zu Wort.`
          : visual.length
            ? "\n\nThe user sent you " + (visual.length === 1 ? "a photo" : visual.length + " files, one after another") + (msgText.trim() ? " WITH this message: \"" + msgText + "\"" : "") + ". React to BOTH as one natural reply — answer what they wrote AND react to what you see. Everything they sent is now saved as a PERMANENT reference: whoever is in it keeps exactly that face, body, hair colour and skin in every future image — never change them again. Say out loud that you'll keep it. Then generate a response image that incorporates what they showed you (put yourself in the scene with them)."
            : "\n\nThe user said: \"" + msgText + "\"";
      const system = buildContext();
      const userPrompt = (hist ? "CONVERSATION SO FAR:\n" + hist + "\n\n" : "") + userTurn + (scenario ? "\n\n⚠️ You are in: " + scenario.title + ". Stay in position. Only reference what exists here." : "");
      // Läuft ein Text-Modell über Hugging Face, antwortet der Charakter damit — sonst mit der Standard-KI.
      let aiText = "";
      if (activeModelId && modelPicked) {
        try {
          const modelRes = await base44.functions.invoke("hfChat", { modelId: activeModelId, system, prompt: userPrompt });
          aiText = modelRes.data?.text || "";
        } catch (e) { aiText = ""; }
      }
      if (!aiText) {
        const res = await base44.integrations.Core.InvokeLLM({ prompt: system + userPrompt });
        aiText = typeof res === "string" ? res : (res.response || res.text || res.output || "I'll get back to you soon!");
      }
      const delay = 3000 + Math.floor(Math.random() * 2000);
      await new Promise(r => setTimeout(r, delay));

      // Erst die Antwort: sie steht sofort und ist gespeichert. Die Medien
      // kommen danach und hängen sich an dieselbe Nachricht — so bleibt keine
      // Antwort aus, wenn ein Bild oder Video lange braucht.
      const parsed = parseReply(aiText);
      const aiMsg = { senderType: "AI", sender: aiSenderName, text: parsed.cleanText, attachments: [], suggestions: parsed.suggestions, characters: parsed.characters, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));
      autoRead(chatKey, parsed.cleanText, aiSenderName, aiMsg.createdAt);
      let savedAi = null;
      if (conv) {
        savedAi = await base44.entities.Message.create({ conversationId: conv.id, sender: aiSenderName, senderType: "AI", text: parsed.cleanText, attachments: [], suggestions: parsed.suggestions, characters: parsed.characters }).catch(() => null);
        base44.entities.Conversation.update(conv.id, { lastMessageAt: new Date().toISOString(), waitingSince: null }).catch(() => {});
      }

      const attachments = await generateMediaFor(parsed, visual.map((f) => f.url));
      if (attachments.length) {
        setMessages(prev => ({ ...prev, [chatKey]: (prev[chatKey] || []).map((m) => (m === aiMsg ? { ...m, attachments } : m)) }));
        if (savedAi?.id) base44.entities.Message.update(savedAi.id, { attachments }).catch(() => {});
      }
      setFreeLeft(freeRemaining(currentUser?.id));

      const userMsgCount = (messages[chatKey] || []).filter(m => m.senderType === "HUMAN").length + (asCharacter || listening ? 0 : 1);
      if (userMsgCount > 0 && userMsgCount % 5 === 0) {
        toast({
          title: "🎁 Belohnung freigeschaltet!",
          description: `Du hast ${userMsgCount} Nachrichten gesendet! Exklusive Inhalte wurden für dich freigeschaltet.`,
        });
      }
    } catch (e) {
      // Auch wenn etwas schiefgeht, meldet sich der Charakter — und die Zeile bleibt gespeichert.
      const fallback = "Ich bin da — sag es mir bitte noch einmal.";
      const aiMsg = { senderType: "AI", text: fallback, createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));
      if (conv) base44.entities.Message.create({ conversationId: conv.id, sender: creators.find(c => c.id === chatKey)?.stageName, senderType: "AI", text: fallback }).catch(() => {});
    } finally {
      setSending(false);
    }
  };

  // Ein Klick, ein neues Bild — im gleichen Stil, ohne dass die KI erst antworten muss.
  const requestAnotherImage = async () => {
    if (!activeChat || generating || sending) return;
    const chatKey = activeChat;
    setGenerating(true);
    try {
      const creator = creators.find((c) => c.id === chatKey);
      const desc = EXTRA_SHOTS[extraShotRef.current % EXTRA_SHOTS.length];
      extraShotRef.current += 1;
      const refs = [
        ...(creator?.referenceImages?.length ? creator.referenceImages : []),
        ...(userPref?.userReferenceImages || []),
      ];
      const url = await generateWithFallback(buildImgPrompt(desc), refs, chatMode);
      if (!url) {
        toast({ title: "Kein Bild", description: "Versuch es gleich nochmal.", variant: "destructive" });
        return;
      }
      const isGold = hasProAccess(currentUser);
      const isFree = isGold || consumeFree(currentUser?.id);
      const attachment = { type: "image", url, locked: !isFree, price: isFree ? null : 4.99 };
      const aiMsg = { senderType: "AI", text: "", attachments: [attachment], createdAt: new Date().toISOString() };
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), aiMsg] }));
      const conv = await ensureConv(chatKey);
      if (conv) base44.entities.Message.create({ conversationId: conv.id, sender: creator?.stageName, senderType: "AI", text: "", attachments: [attachment] }).catch(() => {});
      setFreeLeft(freeRemaining(currentUser?.id));
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length) await attachFiles(files);
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
  const saveUserReferences = async (urls) => {
    const existing = userPref?.userReferenceImages || [];
    const fresh = urls.filter((u) => u && !existing.includes(u));
    if (!fresh.length) return;
    try {
      await persistUserRefs([...existing, ...fresh]);
    } catch (err) {
      console.error(err);
    }
  };

  const saveUserReference = (url) => saveUserReferences([url]);

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
        userName: publicName(me),
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

  // Die neueste Zeile, die der echte Charakter selbst geschrieben hat.
  const newestHumanLine = async (convId) => {
    const list = await base44.entities.Message.filter({ conversationId: convId, humanOverride: true }, "-created_date", 1);
    return list[0]?.created_date || null;
  };

  // Erst der Mensch, dann die KI: kurzer Vorsprung, dann übernimmt sie selbst.
  const waitForHuman = async (conv) => {
    if (!conv) return false;
    // Der Admin ist selbst der Mensch — in seinen eigenen Chats wartet niemand.
    if (currentUser?.role === "admin") return false;
    const fresh = await base44.entities.Conversation.get(conv.id).catch(() => conv);
    const baseline = await newestHumanLine(conv.id).catch(() => null);

    // "Ich übernehme" gilt nur, solange die echte Person auch wirklich schreibt.
    // Ist sie weg, übernimmt die KI wieder — sonst bliebe der Chat für immer stumm.
    if (fresh?.handledBy === "HUMAN") {
      const lastHuman = baseline ? new Date(baseline).getTime() : 0;
      if (lastHuman && Date.now() - lastHuman < HUMAN_WINDOW_MS) return true;
      await base44.entities.Conversation.update(conv.id, { handledBy: "AI", waitingSince: null }).catch(() => {});
      return false;
    }

    // Der Besitzer ist nicht da — dann wartet hier niemand: die KI antwortet sofort,
    // damit kein Gast weggeht, weil es still bleibt.
    if (!(await ownerIsPresent())) {
      // Standard ist dann die KI — auch wenn der Chat vorher auf "Ich übernehme" stand.
      base44.entities.Conversation.update(conv.id, { waitingSince: null, handledBy: "AI" }).catch(() => {});
      return false;
    }

    const startedAt = new Date().toISOString();
    await base44.entities.Conversation.update(conv.id, {
      waitingSince: startedAt,
      lastGuestMessageAt: startedAt,
      lastMessageAt: startedAt,
    }).catch(() => {});
    base44.functions.invoke("notifyWaitingChat", { conversationId: conv.id }).catch(() => {});

    const until = Date.now() + HUMAN_WINDOW_MS;
    while (Date.now() < until) {
      await new Promise((r) => setTimeout(r, 2500));
      try {
        const now = await base44.entities.Conversation.get(conv.id);
        if (now?.handledBy === "HUMAN") return true;
        if (await newestHumanLine(conv.id) !== baseline) return true;
      } catch (e) { /* kurz nicht erreichbar — weiter warten */ }
    }
    // Die KI übernimmt jetzt selbst — der Warte-Status ist damit erledigt.
    base44.entities.Conversation.update(conv.id, { waitingSince: null }).catch(() => {});
    return false;
  };

  const addTab = (tab) => {
    setOpenChats((prev) => prev.some((t) => t.id === tab.id)
      ? prev.map((t) => (t.id === tab.id ? { ...t, ...tab } : t))
      : [...prev, tab]);
  };

  // Zurück in ein offenes Gespräch — Szenario und Einstellungen werden wiederhergestellt.
  const restoreAiContext = (chatId) => {
    const creator = creators.find((c) => c.id === chatId);
    setChatMode(creator?.personaType === "SOLO_MALE" ? "artanis" : (creator?.personaType === "COUPLE" || creator?.personaType === "GROUP") ? "couple" : "tania");
    const conv = aiConvsRef.current[chatId];
    const restoredScenario = conv?.scenario || null;
    const restoredAnswers = conv?.setupAnswers || {};
    setScenario(restoredScenario);
    setSetupAnswers(restoredAnswers);
    setSetupStep(restoredScenario && Object.keys(restoredAnswers).length > 0 ? (restoredScenario.setupQuestions?.length || 0) : 0);
    setSetupInput("");
  };

  const activateTab = (tab) => {
    setActiveChat(tab.id);
    if (tab.type === "ai") {
      setViewMode("ai");
      restoreAiContext(tab.id);
    } else {
      setViewMode("dm");
      setDmParticipantName(tab.name);
      setDmPartnerId(tab.partnerId || null);
    }
  };

  const closeTab = (id) => {
    const idx = openChats.findIndex((t) => t.id === id);
    const next = openChats.filter((t) => t.id !== id);
    setOpenChats(next);
    if (id !== activeChat) return;
    const fallback = next[idx] || next[idx - 1] || null;
    if (fallback) activateTab(fallback);
    else setActiveChat(null);
  };

  const openAiChat = async (c) => {
    addTab({ id: c.id, type: "ai", name: c.stageName });
    setActiveChat(c.id);
    setMessages((prev) => ({ ...prev, [c.id]: [] }));
    const conv = await ensureConv(c.id);
    restoreAiContext(c.id);
    if (!conv) return;
    try {
      const msgs = await base44.entities.Message.filter({ conversationId: conv.id }, "created_date", 200);
      setMessages((prev) => ({ ...prev, [c.id]: msgs }));
    } catch (e) { console.error(e); }
  };

  // Denselben Chat in den laufenden Video-Call holen — alle sehen mit.
  const bringIntoCall = async () => {
    if (!callRunning || !activeChat || viewMode !== "ai") return;
    const conv = await ensureConv(activeChat);
    if (!conv) return;
    requestStage({ id: conv.id, title: creators.find((c) => c.id === activeChat)?.stageName || "Chat" });
    navigate(`/call/${session.token}?r=${session.roomNumber || 1}`);
  };

  // Keeps the scenario + setup of the running chat, so you resume where you left off.
  useEffect(() => {
    if (viewMode !== "ai" || !activeChat) return;
    const conv = aiConvsRef.current[activeChat];
    if (!conv) return;
    aiConvsRef.current[activeChat] = { ...conv, scenario: scenario || null, setupAnswers };
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
        conv = await base44.entities.Conversation.create({ userId: me.id, userName: publicName(me), participantId: otherUser.id, participantName: publicName(otherUser, otherUser.email), conversationType: "HUMAN" });
      }
      addTab({ id: conv.id, type: "dm", name: otherUser.full_name || otherUser.email, partnerId: otherUser.id });
      setActiveChat(conv.id);
      setDmParticipantName(otherUser.full_name || otherUser.email);
      setDmPartnerId(otherUser.id);
      const msgs = await base44.entities.Message.filter({ conversationId: conv.id }, "created_date", 100);
      setMessages(prev => ({ ...prev, [conv.id]: msgs }));
    } catch (e) { console.error(e); }
  };

  // Als Admin jederzeit entscheiden: diese Person bekommt alles gratis.
  const giveFreeAccess = async () => {
    if (!dmPartnerId) return;
    try {
      await base44.entities.User.update(dmPartnerId, { memberStatus: "GOLD" });
      toast({ title: "Gratis freigeschaltet", description: `${dmParticipantName} hat ab jetzt alles frei.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler", description: "Freischaltung hat nicht geklappt.", variant: "destructive" });
    }
  };

  const sendDmMessage = async (msgText, files = pendingFiles) => {
    if ((!msgText.trim() && !files.length) || !activeChat) return;
    const chatKey = activeChat;
    try {
      const me = await base44.auth.me();
      const created = await base44.entities.Message.create({
        conversationId: chatKey,
        sender: publicName(me),
        senderType: "HUMAN",
        text: msgText,
        attachment: files[0]?.url || null,
        attachments: files
      });
      setMessages(prev => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), created] }));
      setInput("");
      setPendingFiles([]);
    } catch (e) { console.error(e); }
  };

  // Deine Sprachnachricht geht sofort raus: das Audio hängt dran, der gesprochene
  // Text steht dabei — so antwortet die Figur direkt und die Story bleibt exportierbar.
  const sendVoiceNote = async (url) => {
    if (!activeChat || !url) return;
    setTranscribing(true);
    let text = "";
    try {
      const res = await base44.integrations.Core.TranscribeAudio({ audio_url: url });
      text = typeof res === "string" ? res : (res?.transcript || res?.text || "");
    } catch (e) {
      console.error(e);
    } finally {
      setTranscribing(false);
    }
    const typed = input.trim();
    await sendMessage([typed, text.trim()].filter(Boolean).join(" ") || " ", [{ type: "audio", url, name: "Sprachnachricht" }]);
  };
  const stageVoice = (url) => sendVoiceNote(url);

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
    setPendingFiles([]);
    setSending(false);
  };

  const openIncomingDm = async (conv) => {
    const otherUser = dmUsers.find(u => u.id === conv.userId);
    const name = otherUser?.full_name || otherUser?.email || conv.userName || "Unbekannt";
    addTab({ id: conv.id, type: "dm", name, partnerId: otherUser?.id || conv.userId });
    setActiveChat(conv.id);
    setDmParticipantName(name);
    setDmPartnerId(otherUser?.id || conv.userId);
    const msgs = await base44.entities.Message.filter({ conversationId: conv.id }, "created_date", 100);
    setMessages(prev => ({ ...prev, [conv.id]: msgs }));
  };

  // Vereinbarter Betrag? Ein Klick — der Link steht sofort als Nachricht im Chat.
  const sendPaymentLink = async (link) => {
    const chatKey = activeChat;
    if (!chatKey) return;
    const conv = viewMode === "dm" ? { id: chatKey } : await ensureConv(chatKey);
    if (!conv) return;
    const text = `Zahlungslink: ${link.amount.toFixed(2).replace(".", ",")} € — ${link.title}`;
    const created = await base44.entities.Message.create({
      conversationId: conv.id,
      sender: viewMode === "dm" ? publicName(currentUser) : creators.find((c) => c.id === chatKey)?.stageName,
      senderType: viewMode === "dm" ? "HUMAN" : "AI",
      text,
      contentLink: `/pay/${link.token}`,
    });
    setMessages((prev) => ({ ...prev, [chatKey]: [...(prev[chatKey] || []), created] }));
  };

  const getOptions = (q) => {
    if (!q?.optionsByGender) return q?.options || [];
    const g = q.genderKey === "ai" ? (chatMode === "artanis" ? "Mann" : "Frau") : setupAnswers.userGender;
    return q.optionsByGender[g] || q.options || [];
  };

  const isAdmin = currentUser?.role === "admin";
  const proActive = hasProAccess(currentUser);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="w-full px-3 lg:px-5 py-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h1 className="font-display text-2xl text-foreground">Messages</h1>
        <p className="hidden lg:block text-[13px] font-semibold text-muted-foreground">
          Zieh den Balken neben der Liste — so breit, wie du es magst. Dateien kannst du einfach in den Chat ziehen.
        </p>
      </div>
      <div className="flex gap-2 h-[calc(100vh-136px)]">
        <div
          style={{ "--list-w": `${listWidth}px` }}
          className={cn("w-full lg:w-[var(--list-w)] lg:flex-shrink-0 rounded-3xl border-2 border-border bg-card overflow-hidden flex-col", activeChat ? "hidden lg:flex" : "flex")}
        >
          <div className="flex gap-1 p-2 border-b border-border">
            <button onClick={() => { setViewMode("ai"); setActiveChat(null); setDmParticipantName(""); }} className={cn("flex-1 py-1.5 rounded-full text-xs font-bold transition-colors", viewMode === "ai" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Chats</button>
            <button onClick={() => { setViewMode("dm"); setActiveChat(null); loadDmUsers(); }} className={cn("flex-1 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-1.5", viewMode === "dm" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Direct Messages{incomingConversations.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{incomingConversations.length}</span>}</button>
          </div>
          <div className="overflow-y-auto flex-1">
            {viewMode === "ai" ? (
              <>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Real</p>
              {creators.filter(c => c.creatorCategory === "REAL" && c.active !== false).map(c => (
                <button key={c.id} onClick={() => openAiChat(c)} className={cn("w-full p-4 flex items-center gap-3 border-b border-border text-left transition-colors", activeChat === c.id ? "bg-primary/10" : "hover:bg-elevated")}>
                  {c.avatar ? (
                    <Image src={c.avatar} fittingType="fit" className="w-14 h-14 rounded-full flex-shrink-0 bg-elevated" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary flex-shrink-0">{c.stageName[0]}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-foreground truncate">{c.stageName}</p>
                    <p className="text-xs text-muted-foreground">Real · AI persona</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-semibold uppercase flex-shrink-0">Real</span>
                </button>
              ))}
              <Link to="/dock" className="block m-3 p-3 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/15 transition-colors">
                <p className="text-sm font-semibold text-foreground">Eigenen Charakter mitbringen</p>
                <p className="text-[11px] text-muted-foreground">Leg ihn an der Dockingstation rein — er läuft dann mit unserer Persönlichkeit.</p>
              </Link>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">KI-Modelle</p>
              {creators.filter(c => c.creatorCategory === "AI_MODEL" && c.active !== false).map(c => (
                <button key={c.id} onClick={() => openAiChat(c)} className={cn("w-full p-4 flex items-center gap-3 border-b border-border text-left transition-colors", activeChat === c.id ? "bg-primary/10" : "hover:bg-elevated")}>
                  {c.avatar ? (
                    <Image src={c.avatar} fittingType="fit" className="w-14 h-14 rounded-full flex-shrink-0 bg-elevated" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary flex-shrink-0">{c.stageName[0]}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-foreground truncate">{c.stageName}</p>
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
                        <p className="text-sm font-bold text-foreground truncate">{name}</p>
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
                      <p className="text-sm font-bold text-foreground truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground">Direktnachricht</p>
                    </div>
                  </button>
                ))
              )}
              </>
            )}
          </div>
        </div>

        <div
          onMouseDown={startResize}
          title="Ziehen: Breite der Liste"
          className="hidden lg:block w-2 rounded-full bg-border hover:bg-primary/60 cursor-col-resize flex-shrink-0"
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
          onDrop={onDropFiles}
          className={cn("relative flex-1 min-w-0 rounded-3xl border-2 border-border bg-card flex flex-col", !activeChat && "hidden lg:flex")}
        >
          {dragging && (
            <div className="absolute inset-0 z-20 rounded-3xl bg-background/85 backdrop-blur flex items-center justify-center pointer-events-none border-2 border-dashed border-primary">
              <p className="font-display text-xl text-primary">Loslassen — ich häng es an</p>
            </div>
          )}
          {activeChat ? (
            <>
              <ChatTabs tabs={openChats} activeId={activeChat} onActivate={activateTab} onClose={closeTab} />
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="lg:hidden"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
                {viewMode === "dm" ? (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-display text-primary">{(dmParticipantName || "?")[0]}</div>
                ) : (
                  <Link to={`/creator/${activeChat}`} title="Profil ansehen" className="flex-shrink-0">
                    <NarratorAvatar3D
                      narrator={{ name: creators.find(c => c.id === activeChat)?.stageName || "Charakter", avatar: creators.find(c => c.id === activeChat)?.avatar }}
                      speaking={sending}
                      size={56}
                      showName={false}
                    />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    {viewMode === "dm" ? dmParticipantName : creators.find(c => c.id === activeChat)?.stageName}
                    <InfoDot topic="messages" size="sm" />
                  </p>
                  <p className="text-xs text-muted-foreground">{viewMode === "dm" ? "Direct message — real person" : (creators.find(c => c.id === activeChat)?.creatorCategory === "REAL" ? "Real · AI persona" : "KI-Modell · AI chat")}</p>
                </div>
                {viewMode === "ai" && <StatusBadge experienceType="AI_INTERACTIVE" className="flex-shrink-0" />}
                {viewMode === "dm" && isAdmin && dmPartnerId && dmPartnerId !== currentUser?.id && (
                  <button
                    onClick={giveFreeAccess}
                    title="Diese Person bekommt ab jetzt alles gratis"
                    className="px-2.5 py-1.5 rounded-full bg-elevated text-muted-foreground text-[11px] font-semibold whitespace-nowrap flex-shrink-0 hover:text-foreground transition-colors"
                  >
                    Gratis geben
                  </button>
                )}
                {viewMode === "ai" && scenario && (
                  <button onClick={() => setScenario(null)} title="Szenario wechseln" className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full bg-elevated whitespace-nowrap flex items-center gap-1">
                    {scenario.id === "free" ? "💬" : scenario.icon} {scenario.title} · wechseln
                  </button>
                )}
                {viewMode === "ai" && extraCharacters.length > 0 && (
                  <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold whitespace-nowrap flex-shrink-0">
                    +{extraCharacters.map((c) => c.stageName).join(", ")}
                  </span>
                )}
                {viewMode === "ai" && (
                  <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold whitespace-nowrap flex-shrink-0" title={isAdmin ? "Admin — alles gratis, kein Freischalten" : proActive ? "Pro — alles gratis" : "Kostenlose Creationen (Bilder/Videos)"}>
                    {isAdmin ? "Besitzer · God Mode" : proActive ? "Pro · alles gratis" : `${freeLeft} gratis`}
                  </span>
                )}
                {viewMode === "ai" && textModels.length > 0 && (
                  <select
                    value={activeModelId}
                    onChange={(e) => {
                      const picked = e.target.value;
                      setActiveModelId(picked);
                      setModelPicked(!!picked);
                      try {
                        if (picked) localStorage.setItem(TEXT_MODEL_KEY, picked);
                        else localStorage.removeItem(TEXT_MODEL_KEY);
                      } catch (err) { /* ignore */ }
                    }}
                    title="Womit die Figuren antworten — Standard ist die eingebaute KI"
                    className="hidden md:block max-w-[180px] px-3 py-1.5 rounded-full bg-elevated border border-border text-[11px] font-semibold text-muted-foreground focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Standard (eingebaute KI)</option>
                    {textModels.map((m) => (
                      <option key={m.id} value={m.modelId}>{m.name}</option>
                    ))}
                  </select>
                )}
                {viewMode === "ai" && (
                  <MoodQuickMenu
                    value={moods}
                    onChange={(next) => { setMoods(next); setMoodFor(activeChat, next); }}
                  />
                )}
                {viewMode === "ai" && (
                  <ChatCastMenu
                    creators={creators.filter((c) => c.active !== false)}
                    mainId={activeChat}
                    stateOf={castState}
                    onChange={setCastState}
                    count={extraCharacters.length}
                  />
                )}
                <QuickPayButton onSend={sendPaymentLink} disabled={sending} />
                {viewMode === "ai" && (
                  <Link to={`/ai-call/${activeChat}`} title="Videochat starten" className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-primary transition-colors">
                    <Video className="w-4 h-4" />
                  </Link>
                )}
                {viewMode === "ai" && (
                  <Link to={`/ai-call/${activeChat}?audio=1`} title="Sprachanruf starten — nur Ton, zurück in den Chat mit dem Hörer" className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-primary transition-colors">
                    <Phone className="w-4 h-4" />
                  </Link>
                )}
                {viewMode === "ai" && (
                  <button
                    onClick={bringIntoCall}
                    disabled={!callRunning}
                    title={callRunning ? "Diesen Chat in den laufenden Video-Call holen — alle sehen mit" : "Starte zuerst einen Video-Call — der Knopf oben rechts führt dich hin"}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                      callRunning ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground opacity-50"
                    )}
                  >
                    <Cast className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })} title="Zur letzten Nachricht springen" className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <StoryExportButton
                  messages={messages[activeChat] || []}
                  title={viewMode === "dm" ? dmParticipantName || "Chat" : activeCreator?.stageName || "Story"}
                  meName={publicName(currentUser) || "Ich"}
                  cast={viewMode === "ai" ? castForExport() : []}
                  moods={viewMode === "ai" ? moods : []}
                  playLevel={viewMode === "ai" ? playLevel : ""}
                  scenario={scenario}
                  setupAnswers={setupAnswers}
                />
                <ChatPromptButton
                  messages={messages[activeChat] || []}
                  title={viewMode === "dm" ? dmParticipantName || "Chat" : activeCreator?.stageName || "Szene"}
                />
                <button onClick={toggleMemory} title={memoryOn ? "Gedächtnis an — sie erinnert sich ans Gespräch" : "Gedächtnis aus — sie fängt neu an"} className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors", memoryOn ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}>
                  <Brain className="w-4 h-4" />
                </button>
                <button onClick={resetChat} title="Chat zurücksetzen" className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {viewMode === "ai" && (
                <SpeakerBar
                  role={role}
                  onRole={commitRole}
                  onEditRoles={() => setRoleDialog(true)}
                  creators={creators.filter((c) => c.active !== false)}
                  playLevel={playLevel}
                  onPlayLevel={(lvl) => { setPlayLevel(lvl); setPlayLevelFor(activeChat, lvl); }}
                  busy={sending}
                  onContinue={() => sendMessage("")}
                />
              )}

              <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                  <RolePicker
                    creators={creators.filter((c) => c.active !== false)}
                    mainId={activeChat}
                    extras={extraCharacters}
                    onToggleExtra={toggleExtra}
                    value={role}
                    onDone={commitRole}
                    doneLabel="Übernehmen"
                  />
                </DialogContent>
              </Dialog>

              {viewMode === "ai" && (
                <div className="px-4 py-2 border-b border-border flex flex-wrap items-center gap-2">
                  <VoiceChatBar
                    creator={creators.find((c) => c.id === activeChat)}
                    creators={creators}
                    voices={voices}
                    onChanged={load}
                  />
                  <CharacterDirector
                    chatId={activeChat}
                    people={[activeCreator, ...extraCharacters]}
                    voices={voices}
                    onVoiceSaved={load}
                  />
                  <VoiceEditorDialog title="Stimmen-Editor — Stimme zuordnen und fein einstellen" />
                </div>
              )}

              {viewMode === "ai" && !roleReady ? (
                <div className="flex-1 overflow-y-auto">
                  <RolePicker
                    creators={creators.filter((c) => c.active !== false)}
                    mainId={activeChat}
                    extras={extraCharacters}
                    onToggleExtra={toggleExtra}
                    value={role}
                    onDone={commitRole}
                  />
                </div>
              ) : viewMode === "ai" && !scenario ? (
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
                          <button onClick={advanceSetup} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold">Weiter</button>
                        </div>
                      </div>
                    );
                  })()}
                  {scenario.setupQuestions[setupStep].type !== "multiselect" && (
                  <div className="flex gap-2 w-full max-w-md">
                    <input type="text" value={setupInput} onChange={(e) => setSetupInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") advanceSetup(); }} placeholder="Eigene Antwort — tippen oder sprechen..." className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none" autoFocus />
                    <VoiceInput onResult={(t) => { setSetupAnswers(prev => ({ ...prev, [scenario.setupQuestions[setupStep].key]: t })); setSetupInput(""); setSetupStep(p => p + 1); }} />
                    <button onClick={advanceSetup} className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold">Weiter</button>
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
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
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
                            <Image src={creators.find(c => c.id === activeChat).avatar} fittingType="fit" className="w-16 h-16 rounded-full bg-elevated transition-opacity hover:opacity-80" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center"><span className="text-xs font-display text-violet-400">{creators.find(c => c.id === activeChat)?.stageName[0]}</span></div>
                          )}
                        </Link>
                      )
                    )}
                    <div className={cn("max-w-[86%] px-5 py-4 rounded-3xl text-[15px] font-bold leading-relaxed", (viewMode === "dm" ? msg.created_by_id === currentUser?.id : msg.senderType === "HUMAN") ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground")}>
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
                                    <div className="relative w-64 h-64 sm:w-[22rem] sm:h-[22rem] rounded-2xl overflow-hidden">
                                      {it.type === "image" ? (
                                        <Image src={it.url} fittingType="fill" className="w-full h-full blur-2xl scale-110" />
                                      ) : (
                                        <div className="w-full h-full bg-black" />
                                      )}
                                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 gap-1.5 px-2 text-center">
                                        <Lock className="w-5 h-5 text-primary" />
                                        {it.label && <span className="text-[11px] font-semibold uppercase tracking-wide text-primary leading-tight">{it.label}</span>}
                                        <span className="text-sm text-foreground font-semibold">{it.price} €</span>
                                        <button onClick={() => requestUnlock(it)} className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold hover:opacity-90">Freischalten</button>
                                        <button onClick={() => unlockWithCoins(msg, it)} className="px-3 py-1 rounded-full bg-elevated border border-primary/40 text-primary text-[11px] font-bold hover:border-primary">{coinsForPrice(it.price)} Coins</button>
                                      </div>
                                    </div>
                                  ) : it.type === "video" ? (
                                    <div>
                                      <video src={it.url} controls playsInline className="w-72 sm:w-[22rem] rounded-2xl" />
                                      <div className="mt-1.5">
                                        <DownloadButton url={it.url} filename="video.mp4" />
                                      </div>
                                    </div>
                                  ) : it.type === "audio" ? (
                                    <audio src={it.url} controls className="w-72 sm:w-[22rem]" />
                                  ) : it.type === "reshoot" ? (
                                    <div className="w-72 sm:w-[22rem] rounded-2xl border-2 border-primary/40 bg-background/60 p-4">
                                      <p className="text-xs font-semibold text-foreground mb-1">Das kann die KI so nicht zeigen</p>
                                      <p className="text-[11px] text-muted-foreground mb-2">Soll {creators.find((c) => c.id === activeChat)?.stageName} das für dich nachdrehen?</p>
                                      <Link
                                        to={`/request?type=CUSTOM_REQUEST&creator=${encodeURIComponent(creators.find((c) => c.id === activeChat)?.stageName || "")}&title=${encodeURIComponent("Nachdrehen: " + (it.note || ""))}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                                      >
                                        Nachdrehen lassen
                                      </Link>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <button className="block"><Image src={it.url} fittingType="fill" className="w-64 h-64 sm:w-[22rem] sm:h-[22rem] rounded-2xl transition-opacity hover:opacity-80" /></button>
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
                      <ChatText text={msg.text} />
                      {msg.contentLink && (
                        <Link
                          to={msg.contentLink}
                          className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
                        >
                          <Banknote className="w-3.5 h-3.5" /> Jetzt bezahlen
                        </Link>
                      )}
                      {viewMode === "ai" && msg.senderType === "AI" && msg.text && (
                        <div className="mt-1.5">
                          <SceneReadButton sceneKey={msg.createdAt || msg.id || i} onRead={() => readScene(msg.text, msg.sender || activeCreator?.stageName, msg.createdAt || msg.id || i)} />
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
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.suggestions.map((s, si) => (
                            <button key={si} onClick={() => sendMessage(s)} className="px-3 py-1.5 rounded-full bg-background border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">{s}</button>
                          ))}
                        </div>
                      )}
                      {viewMode === "ai" && msg.senderType === "AI" && isLastAi && !sending && (
                        <div className="mt-2">
                          <button
                            onClick={requestAnotherImage}
                            disabled={generating}
                            className="px-3 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-xs font-semibold text-primary hover:bg-primary/25 transition-colors disabled:opacity-50"
                          >
                            {generating ? "Wird erzeugt …" : "Noch ein Bild"}
                          </button>
                        </div>
                      )}
                      {msg.text && (
                        <ChatMessageBar text={msg.text} senderName={msg.sender || activeCreator?.stageName} />
                      )}
                    </div>
                  </div>
                  );
                })}
                {sending && (
                  <div className="flex gap-2 justify-start">
                    {creators.find(c => c.id === activeChat)?.avatar ? (
                      <Image src={creators.find(c => c.id === activeChat).avatar} fittingType="fit" className="w-16 h-16 rounded-full flex-shrink-0 bg-elevated" />
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
              {pendingFiles.length > 0 && (
                <div className="px-4 pt-3 flex items-center gap-3 flex-wrap">
                  {pendingFiles.map((f, i) => (
                    <div key={`${f.url}-${i}`} className="relative flex-shrink-0">
                      {f.type === "image" ? (
                        <Image src={f.url} fittingType="fill" className="w-24 h-24 rounded-2xl" />
                      ) : f.type === "audio" ? (
                        <audio src={f.url} controls className="w-64 h-10" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-elevated flex items-center justify-center text-[11px] font-bold text-muted-foreground uppercase">{f.type}</div>
                      )}
                      <button
                        onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs leading-none"
                      >×</button>
                    </div>
                  ))}
                  <span className="text-xs text-muted-foreground">
                    {pendingFiles.length === 1 ? "Angehängt" : `${pendingFiles.length} angehängt`} — schreib was dazu oder sende direkt.
                  </span>
                </div>
              )}
              <div className="p-4 border-t border-border flex gap-2">
                <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" multiple onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={sending || isRecording} className="w-10 h-10 rounded-full bg-elevated text-muted-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0 hover:text-foreground transition-colors"><ImagePlus className="w-4 h-4" /></button>
                {viewMode === "ai" && (
                  <button
                    onClick={requestAnotherImage}
                    disabled={generating || sending}
                    title="Sofort ein neues Bild im gleichen Stil"
                    className="inline-flex items-center gap-1.5 px-3 h-10 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs font-semibold whitespace-nowrap flex-shrink-0 hover:bg-primary/25 transition-colors disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    <span className="hidden sm:inline">Noch ein Bild</span>
                  </button>
                )}
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
                              <Image src={url} fittingType="fill" className="w-28 h-28 rounded-2xl" />
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
                <VoiceConvertToggle
                  on={voiceNoteMode}
                  onChange={toggleVoiceConvert}
                  disabled={!activeProfile}
                  characterName={activeCreator?.stageName}
                />
                <button
                  onClick={() => (voiceNoteMode ? convertRecorder.toggle("meine-stimme.webm") : toggleRecording())}
                  disabled={sending || transcribing}
                  title={voiceNoteMode ? `Aufnehmen — geht mit der Stimme von ${activeCreator?.stageName || "dem Charakter"} sofort raus` : "Sprachnachricht aufnehmen — beim Stoppen geht sie raus"}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 flex-shrink-0 transition-colors",
                    (voiceNoteMode ? convertRecorder.recording : isRecording)
                      ? "bg-red-500 text-white animate-pulse"
                      : voiceNoteMode
                        ? "bg-primary text-primary-foreground"
                        : "bg-elevated text-muted-foreground hover:text-foreground"
                  )}
                >
                  {voiceNoteMode
                    ? (convertRecorder.busy ? <Loader2 className="w-4 h-4 animate-spin" /> : convertRecorder.recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />)
                    : (isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />)}
                </button>
                <VoiceConvertButton
                  creators={creators}
                  creator={creators.find((c) => c.id === activeChat) || null}
                  onConverted={stageVoice}
                  disabled={sending}
                />
                <input type="text" value={isRecording ? "" : input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder={convertRecorder.busy ? "Wird umgewandelt …" : convertRecorder.recording ? "Aufnahme läuft — Mikrofon tippen zum Beenden" : transcribing ? "Transkribiere Audio..." : isRecording ? "Aufnahme läuft — Mikrofon tippen zum Stoppen" : speakAs === "LISTEN" ? "Regieanweisung geben — oder leer lassen und Weiter drücken" : speakAs !== "ME" ? `Du schreibst als ${creators.find(c => c.id === speakAs)?.stageName || "Figur"} …` : "Nachricht schreiben oder sprechen..."} disabled={isRecording || transcribing || convertRecorder.recording || convertRecorder.busy} className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-base text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none disabled:opacity-60" />
                {speakAs === "LISTEN" && !input.trim() && !pendingFiles.length ? (
                  <button onClick={() => sendMessage("")} disabled={sending} title="Die Figuren weiterspielen lassen" className="h-10 px-4 rounded-full bg-primary text-primary-foreground flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 flex-shrink-0"><Play className="w-4 h-4" />Weiter</button>
                ) : (
                  <button onClick={() => sendMessage()} disabled={(!input.trim() && !pendingFiles.length) || sending} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0"><Send className="w-4 h-4" /></button>
                )}
              </div>
              </>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Wähle links einen Chat aus</p></div>
          )}
        </div>
      </div>
    </div>
  );
}