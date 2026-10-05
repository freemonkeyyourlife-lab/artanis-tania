import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import LogbuchComposer from "@/components/logbuch/LogbuchComposer";
import LogbuchBoard from "@/components/logbuch/LogbuchBoard";
import { logLine } from "@/lib/logbuch";

// Das Logbuch: der Schaltraum für Bauaufträge. Auftrag sprechen, Prompt
// freigeben, und den Weg von der Warteschlange bis fertig mitverfolgen.
export default function Logbuch() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const addTask = (created) => setTasks((cur) => [created, ...cur]);

  const setStatus = async (task, status) => {
    const progress = [...(task.progress || []), logLine(`Status: ${status}`)];
    setTasks((cur) => cur.map((t) => (t.id === task.id ? { ...t, status, progress } : t)));
    await base44.entities.BuildTask.update(task.id, { status, progress });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-4xl">Logbuch</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Aufträge sprechen oder tippen, Prompt erzeugen, freigeben. Danach läuft der Auftrag
        durch die Listen — und jede Bewegung wird mitgeschrieben.
      </p>

      <div className="mt-8">
        <LogbuchComposer onCreated={addTask} />
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Lade das Logbuch…</p>
        ) : (
          <LogbuchBoard tasks={tasks} onStatus={setStatus} />
        )}
      </div>
    </div>
  );
}