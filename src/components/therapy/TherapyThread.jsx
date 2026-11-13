import React from "react";
import { cn } from "@/lib/utils";
import ChatText from "@/components/chat/ChatText";
import ChatMessageBar from "@/components/chat/ChatMessageBar";
import { Image } from "@/components/ui/image";

function MediaBlock({ msg }) {
  if (!(msg.images?.length || msg.videos?.length || msg.audio)) return null;
  return (
    <div className="flex flex-col gap-2 mb-2">
      {msg.images?.map((src, i) => (
        <Image key={`img-${i}`} src={src} className="w-full rounded-2xl" />
      ))}
      {msg.videos?.map((src, i) => (
        <video key={`vid-${i}`} src={src} controls playsInline className="w-full rounded-2xl" />
      ))}
      {msg.audio && (
        <audio src={msg.audio} controls className="w-full" />
      )}
    </div>
  );
}

const label = (msg) => {
  if (msg.senderType === "AI") return msg.senderName || "Tania";
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
                  mine
                    ? "text-right text-muted-foreground"
                    : msg.senderType === "AI"
                    ? "text-indigo-300"
                    : "text-emerald-300"
                )}
              >
                {label(msg)}
              </p>
              <MediaBlock msg={msg} />
              <div
                className={cn(
                  "px-4 py-3 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap",
                  mine
                    ? "bg-primary text-primary-foreground"
                    : msg.senderType === "AI"
                    ? "bg-indigo-500/20 text-foreground border border-indigo-400/40"
                    : "bg-emerald-500/15 text-foreground border border-emerald-400/40"
                )}
              >
                {msg.senderType === "AI" ? <ChatText text={msg.text} /> : msg.text}
              </div>
              <ChatMessageBar text={msg.text} senderName={label(msg)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}