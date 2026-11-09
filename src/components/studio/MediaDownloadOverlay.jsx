import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

// Schwebender Download-Knopf auf jedem Bild und Video im privaten Studio:
// beim Drüberfahren erscheint oben rechts ein kleines Symbol, das die Datei
// direkt auf die Festplatte speichert. Aktiv auf allen Studio-Seiten, ohne
// jede Seite einzeln anfassen zu müssen.

export default function MediaDownloadOverlay() {
  const [rect, setRect] = useState(null);
  const [src, setSrc] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cur = null;
    const place = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 90) { setVisible(false); return; }
      cur = el;
      setRect({ left: r.left, top: r.top, width: r.width });
      setSrc(el.currentSrc || el.src || "");
      setVisible(true);
    };
    const hide = () => { setVisible(false); cur = null; };
    const onMove = (e) => {
      const el = e.target.closest?.("img, video");
      if (el === cur) return;
      if (!el) { hide(); return; }
      if (!el.currentSrc && !el.src) { hide(); return; }
      place(el);
    };
    const onOut = (e) => {
      if (!cur) return;
      if (e.relatedTarget?.closest?.("[data-media-dl]")) return;
      if (cur.contains(e.relatedTarget)) return;
      hide();
    };
    const onScroll = () => { if (cur) place(cur); };
    document.addEventListener("mouseover", onMove, true);
    document.addEventListener("mouseout", onOut, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mouseover", onMove, true);
      document.removeEventListener("mouseout", onOut, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const download = () => {
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = (src.split("/").pop() || "medien").split(/[?#]/)[0] || "medien";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!rect) return null;
  const left = rect.left + rect.width - 36;
  const top = rect.top + 8;

  return (
    <button
      data-media-dl
      onClick={download}
      title="Bild oder Video auf die Festplatte speichern"
      className="fixed z-[150] rounded-full bg-black/65 p-1.5 text-white shadow-lg backdrop-blur transition-opacity hover:bg-primary"
      style={{ left, top, opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      <Download className="h-4 w-4" />
    </button>
  );
}