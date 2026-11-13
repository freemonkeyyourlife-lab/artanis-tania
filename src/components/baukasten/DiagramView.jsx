import React, { useState, useRef, useMemo } from "react";
import { Link2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

// Interaktive Diagramm-Ansicht für einen Baukasten: die Bausteine als Knoten,
// ihre Verzweigungen als Linien. Knoten lassen sich frei ziehen (Position wird
// gespeichert). Verbindungen legt man per Drag-and-Drop: am rechten Punkt eines
// Bausteins ziehen und auf einen anderen fallen lassen. Eine Linie anklicken,
// um sie zu löschen.

const NODE_W = 224;
const NODE_H = 100;
const CANVAS_W = 1800;
const CANVAS_H = 1000;

const kindColor = {
  SITUATION: "bg-primary/15 border-primary/40",
  DATEI: "bg-chart-3/15 border-chart-3/40",
  SZENE: "bg-chart-2/15 border-chart-2/40",
};

export default function DiagramView({ kit, blocks, onChange }) {
  const nodes = useMemo(
    () => blocks.filter((b) => (kit?.blockIds || []).includes(b.id)),
    [kit, blocks]
  );

  const initial = () => {
    const p = {};
    nodes.forEach((n, i) => {
      p[n.id] = {
        x: n.graphX ?? (i % 4) * (NODE_W + 40) + 40,
        y: n.graphY ?? Math.floor(i / 4) * (NODE_H + 60) + 40,
      };
    });
    return p;
  };
  const [positions, setPositions] = useState(initial);
  const posRef = useRef(positions);
  posRef.current = positions;
  const [dragFrom, setDragFrom] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);

  const edges = useMemo(() => {
    const out = [];
    nodes.forEach((n) => {
      (n.links || []).forEach((l) => {
        if (nodes.some((m) => m.id === l.to)) {
          out.push({ from: n.id, to: l.to, label: l.label || "" });
        }
      });
    });
    return out;
  }, [nodes]);

  const center = (id) => {
    const p = positions[id] || { x: 0, y: 0 };
    return { x: p.x + NODE_W / 2, y: p.y + NODE_H / 2 };
  };
  const portPoint = (id) => {
    const p = positions[id] || { x: 0, y: 0 };
    return { x: p.x + NODE_W, y: p.y + NODE_H / 2 };
  };

  const relPos = (clientX, clientY) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const hitTest = (pos) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const p = positions[n.id] || { x: 0, y: 0 };
      if (pos.x >= p.x && pos.x <= p.x + NODE_W && pos.y >= p.y && pos.y <= p.y + NODE_H) {
        return n.id;
      }
    }
    return null;
  };

  // Baustein verschieben.
  const startDrag = (e, id) => {
    if (dragFrom) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = posRef.current[id] || { x: 0, y: 0 };
    const move = (ev) => {
      const nx = Math.max(0, Math.min(CANVAS_W - NODE_W, orig.x + (ev.clientX - startX)));
      const ny = Math.max(0, Math.min(CANVAS_H - NODE_H, orig.y + (ev.clientY - startY)));
      setPositions((p) => ({ ...p, [id]: { x: nx, y: ny } }));
    };
    const up = async () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const pos = posRef.current[id];
      if (pos) {
        try {
          await base44.entities.BuildBlock.update(id, {
            graphX: Math.round(pos.x),
            graphY: Math.round(pos.y),
          });
        } catch {}
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Verbindung per Drag-and-Drop: am Punkt ziehen, auf einen anderen fallen lassen.
  const startConnect = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    setDragFrom(id);
    setDragPos(relPos(e.clientX, e.clientY));
    const move = (ev) => {
      const pos = relPos(ev.clientX, ev.clientY);
      setDragPos(pos);
      setHoverTarget(hitTest(pos));
    };
    const up = async (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const pos = relPos(ev.clientX, ev.clientY);
      const target = hitTest(pos);
      setDragFrom(null);
      setDragPos(null);
      setHoverTarget(null);
      if (target && target !== id) {
        await addLink(id, target);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const addLink = async (from, to) => {
    const b = nodes.find((n) => n.id === from);
    const links = [...(b?.links || [])];
    if (links.some((l) => l.to === to)) return;
    let label = "";
    try {
      label = window.prompt('Beschriftung der Verbindung (z. B. „Ja", „Nein") — oder leer lassen:', "") || "";
    } catch {}
    links.push({ to, label });
    setBusy(true);
    try {
      await base44.entities.BuildBlock.update(from, { links });
      onChange?.();
    } catch {} finally {
      setBusy(false);
    }
  };

  const removeLink = async (from, to) => {
    const b = nodes.find((n) => n.id === from);
    const links = (b?.links || []).filter((l) => l.to !== to);
    setBusy(true);
    try {
      await base44.entities.BuildBlock.update(from, { links });
      onChange?.();
    } catch {} finally {
      setBusy(false);
    }
  };

  if (nodes.length === 0) {
    return (
      <p className="text-[15px] font-semibold text-muted-foreground text-center py-16">
        Dieser Baukasten hat noch keine Bausteine — leg welche an, dann erscheinen sie hier als Knoten.
      </p>
    );
  }

  return (
    <div className="glass rounded-2xl border border-border p-3">
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-xs font-bold text-primary">
          <Link2 className="w-3.5 h-3.5" /> Ziehen zum Verbinden
        </span>
        <span className="text-[11px] text-muted-foreground">
          Zieh vom rechten Punkt eines Bausteins auf einen anderen, um sie zu verbinden. Linie anklicken zum Löschen. Baustein ziehen zum Verschieben.
        </span>
        {busy && <span className="text-[11px] text-muted-foreground">speichert …</span>}
      </div>

      <div className="relative overflow-auto rounded-xl border border-border bg-background" style={{ maxHeight: 620 }}>
        <div ref={canvasRef} className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
          <svg className="absolute inset-0" width={CANVAS_W} height={CANVAS_H} style={{ pointerEvents: "none" }}>
            {edges.map((e, i) => {
              const a = center(e.from);
              const b = center(e.to);
              return (
                <g key={i}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--primary))" strokeWidth={2} opacity={0.7} />
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="transparent"
                    strokeWidth={14}
                    style={{ pointerEvents: "stroke", cursor: "pointer" }}
                    onClick={() => removeLink(e.from, e.to)}
                  />
                  {e.label && (
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2}
                      fill="hsl(var(--foreground))"
                      fontSize={11}
                      fontWeight={700}
                      textAnchor="middle"
                      dy={-4}
                      style={{ pointerEvents: "none" }}
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
            {dragFrom && dragPos && (() => {
              const a = portPoint(dragFrom);
              return (
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={dragPos.x}
                  y2={dragPos.y}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="6 5"
                  opacity={0.9}
                />
              );
            })()}
          </svg>

          {nodes.map((n) => {
            const p = positions[n.id] || { x: 0, y: 0 };
            const isTarget = hoverTarget === n.id && dragFrom && dragFrom !== n.id;
            const linkCount = (n.links || []).length;
            return (
              <div
                key={n.id}
                onPointerDown={(e) => startDrag(e, n.id)}
                className={cn(
                  "absolute rounded-2xl border-2 p-3 select-none cursor-grab",
                  kindColor[n.blockKind] || "bg-elevated border-border",
                  isTarget && "ring-4 ring-primary"
                )}
                style={{ left: p.x, top: p.y, width: NODE_W, minHeight: NODE_H }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {n.blockKind}
                </p>
                <p className="text-[13px] font-bold text-foreground leading-tight overflow-hidden">
                  {n.title}
                </p>
                {linkCount > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {linkCount} Verbindung{linkCount > 1 ? "en" : ""}
                  </p>
                )}
                {/* Verbindungs-Punkt: zieh ihn auf einen anderen Baustein */}
                <button
                  type="button"
                  onPointerDown={(e) => startConnect(e, n.id)}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary border-2 border-background cursor-crosshair hover:scale-110 transition-transform flex items-center justify-center"
                  title="Ziehen, um zu verbinden"
                >
                  <Link2 className="w-2.5 h-2.5 text-primary-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}