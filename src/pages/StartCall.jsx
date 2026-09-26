import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";

export default function StartCall() {
  const token = useMemo(() => crypto.randomUUID(), []);
  return <Navigate to={`/call/${token}`} replace />;
}