import React, { useEffect, useState } from "react";

// Globale Hover-Info-Popups für das private Studio. Jedes Element mit einem
// title-Attribut bekommt beim Drüberfahren ein kleines stilisiertes Popup;
// der native Browser-Tooltip wird dabei unterdrückt. Einbindung in PrivateBuild,
// also aktiv auf allen Studio-Seiten ohne jede Seite einzeln anzufassen.

export default function StudioHints() {
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let cur = null;
    const restore = () => {
      if (cur && cur.dataset.titleBackup) {
        cur.setAttribute("title", cur.dataset.titleBackup);
        delete cur.dataset.titleBackup;
      }
      setShow(false);
      cur = null;
    };
    const onMove = (e) => {
      const el = e.target.closest?.("[title]");
      if (el === cur) return;
      restore();
      if (!el) return;
      const t = el.getAttribute("title");
      if (!t) return;
      el.dataset.titleBackup = t;
      el.setAttribute("title", "");
      cur = el;
      setText(t);
      const r = el.getBoundingClientRect();
      setPos({ x: Math.min(window.innerWidth - 160, Math.max(80, r.left + r.width / 2)), y: r.top });
      setShow(true);
    };
    const onOut = (e) => {
      if (!cur) return;
      if (cur.contains(e.relatedTarget)) return;
      restore();
    };
    document.addEventListener("mouseover", onMove, true);
    document.addEventListener("mouseout", onOut, true);
    return () => {
      document.removeEventListener("mouseover", onMove, true);
      document.removeEventListener("mouseout", onOut, true);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-full transition-opacity duration-100"
      style={{ left: pos.x, top: pos.y - 10, opacity: show ? 1 : 0 }}
      aria-hidden={!show}
    >
      <div className="max-w-xs rounded-xl border border-border bg-popover/95 px-3 py-2 text-[12px] leading-snug text-popover-foreground shadow-lg backdrop-blur">
        {text}
      </div>
    </div>
  );
}