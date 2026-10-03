import { useEffect, useState } from "react";

// Wo die Maus gerade steht — eine einzige Quelle für alle, die davon wissen
// müssen: der Stift in God Mode und die Konsole daneben. So schreiben beide
// dieselbe Stelle mit, und du musst nichts zweimal erklären.

let current = null;
let listeners = [];

const PICKABLE =
  "button, a, input, textarea, select, label, [role='button'], img, h1, h2, h3, h4, li, p";

export const getFocus = () => current;

const publish = (next) => {
  current = next;
  listeners.forEach((fn) => fn(next));
};

export const subscribeFocus = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((x) => x !== fn);
  };
};

export const useFocus = () => {
  const [value, setValue] = useState(current);
  useEffect(() => subscribeFocus(setValue), []);
  return value;
};

export function elementLabel(el) {
  const text = (el.innerText || el.value || "").replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 70);
  const hint =
    el.getAttribute?.("placeholder") ||
    el.getAttribute?.("aria-label") ||
    el.getAttribute?.("alt") ||
    el.getAttribute?.("title");
  return (hint || el.tagName.toLowerCase()).slice(0, 70);
}

// Verfolgt, worüber die Maus steht. Läuft nur, wenn jemand zuschaut.
export function useFocusTracker(active) {
  useEffect(() => {
    if (!active) {
      publish(null);
      return;
    }
    const onMove = (event) => {
      const under = document.elementFromPoint(event.clientX, event.clientY);
      if (!under || under.closest("[data-god-layer]")) return;
      const el = under.closest(PICKABLE);
      if (!el || el === document.body || el === document.documentElement) {
        publish(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 14 || rect.height < 14) {
        publish(null);
        return;
      }
      publish({ label: elementLabel(el), tag: el.tagName.toLowerCase(), rect });
    };
    const clear = () => publish(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", clear, true);
    window.addEventListener("resize", clear);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("resize", clear);
    };
  }, [active]);
}