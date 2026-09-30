import React from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowRight } from "lucide-react";
import ReadAloudButton from "@/components/ReadAloudButton";

// Eine Frage mit Antwort — plus Knöpfe, die direkt an die richtige Stelle springen.
export default function HelpAnswer({ item, autoPlay }) {
  return (
    <div className="space-y-2">
      <div className="ml-auto max-w-[85%] w-fit rounded-2xl bg-primary/15 px-4 py-2 text-sm text-foreground">{item.q}</div>
      <div className="rounded-2xl bg-elevated border border-border px-4 py-3">
        <div className="prose prose-sm prose-invert max-w-none text-[14px] font-semibold leading-relaxed [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1">
          <ReactMarkdown>{item.answer}</ReactMarkdown>
        </div>
        {item.links?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {item.links.map((l) => (
              <Link key={l.path} to={l.path} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {l.label} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        )}
        <ReadAloudButton text={item.answer} voice="honey" autoPlay={autoPlay} className="mt-3" />
      </div>
    </div>
  );
}