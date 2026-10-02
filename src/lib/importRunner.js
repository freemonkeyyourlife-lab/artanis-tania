import { toast } from "@/components/ui/use-toast";

// Ein Import läuft hier weiter, auch wenn du die Seite verlässt: der Fortschritt
// hängt nicht an der Ansicht, sondern an diesem Modul.
let state = { running: false, title: "", done: 0, total: 0, failed: 0, current: "", note: "", last: null };
const listeners = new Set();
let stopRequested = false;

const emit = () => {
  const snapshot = { ...state };
  listeners.forEach((fn) => fn(snapshot));
};

export const getImportState = () => state;

export const subscribeImport = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const stopImport = () => {
  stopRequested = true;
};

// Der letzte Lauf verschwindet erst, wenn du ihn wegklickst.
export const clearImportSummary = () => {
  state = { ...state, last: null };
  emit();
};

// tasks: [{ label, run: async () => {...} }] — läuft eins nach dem anderen durch.
export async function runInBackground({ title, tasks }) {
  if (state.running) {
    toast({ title: "Es läuft schon ein Import", description: "Warte, bis er durch ist." });
    return null;
  }

  stopRequested = false;
  state = { running: true, title, done: 0, total: tasks.length, failed: 0, current: "", note: "", last: null };
  emit();

  let failed = 0;
  for (const task of tasks) {
    if (stopRequested) break;
    state = { ...state, current: task.label || "", note: task.note || "" };
    emit();
    try {
      await task.run();
    } catch (e) {
      failed += 1;
    }
    state = { ...state, done: state.done + 1, failed };
    emit();
  }

  const result = { done: state.done, failed, stopped: stopRequested, total: tasks.length };
  state = {
    running: false,
    title: "",
    done: 0,
    total: 0,
    failed: 0,
    current: "",
    note: "",
    last: { done: result.done, failed, stopped: result.stopped, total: result.total },
  };
  emit();
  return result;
}