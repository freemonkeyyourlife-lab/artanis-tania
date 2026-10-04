import React from "react";
import { BookOpen } from "lucide-react";

// Die Begriffe in einfachen Worten. Damit du beim Prompt-Bauen weißt, was du
// gerade einstellst — und was es bewirkt.
const TERMS = [
  { term: "Prompt", text: "Deine Anweisung in Worten. Bei Nano Banana liest sie sich wie eine Arbeitsanweisung an einen Fotografen." },
  { term: "Text zu Bild", text: "Aus einer Beschreibung entsteht ein neues Bild. Nichts wird vorher gezeigt." },
  { term: "Bild zu Bild / Edit", text: "Du gibst ein oder mehrere Bilder mit und lässt nur etwas daran ändern. Alles andere bleibt stehen." },
  { term: "image_urls", text: "Die Liste deiner Vorlagenbilder. Sie müssen im Netz erreichbar sein — private Uploads nur über einen zeitlich begrenzten Link." },
  { term: "aspect_ratio", text: "Das Seitenverhältnis: 1:1 ist quadratisch, 3:4 hochkant für Personen, 16:9 breit für Kulissen. auto übernimmt das Format deines Vorlagenbilds." },
  { term: "num_images", text: "Wie viele Varianten in einem Auftrag entstehen. Ein bis vier." },
  { term: "seed", text: "Ein Zahlenstempel. Mit derselben Zahl bekommst du fast dasselbe Bild wieder — gut zum Nachjustieren." },
  { term: "safety_tolerance", text: "Wie streng der Filter prüft: 1 ist am strengsten, 6 am lockersten. Nur über die Schnittstelle einstellbar — und trotzdem blockt Google alles Sexuelle oder Nackte." },
  { term: "output_format", text: "Die Dateiart: png (beste Qualität), jpeg (kleiner), webp (fürs Netz)." },
  { term: "resolution", text: "Die Auflösung, 1K bis 4K — gibt es nur beim Pro-Modell und kostet mehr." },
  { term: "limit_generations", text: "Standardmäßig an: verhindert, dass das Modell aus einem Auftrag heimlich mehrere Bilder macht." },
  { term: "Negativ-Anweisung", text: "Kurze Verbote am Ende: keine verzerrten Hände, keine Doppel-Gesichter, kein Text im Bild." },
];

export default function BananaGlossary() {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-display text-foreground mb-3 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" /> Was heißt was?
      </h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {TERMS.map((t) => (
          <div key={t.term} className="rounded-2xl glass border-2 border-border p-4">
            <p className="text-[13px] font-mono font-bold text-primary break-all">{t.term}</p>
            <p className="text-[13px] font-semibold text-foreground/85 mt-1.5">{t.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}