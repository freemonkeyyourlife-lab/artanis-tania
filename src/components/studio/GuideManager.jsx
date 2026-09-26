import React from "react";
import { UserPlus, Image as ImageIcon, Sparkles, MessageSquare, Video, Power, Palette } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    title: "1 · Charakter anlegen",
    text: "Reiter „Charaktere“ → oben rechts „Neuer Charakter“. Name, Typ (Frau, Mann, Paar, Gruppe) und Kategorie (KI-Modell oder Real) eintragen, dann speichern. Sie erscheint sofort im Chat unter „Messages“.",
  },
  {
    icon: ImageIcon,
    title: "2 · Bilder festlegen — der wichtigste Schritt",
    text: "Avatar = ihr Gesicht, das überall im Chat als rundes Bild auftaucht. Banner = das große Bild oben im Profil. Referenzbilder = die Vorlagen, aus denen der Chat jedes neue Bild baut.",
  },
  {
    icon: Palette,
    title: "3 · Referenzbilder richtig wählen",
    text: "Lade 3–6 Bilder hoch, auf denen sie immer gleich aussieht: dasselbe Gesicht, dieselbe Haarfarbe und Länge, dieselbe Figur, dieselbe Kleidung. Am besten frontal, halb seitlich und einmal ganz. Je klarer diese Vorlagen, desto treuer bleibt sie in allen neuen Bildern.",
  },
  {
    icon: Sparkles,
    title: "4 · Eigene Bilder und Videos bauen",
    text: "Reiter „Generator“ → Person auswählen, Prompt darunter schreiben (Ort, Pose, Outfit, Licht) und auf „Bild“ oder „Video“ drücken. Das Ergebnis erscheint rechts.",
  },
  {
    icon: ImageIcon,
    title: "5 · Ergebnis übernehmen",
    text: "„Als Vorlage“ legt das Bild dauerhaft zu ihren Referenzbildern — ab dann sieht sie so aus. „Zu den Inhalten“ stellt es als Inhalt ins Profil, wo Kunden es sehen und kaufen können.",
  },
  {
    icon: MessageSquare,
    title: "6 · Im Chat",
    text: "Im Chat links die Person wählen. Der Button „Noch ein Bild“ neben dem Eingabefeld erzeugt sofort ein neues Bild in genau diesem Look — ohne dass sie erst antworten muss.",
  },
  {
    icon: Video,
    title: "7 · Videochat",
    text: "Im Chat oben auf das Video-Symbol oder im Profil auf „Videochat“ — sie geht ran und spricht. Das Bild wechselt dabei automatisch durch verschiedene Positionen.",
  },
  {
    icon: Power,
    title: "8 · An- und ausschalten",
    text: "Auf jeder Karte im Reiter „Charaktere“: „Deaktivieren“ nimmt sie aus dem Chat und aus allen Listen heraus, „Aktivieren“ holt sie zurück. „Animiert“ schaltet sie zwischen Foto-Look und gezeichnetem Look um.",
  },
];

export default function GuideManager() {
  return (
    <div className="max-w-[900px]">
      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <h2 className="font-display text-xl text-foreground mb-2">So baust du eine Figur</h2>
        <p className="text-sm text-muted-foreground">
          Alles läuft über diesen Studio-Bereich. Acht Schritte, in dieser Reihenfolge — die Bilder sind der Teil,
          der am meisten ausmacht.
        </p>
      </div>

      <div className="space-y-3">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">{s.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 mt-6">
        <p className="text-sm font-semibold text-foreground mb-1">Der eine Satz, auf den es ankommt</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Was nicht in ihren Referenzbildern steht, erfindet die KI bei jedem Bild neu. Deshalb: erst die Vorlagen
          sauber anlegen, dann Bilder bauen — dann bleibt sie in jedem Chat dieselbe.
        </p>
      </div>
    </div>
  );
}