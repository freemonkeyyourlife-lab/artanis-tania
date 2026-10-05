import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import LogbuchComposer from "@/components/logbuch/LogbuchComposer";
import LogbuchBoard from "@/components/logbuch/LogbuchBoard";
import RoadmapBoard from "@/components/logbuch/RoadmapBoard";
import { logLine, STATUS } from "@/lib/logbuch";
import { sortByOrder, withOrder } from "@/lib/roadmap";
import { runTask } from "@/lib/logbuchRunner";

// Das Logbuch: der Schaltraum für Bauaufträge. Auftrag sprechen, Prompt
// freigeben — und der Bau-Lauf setzt sofort um, was sich umsetzen lässt.
export default function Logbuch() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState(null);
  const [note, setNote] = useState("");

  const load = async () => {
    try {
      const page = await base44.entities.BuildTask.filter({}, { sort: "-created_date", limit: 200 });
      setTasks(page.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Der Lauf: ausführen, was geht — und das Ergebnis in den Auftrag schreiben.
  const run = async (task) => {
    setRunningId(task.id);
    setNote("");
    try {
      const res = await runTask(task);
      if (res?.error) throw new Error(res.error);
      setTasks((cur) =>
        cur.map((t) => (t.id === task.id ? { ...t, status: res.status, progress: res.progress } : t))
      );
      setNote(res.openCode ? `Teilweise gebaut: ${res.summary}` : `Fertig gebaut: ${res.summary}`);
    } catch (e) {
      const progress = [...(task.progress || []), logLine(`Bau-Lauf nicht möglich: ${e.message}`)];
      setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, progress } : t)));
      setNote(`Der Lauf kam nicht durch: ${e.message}`);
    } finally {
      setRunningId(null);
    }
  };

  // Ein freigegebener Auftrag startet sofort — kein zweiter Klick nötig.
  const addTask = (created) => {
    setTasks((cur) => [created, ...cur]);
    if (created.status === STATUS.IN_ARBEIT) run(created);
  };

  const queue = useMemo(
    () => sortByOrder(tasks.filter((t) => t.status === STATUS.WARTESCHLANGE)),
    [tasks]
  );

  const saveQueue = async (next) => {
    const updates = next.map((t, i) => ({ id: t.id, order: i + 1 }));
    setTasks((cur) =>
      cur.map((t) => {
        const u = updates.find((x) => x.id === t.id);
        return u ? { ...t, order: u.order } : t;
      })
    );
    await base44.entities.BuildTask.bulkUpdate(updates);
  };

  const autoSort = () => saveQueue(withOrder(queue));

  const setStatus = async (task, status) => {
    const progress = [...(task.progress || []), logLine(`Status: ${status}`)];
    setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, status, progress } : t)));
    await base44.entities.BuildTask.update(task.id, { status, progress });
    // Freigegeben heißt: der Bau-Lauf beginnt sofort.
    if (status === STATUS.IN_ARBEIT) await run({ ...task, status, progress });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-4xl">Logbuch</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Aufträge sprechen oder tippen, Prompt erzeugen, freigeben. Danach läuft der Auftrag sofort:
        was sich ausführen lässt, wird ausgeführt — der Rest wird als klarer Auftrag für den
        Baumeister mitgeschrieben.
      </p>

      {(runningId || note) && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
          {runningId && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <span className="text-muted-foreground">
            {runningId ? "Der Bau-Lauf arbeitet am Auftrag …" : note}
          </span>
        </div>
      )}

      <div className="mt-8">
        <LogbuchComposer onCreated={addTask} />
      </div>

      <div className="mt-8">
        <RoadmapBoard
          items={queue}
          onSave={saveQueue}
          onAutoSort={autoSort}
          onStatus={(task) => setStatus(task, STATUS.IN_ARBEIT)}
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Lade das Logbuch…</p>
        ) : (
          <LogbuchBoard tasks={tasks} onStatus={setStatus} onRun={run} runningId={runningId} />
        )}
      </div>
    </div>
  );
}