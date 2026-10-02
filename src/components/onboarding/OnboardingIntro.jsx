import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import IntroRunner from "@/components/intro/IntroRunner";
import {
  loadStructure,
  getStructure,
  subscribeStructure,
  saveIntroProfile,
  introSeen,
  markIntroSeen,
  setIntroOpen,
} from "@/lib/onboarding";

// Das Intro beim ersten Besuch: sie kommt näher, fragt nach dem Modus und
// führt ihn durch. Was er dabei erzählt, bleibt in seinem Profil stehen.
export default function OnboardingIntro() {
  const navigate = useNavigate();
  const [structure, setStructure] = useState(getStructure());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    loadStructure().then((s) => {
      setStructure(s);
      if (s.introEnabled && !introSeen()) setVisible(true);
    });
    return subscribeStructure(setStructure);
  }, []);

  // Damit du die Begrüßung aus der Konsole heraus jederzeit ansehen kannst.
  useEffect(() => {
    const open = () => setVisible(true);
    window.addEventListener("artanis:intro-preview", open);
    return () => window.removeEventListener("artanis:intro-preview", open);
  }, []);

  // Solange sie führt, bleibt die Begleiterin im Eck still.
  useEffect(() => {
    setIntroOpen(visible);
    return () => setIntroOpen(false);
  }, [visible]);

  const finish = async (profile = {}, goTo) => {
    markIntroSeen();
    setVisible(false);
    if (profile.gender || profile.orientation || profile.interests?.length || profile.wish || profile.path) {
      await saveIntroProfile(profile);
    }
    if (goTo) navigate(goTo);
  };

  if (!visible) return null;
  return <IntroRunner structure={structure} onFinish={finish} />;
}