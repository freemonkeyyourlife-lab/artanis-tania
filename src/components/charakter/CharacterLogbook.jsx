import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Play, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABEL = {
  WARTESCHLANGE: "Warteschlange",
  IN_ARBEIT: "In Arbeit",
  FERTIG: "Fertig",
  VERWORFEN: "Verworfen",
};

// Die Logbuchaufträge einer Figur. Hier werden sie abgeholt — nicht nur
// angeschaut: ein Klick nimmt sie in Arbeit oder legt einen neuen an.
export default function CharacterLogbook({ character }) {
  const [tasks, setTasks] = useState([]);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");

  const load = () =>
    base44.entities.BuildTask.list("-created_date", 100)
      .then((l) => setTasks(l || []))
      .catch(() => setTasks([]));

  useEffect(() => { load(); }, []);

  const take = async (task) => {
    setBusy(task.id);
    try {
      await base44.entities.BuildTask.update(task.id, { status: "IN_ARBEIT" });
      setNote(`„${task.title}" ist in Arbeit.`);
      load();
    } catch (e) {
      setNote("Übernehmen hat nicht geklappt.");
    } finally {
      setBusy("");
    }
  };

  const add = async () => {
    if (!character) return;
    setBusy("new");
    try {
      await base44.entities.BuildTask.create({
        title: `Figur „${character.name}" weiterbauen`,
        description: character.understanding || character.behavior || "",
        prompt: [
          `Figur: ${character.name}, ${character.adultAge}`,
          character.art ? `Art: ${character.art}` : "",
          character.appearance ? `Aussehen: ${character.appearance}` : "",
          character.behavior ? `Benehmen: ${character.behavior}` : "",
          (character.neigungen || []).length ? `Neigung: ${character.neigungen.join(", ")}` : "",
        ].filter(Boolean).join("\n"),
        status: "WARTESCHLANGE",
        kind: "DESIGN",
        source: "GODMODE",
      });
      setNote("Neuer Auftrag liegt im Logbuch.");
      load();
    } catch (e) {
      setNote("Anlegen hat nicht geklappt.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="glass rounded-2xl border border-border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-display text-lg text-foreground">Logbuchaufträge</span>
        </div>
        <button
          onClick={add}
          disabled={busy === "new"}
          className="glass-btn inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] disabled:opacity-50"
        >
          {busy === "new" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Auftrag anlegen
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">Noch kein Auftrag im Logbuch.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground">{t.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {STATUS_LABEL[t.status] || t.status}
                  {t.kind ? ` · ${t.kind}` : ""}
                </p>
              </div>
              {t.status === "WARTESCHLANGE" && (
                <button
                  onClick={() => take(t)}
                  disabled={busy === t.id}
                  className={cn(
                    "glass-btn inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px]",
                    "text-primary disabled:opacity-50"
                  )}
                >
                  {busy === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Abholen
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {note && <p className="mt-3 text-[12px] font-bold text-primary">{note}</p>}
    </div>
  );
}