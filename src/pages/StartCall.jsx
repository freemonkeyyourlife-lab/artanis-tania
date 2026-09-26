import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { getCallToken } from "@/lib/callLink";

export default function StartCall() {
  const token = useMemo(() => getCallToken(), []);
  return <Navigate to={`/call/${token}`} replace />;
}