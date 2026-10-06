import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Mic, BookOpen, Image as ImageIcon, Film, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import VoiceInput from "@/components/VoiceInput";
import { PALETTE } from "@/lib/palette";
import { characterBriefing } from "@/lib/charakter";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Co-Creation: der Nutzer spricht seinen Wunsch, daraus entsteht mit seiner
// Figur eine Geschichte, ein Bild und ein Video. Sprechen ist der erste Weg,
// tippen geht immer daneben.
export default function Mitmachen() {
  const [figures, setFigures] = useState([]);
  const [paletteList, setPaletteList] = useState(PALETTE);
  const [modules, setModules] = useState([]);
  const [figureId, setFigureId] = useState("");
  const [wish, setWish] = useState("");
  const [story, setStory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    base44.entities.Character.list("name", 200).then((list) => {
      setFigures(list || []);
      if (list?.length) setFigureId(list[0].id);
    }).catch(() => setFigures([]));
    base44.entities.Neigung.filter({ active: true }, { sort: "level", limit: 50 })
      .then((page) => page.items?.length && setPaletteList(page.items))
      .catch(() => {});
    base44.entities.CharacterModule.filter({ active: true }, { sort: "order", limit: 200 })
      .then((page) => setModules(page.items || []))
      .catch(() => setModules([]));
  }, []);

  const figure = useMemo(() => figures.find((f) => f.id === figureId) || null, [figures, figureId]);

  const briefing = useMemo(
    () => characterBriefing(figure, { paletteList, modules }),
    [figure, paletteList, modules]
  );

  const writeStory = async () => {
    if (!figure) return;
    setBusy("story");
    setNotice("");
    try {
      const text = await base44.integrations.Core.InvokeLLM({
        prompt:
          `${briefing}\n\n` +
          `Wunsch des Nutzers (er ist selbst mit dabei, als erwachsener Gesprächspartner):\n` +
          `${wish || "Er überlässt dir den Anfang."}\n\n` +
          "Schreibe daraus eine zusammenhängende Geschichte in der Ich-Form aus Sicht der Figur, " +
          "in der beide zusammen etwas erleben. 4 bis 6 Absätze, auf Deutsch, ohne Überschriften. " +
          "Bleib bei der Figur und ihrer Neigung. Alle Beteiligten sind fiktive Erwachsene.",
      });
      setStory(typeof text === "string" ? text : String(text || ""));
    } catch (e) {
      setNotice("Die Geschichte kam nicht zurück — bitte nochmal.");
    } finally {
      setBusy("");
    }
  };

  const makeImage = async () => {
    if (!figure) return;
    setBusy("image");
    setNotice("");
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt:
          `Porträtaufnahme der Figur ${figure.name}. ${figure.appearance || ""} ` +
          `${figure.art ? `Wesen: ${figure.art}. ` : ""}` +
          `${story ? `Szene: ${story.slice(0, 400)}. ` : ""}` +
          "Fotorealistisch, weiches warmes Licht, dunkler Hintergrund, ruhige Bildsprache. " +
          "Erwachsene Person, keine realen Personen.",
      });
      if (res?.url) setImageUrl(res.url);
      else setNotice("Das Bild kam nicht zurück — bitte nochmal.");
    } catch (e) {
      setNotice("Das Bild kam nicht zurück — bitte nochmal.");
    } finally {
      setBusy("");
    }
  };

  const makeVideo = async () => {
    if (!figure) return;
    setBusy("video");
    setNotice("");
    try {
      const res = await base44.integrations.Core.GenerateVideo({
        prompt:
          `Kurze Szene mit ${figure.name}. ${figure.appearance || ""} ` +
          `${story ? `Handlung: ${story.slice(0, 300)}. ` : ""}` +
          "Ruhige Kamerafahrt, warmes Licht, dunkler Raum, filmisch. Erwachsene Person.",
        duration: 6,
        aspect_ratio: "9:16",
      });
      if (res?.url) setVideoUrl(res.url);
      else setNotice("Das Video kam nicht zurück — bitte nochmal.");
    } catch (e) {
      setNotice("Das Video kam nicht zurück — bitte nochmal.");
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    if (!figure || !story.trim()) {
      setNotice("Ohne Geschichte gibt es nichts zu speichern.");
      return;
    }
    setBusy("save");
    try {
      const media = [
        imageUrl ? { url: imageUrl, type: "IMAGE" } : null,
        videoUrl ? { url: videoUrl, type: "VIDEO" } : null,
      ].filter(Boolean);
      await base44.entities.Story.create({
        creatorId: figure.id,
        creatorName: figure.name,
        characters: [figure.name],
        title: story.trim().split("\n")[0].slice(0, 80) || `Mit ${figure.name}`,
        content: story,
        preview: imageUrl || figure.avatar || "",
        media,
        madeWithUser: true,
        visibility: "PRIVATE",
        published: false,
      });
      setNotice("Liegt bei dir — die Geschichte ist gespeichert.");
    } catch (e) {
      setNotice("Speichern hat nicht geklappt.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/charakter" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Zur Charakter-Werkstatt
      </Link>

      <h1 className="mt-4 font-display text-4xl text-foreground text-gloss">Mitmachen</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Du sprichst, was du erleben willst — daraus wird mit deiner Figur eine Geschichte, ein Bild
        und ein Video. Sprechen ist der erste Weg, tippen geht immer daneben.
      </p>

      {figures.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Noch keine Figur — leg zuerst in der Charakter-Werkstatt eine an.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          <section className="glass rounded-2xl border border-border p-4">
            <label className="mb-1.5 block text-xs text-muted-foreground">Mit wem</label>
            <select value={figureId} onChange={(e) => setFigureId(e.target.value)} className={inputCls}>
              {figures.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            {briefing && (
              <p className="mt-2 whitespace-pre-line text-[11px] text-muted-foreground">
                {briefing.slice(0, 320)}
              </p>
            )}
          </section>

          <section className="glass rounded-2xl border border-border p-4">
            <div className="mb-2 flex items-center gap-2 font-heading text-foreground">
              <Mic className="h-4 w-4 text-primary" /> 1. Dein Wunsch
            </div>
            <div className="flex items-start gap-3">
              <VoiceInput onResult={(t) => setWish((w) => (w ? `${w} ${t}` : t))} />
              <textarea
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                rows={3}
                placeholder="Sprich einfach: „Wir sind in einem leeren Zugabteil, es ist Nacht …"
                className={cn(inputCls, "resize-none")}
              />
            </div>
            <button
              onClick={writeStory}
              disabled={!!busy}
              className="glass-btn glass-btn-accent mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {busy === "story" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
              {busy === "story" ? "Schreibt …" : "Geschichte schreiben"}
            </button>
          </section>

          {story && (
            <section className="glass rounded-2xl border border-border p-4">
              <div className="mb-2 flex items-center gap-2 font-heading text-foreground">
                <BookOpen className="h-4 w-4 text-primary" /> 2. Die Geschichte
              </div>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={12}
                className={cn(inputCls, "resize-none leading-relaxed")}
              />
              <div className="mt-2 flex items-center gap-2">
                <VoiceInput onResult={(t) => setStory((s) => `${s} ${t}`)} />
                <span className="text-xs text-muted-foreground">Weitersprechen statt tippen</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={makeImage}
                  disabled={!!busy}
                  className="glass-btn inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {busy === "image" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  {busy === "image" ? "Malt …" : "Bild dazu"}
                </button>
                <button
                  onClick={makeVideo}
                  disabled={!!busy}
                  className="glass-btn inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {busy === "video" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                  {busy === "video" ? "Dreht … (etwa eine Minute)" : "Video dazu"}
                </button>
                <button
                  onClick={save}
                  disabled={!!busy}
                  className="glass-btn glass-btn-accent inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Aufbewahren
                </button>
              </div>
            </section>
          )}

          {(imageUrl || videoUrl) && (
            <section className="glass rounded-2xl border border-border p-4">
              <div className="mb-3 font-heading text-foreground">3. Was dabei entstanden ist</div>
              <div className="grid gap-4 sm:grid-cols-2">
                {imageUrl && <Image src={imageUrl} fittingType="fill" className="h-72 w-full rounded-2xl" />}
                {videoUrl && <video src={videoUrl} controls className="h-72 w-full rounded-2xl bg-black object-cover" />}
              </div>
            </section>
          )}

          {notice && <p className="text-sm font-bold text-primary">{notice}</p>}
        </div>
      )}
    </div>
  );
}