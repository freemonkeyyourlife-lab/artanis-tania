import React, { useMemo } from "react";
import { getCallToken, callInviteUrl } from "@/lib/callLink";
import CallInvite from "@/components/call/CallInvite";

// Einladen mit einem Klick: derselbe Raum, derselbe Link — Link, Code, QR-Code
// und fertiger Text stecken im Fenster dahinter.
export default function CallInviteButton({ label = "Jemanden einladen", className }) {
  const code = useMemo(() => getCallToken(), []);
  // Chatraum 1 ist der feste Raum — derselbe Code wie im Video-Call.
  const url = useMemo(() => callInviteUrl(code, 1), [code]);
  return <CallInvite url={url} code={code} label={label} className={className} />;
}