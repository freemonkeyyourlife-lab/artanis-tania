import React from "react";
import { cn } from "@/lib/utils";

const label = (msg) => {
  if (msg.senderType === "AI") return msg.senderName || "Triania";
  if (msg.senderType === "GUEST") return `Gast${msg.senderName ? ` · ${msg.senderName}` : ""}`;
  if (msg.senderType === "SYSTEM") return "Sitzung";
  return msg.senderName || "Du";
};

export default function TherapyThread({ messages }) {
  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        if (msg.senderType === "SYSTEM") {
          return (
            <p key={msg.id} className="text-center text-xs text-muted-foreground py-1">
              {msg.text}
            </p>
          );
        }
        const mine = msg.senderType === "USER";
        const guest = msg.senderType === "GUEST";
        return (
          <div key={msg.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[80%]", guest && "max-w-[70%]")}>
              <p
                className={cn(
                  "text-[11px] font-semibold tracking-wider uppercase mb-1",
                  mine ? "text-right text-muted-foreground" : "text-primary"
                )}
              >
                {label(msg)}
              </p>
              <div
                className={cn(
                  "px-4 py-3 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap",
                  mine
                    ? "bg-primary text-primary-foreground"
                    : guest
                    ? "bg-background border border-dashed border-border text-muted-foreground italic"
                    : "bg-elevated text-foreground"
                )}
              >
                {msg.text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}