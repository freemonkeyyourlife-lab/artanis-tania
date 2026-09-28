import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { normalizeCallCode } from "@/lib/callLink";

// Wer nur den kurzen Code bekommen hat, kommt hier in denselben Call.
export default function JoinByCode() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const join = (e) => {
    e.preventDefault();
    const value = normalizeCallCode(code);
    if (value.length !== 8) return;
    navigate(`/call/${value}`);
  };

  return (
    <form onSubmit={join} className="flex items-center gap-2 flex-1 sm:flex-none">
      <div className="relative flex-1 sm:flex-none">
        <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Call-Code"
          className="w-full sm:w-40 pl-9 pr-3 py-2.5 rounded-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground tracking-wider focus:outline-none focus:border-primary/50"
        />
      </div>
      <button
        type="submit"
        disabled={normalizeCallCode(code).length !== 8}
        className="px-4 py-2.5 rounded-full bg-elevated border border-border text-sm font-medium text-foreground whitespace-nowrap disabled:opacity-40"
      >
        Beitreten
      </button>
    </form>
  );
}