import { base44 } from "@/api/base44Client";

// Einen Auftrag wirklich bauen lassen: der Lauf führt aus, was ausführbar ist,
// und schreibt jeden Schritt in den Auftrag.
export async function runTask(task) {
  const res = await base44.functions.invoke("buildRunner", { taskId: task.id });
  return res.data;
}