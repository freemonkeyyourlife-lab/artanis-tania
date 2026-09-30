import React, { useMemo } from "react";
import { getCallToken, callInviteUrl } from "@/lib/callLink";
import CallInvite from "@/components/call/CallInvite";

// Einladen mit einem Klick: derselbe Raum, derselbe Link — Link, Code, QR-Code
// und fertiger Text stecken im Fenster dahinter.
export default function CallInviteButton({ label = "Jemanden einladen", className }) {
  const code = useMemo(() => getCallToken(), []);
  const url = useMemo(() => callInviteUrl(code), [code]);
  return <CallInvite url={url} code={code} label={label} className={className} />;
}