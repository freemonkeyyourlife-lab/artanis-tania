import React from "react";
import { cn } from "@/lib/utils";
import ChatText from "@/components/chat/ChatText";
import ArchiveMedia from "@/components/archive/ArchiveMedia";

// Alles, was in einem Chat je gesagt und gezeigt wurde — Bild, Video, Stimme.
const itemsOf = (msg) =>
  msg.attachments?.length ? msg.attachments : msg.attachment ? [{ type: "image", url: msg.attachment }] : [];

const stamp = (iso) =>
  iso ? new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

export default function ChatTranscript({ messages, userName }) {
  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const mine = msg.senderType === "HUMAN";
        const items = itemsOf(msg);
        return (
          <div key={msg.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div className="max-w-[85%]">
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wider mb-1",
                  mine ? "text-right text-muted-foreground" : "text-primary"
                )}
              >
                {mine ? msg.sender || userName || "Gast" : msg.sender || "KI"} · {stamp(msg.created_date)}
              </p>
              {items.length > 0 && (
                <div className={cn("flex flex-wrap gap-2 mb-1.5", mine && "justify-end")}>
                  {items.map((it, i) => (
                    <ArchiveMedia key={i} item={it} />
                  ))}
                </div>
              )}
              {msg.text && (
                <div
                  className={cn(
                    "px-4 py-3 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap",
                    mine ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground"
                  )}
                >
                  {mine ? msg.text : <ChatText text={msg.text} />}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}