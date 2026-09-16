import React from "react";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { label: "📸 Foto bitte", text: "Schick mir ein Foto von dem, was du gerade beschreibst — genau aus meiner Sicht" },
  { label: "👀 Mehr sehen", text: "Zeig mir mehr von dir" },
  { label: "🔥 Heißer", text: "Mach es heißer für mich" },
  { label: "🍆 Wichsen", text: "Ich wichs gerade" },
  { label: "💥 Kommen", text: "Ich komme gleich" },
];

const POSITION_OPTIONS = {
  club: [
    { label: "🕺 Tanzend", action: "wir tanzen eng aneinander auf der Tanzfläche" },
    { label: "🍸 An der Bar", action: "wir stehen an der Bar, dicht beieinander" },
    { label: "💃 Aneinander", action: "ich drücke mich an dich, meine Hände an deiner Hüfte" },
    { label: "🌑 Dunkle Ecke", action: "wir verschwinden in die dunkle Ecke des Clubs" },
  ],
  cinema: [
    { label: "🪑 Nebeneinander", action: "wir sitzen nebeneinander im Kinosessel" },
    { label: "✋ Hand wandert", action: "meine Hand wandert an deinem Oberschenkel" },
    { label: "👄 Beugt sich zu dir", action: "ich beuge mich zu dir und flüstere in dein Ohr" },
    { label: "🦵 Beine übereinander", action: "ich lege mein Bein über deines" },
  ],
  taxi: [
    { label: "🚗 Hintere Sitzbank", action: "wir sitzen nebeneinander auf der Rückbank" },
    { label: "🦵 Auf dem Schoß", action: "ich setze mich auf deinen Schoß" },
    { label: "✋ Hand auf Oberschenkel", action: "meine Hand liegt auf deinem Oberschenkel" },
    { label: "🤫 Flüsternd nah", action: "ich beuge mich zu dir, meine Lippen an deinem Ohr" },
  ],
  pool: [
    { label: "🏊 Im Wasser", action: "wir stehen eng aneinander im Wasser" },
    { label: "🧖 An der Dusche", action: "wir stehen unter der Dusche, nasse Haut" },
    { label: "🩲 Liegend", action: "wir liegen nebeneinander am Pool" },
    { label: "🚪 Umkleide", action: "wir stehen zusammen in der Umkleidekabine" },
  ],
  office: [
    { label: "🪑 Am Schreibtisch", action: "ich setze mich auf deinen Schreibtisch, direkt vor dir" },
    { label: "🚶 Stehend", action: "wir stehen eng aneinander, gedrückt an die Wand" },
    { label: "☕ Pausenraum", action: "wir treffen uns im Pausenraum, niemand da" },
    { label: "🪜 Treppenhaus", action: "ich ziehe dich ins Treppenhaus" },
  ],
  elevator: [
    { label: "🧍 Gegenüber", action: "wir stehen uns gegenüber im Aufzug" },
    { label: "🧱 An die Wand", action: "ich drücke dich an die Wand des Aufzugs" },
    { label: "🤗 Eng aneinander", action: "ich ziehe dich eng an mich" },
  ],
  park: [
    { label: "🪑 Auf einer Bank", action: "wir sitzen zusammen auf einer Parkbank" },
    { label: "🌳 Im Gras", action: "wir liegen zusammen im Gras" },
    { label: "🌲 An einem Baum", action: "ich drücke dich an einen Baum" },
    { label: "🚶 Spazierend", action: "wir gehen eng zusammen spazieren" },
  ],
  changingroom: [
    { label: "🚪 Vor dem Vorhang", action: "wir stehen zusammen in der Umkleide, der Vorhang zu" },
    { label: "🪑 Auf der Bank", action: "ich setze mich auf die Bank in der Umkleide" },
    { label: "👗 Vor dem Spiegel", action: "wir stehen vor dem Spiegel, ich halte dich von hinten" },
  ],
  default: [
    { label: "🧍 Stehend", action: "wir stehen voreinander" },
    { label: "🪑 Sitzend", action: "wir sitzen nebeneinander" },
    { label: "🕺 Tanzend", action: "wir tanzen eng zusammen" },
    { label: "🛏️ Liegend", action: "wir liegen nebeneinander" },
    { label: "🤗 Aneinander", action: "ich drücke mich an dich" },
    { label: "🚶 Gegenüber", action: "wir stehen uns gegenüber" },
  ],
};

const ACTIVITY_BUTTONS = [
  { label: "💋 Küssen", action: "ich küsse dich" },
  { label: "✋ Berühren", action: "ich streiche über deinen Körper" },
  { label: "👕 Ausziehen", action: "ich ziehe mich vor dir aus" },
  { label: "🔥 Näher", action: "ich rutsche näher zu dir" },
  { label: "📸 Foto", action: "Schick mir ein Foto von dem, was du gerade machst" },
];

export default function QuickActions({ onAction, disabled, scenario }) {
  const positions = (scenario && POSITION_OPTIONS[scenario.id]) || POSITION_OPTIONS.default;

  return (
    <div className="px-4 pb-2 space-y-1.5">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {positions.map((p) => (
          <button
            key={p.label}
            onClick={() => onAction(`<${p.action}>`)}
            disabled={disabled}
            className="px-3 py-1.5 rounded-full bg-elevated border border-border text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-40"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {ACTIVITY_BUTTONS.map((a) => (
          <button
            key={a.label}
            onClick={() => onAction(`<${a.action}>`)}
            disabled={disabled}
            className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary whitespace-nowrap flex-shrink-0 hover:bg-primary/20 transition-colors disabled:opacity-40"
          >
            {a.label}
          </button>
        ))}
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => onAction(a.text)}
            disabled={disabled}
            className="px-3 py-1.5 rounded-full bg-elevated border border-border text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-40"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}