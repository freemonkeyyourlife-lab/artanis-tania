import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// Die Erzählerin, sichtbar und lebendig: ein Porträt des jeweiligen Story-Charakters
// auf einer 3D-Ebene, das dem Zeiger folgt, sanft atmet, blinzelt und beim Sprechen
// Mund und Kopf bewegt — nie ein totes Bild, sondern eine echte Präsenz im Raum.
export default function NarratorAvatar3D({ narrator, speaking, size = 220, showName = true }) {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 120, damping: 12 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 120, damping: 12 });

  // Lebendiger Takt: während sie spricht, wogt der Kopf leicht, der Mundbereich pulsiert,
  // die Augen blinzeln in unregelmäßigen Abständen — wie ein echter Mensch beim Erzählen.
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!speaking) return;
    let t;
    const loop = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
      t = setTimeout(loop, 1800 + Math.random() * 2600);
    };
    t = setTimeout(loop, 800 + Math.random() * 1500);
    return () => clearTimeout(t);
  }, [speaking]);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const name = narrator?.name?.trim() || "Erzählerin";
  const avatar = narrator?.avatar;

  return (
    <div className="flex flex-col items-center gap-2 select-none" style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ width: size, height: size, transformStyle: "preserve-3d" }}
        className="relative"
      >
        <motion.div
          style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
          animate={speaking
            ? { y: [0, -6, 0, -4, 0], rotateZ: [0, 1.5, 0, -1.5, 0] }
            : { y: [0, -8, 0], rotateZ: 0 }}
          transition={{ duration: speaking ? 2.4 : 5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full relative"
        >
          {/* Lichtrand, der beim Sprechen stärker und schneller pulsiert — sie wirkt lebendig. */}
          <motion.div
            animate={speaking
              ? { scale: [1, 1.08, 0.98, 1.06, 1], opacity: [0.5, 0.95, 0.6, 0.85, 0.5] }
              : { scale: [1, 1.04, 1], opacity: [0.35, 0.5, 0.35] }}
            transition={{ duration: speaking ? 1.1 : 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-2 rounded-full bg-primary/30 blur-xl"
            style={{ transform: "translateZ(-20px)" }}
          />
          <div
            className={cn(
              "relative w-full h-full rounded-full overflow-hidden border-2",
              speaking ? "border-primary" : "border-primary/50"
            )}
            style={{ transform: "translateZ(40px)" }}
          >
            {avatar ? (
              <Image src={avatar} fittingType="fill" className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-elevated font-display text-3xl text-primary">
                {name.slice(0, 1)}
              </div>
            )}
            {/* Augenblinzeln — ein schmaler Schleier über der oberen Hälfte. */}
            <motion.div
              animate={blink ? { scaleY: 1, opacity: 0.9 } : { scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{ originY: 0 }}
              className="absolute inset-x-0 top-0 h-1/2 bg-foreground/55"
            />
            {/* Mundbewegung beim Sprechen — ein weicher Schatten über der unteren Hälfte, der pulsiert. */}
            {speaking && (
              <motion.div
                animate={{ scaleY: [0.6, 1, 0.7, 0.9, 0.6], opacity: [0.18, 0.32, 0.2, 0.3, 0.18] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                style={{ originY: 1 }}
                className="absolute inset-x-0 bottom-0 h-1/3 bg-black/40"
              />
            )}
          </div>
          {/* Glanz oben — Tiefe, kein flaches Foto. */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              transform: "translateZ(60px)",
              background: "linear-gradient(160deg, rgba(255,255,255,0.25), transparent 42%)",
            }}
          />
        </motion.div>
      </motion.div>
      {showName && (
        <div className="text-center" style={{ transform: "translateZ(40px)" }}>
          <p className="text-[14px] font-bold text-foreground">{name}</p>
          <motion.p
            animate={speaking ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            className="text-[11px] font-bold uppercase tracking-wider text-primary"
          >
            {speaking ? "erzählt …" : "Erzählerin"}
          </motion.p>
        </div>
      )}
    </div>
  );
}