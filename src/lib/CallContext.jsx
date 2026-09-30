import React, { createContext, useContext, useState } from "react";
import useCallRoom from "@/hooks/useCallRoom";

// Der Call lebt hier — eine Ebene über den Seiten. Genau deshalb bleibt er
// stehen, wenn du im Dashboard weiterklickst, und dein geteilter Bildschirm
// läuft weiter, während du zeigst, was du zeigen willst.
const CallContext = createContext(null);

export function CallProvider({ children }) {
  const [session, setSession] = useState(null); // { token, roomNumber, name }
  const [joined, setJoined] = useState(false);
  const [wantCam, setWantCam] = useState(true);
  const [wantMic, setWantMic] = useState(true);

  const room = useCallRoom({
    token: session?.token || "",
    joined: joined && !!session,
    wantCam,
    wantMic,
    name: session?.name || "",
  });

  const value = {
    session,
    joined,
    wantCam,
    wantMic,
    setWantCam,
    setWantMic,
    start: (next) => { setSession(next); setJoined(true); },
    leave: () => { setJoined(false); setSession(null); },
    ...room,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCallSession() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCallSession braucht den CallProvider darüber.");
  return ctx;
}