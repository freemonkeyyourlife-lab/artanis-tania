// Gemeinsame Listen und Beschriftungen für den Content-Plan.

export const PLAN_TYPES = [
  { value: "CONTENT_IDEA", label: "Bilder / Beitrag" },
  { value: "VIDEO_PLAN", label: "Video" },
  { value: "STORY_PLAN", label: "Story" },
  { value: "LIVE_TOPIC", label: "Live-Thema" },
  { value: "INTERACTIVE_EXPERIENCE", label: "Interaktiv" },
];

export const PLAN_STATUSES = [
  { value: "IDEA", label: "Idee" },
  { value: "PLANNED", label: "Geplant" },
  { value: "RECORDED", label: "Aufgenommen" },
  { value: "EDITING", label: "In Bearbeitung" },
  { value: "READY", label: "Fertig" },
  { value: "PUBLISHED", label: "Veröffentlicht" },
];

export const REQUEST_TYPES = [
  { value: "VIDEO_IDEA", label: "Video-Idee" },
  { value: "PHOTO_IDEA", label: "Bilder-Idee" },
  { value: "STORY_IDEA", label: "Story-Idee" },
  { value: "LIVE_TOPIC", label: "Live-Thema" },
  { value: "INTERACTIVE_IDEA", label: "Interaktiv-Idee" },
  { value: "QUESTION", label: "Frage" },
  { value: "CUSTOM_REQUEST", label: "Sonderwunsch" },
  { value: "DISCUSSION_TOPIC", label: "Diskussions-Thema" },
  { value: "SEXUAL_DIRECTION", label: "Richtung" },
];

export const OPEN_REQUEST_STATUSES = ["NEW", "REVIEWED"];

export const planTypeLabel = (value) =>
  (PLAN_TYPES.find((t) => t.value === value) || PLAN_TYPES[0]).label;

export const planStatusLabel = (value) =>
  (PLAN_STATUSES.find((s) => s.value === value) || PLAN_STATUSES[0]).label;

export const requestTypeLabel = (value) =>
  (REQUEST_TYPES.find((t) => t.value === value) || {}).label || "Wunsch";

// Wunsch-Art → Plan-Art: ein Video-Wunsch wird zum Video-Plan usw.
const REQUEST_TO_PLAN = {
  VIDEO_IDEA: "VIDEO_PLAN",
  PHOTO_IDEA: "CONTENT_IDEA",
  STORY_IDEA: "STORY_PLAN",
  LIVE_TOPIC: "LIVE_TOPIC",
  INTERACTIVE_IDEA: "INTERACTIVE_EXPERIENCE",
};

export const planTypeForRequest = (value) => REQUEST_TO_PLAN[value] || "CONTENT_IDEA";

// Plan-Art → Content-Art: aus einem Plan-Eintrag wird ein echter Post.
const PLAN_TO_CONTENT = {
  CONTENT_IDEA: "PHOTO_SET",
  VIDEO_PLAN: "VIDEO",
  STORY_PLAN: "STORY",
  LIVE_TOPIC: "LIVE_SESSION",
  INTERACTIVE_EXPERIENCE: "INTERACTIVE_EXPERIENCE",
};

export const contentTypeForPlan = (value) => PLAN_TO_CONTENT[value] || "PHOTO_SET";