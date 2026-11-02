import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// Die Erzählerin, sichtbar und lebendig: ein realistisches Porträt auf einer
// 3D-Ebene, das dem Zeiger folgt, sanft atmet und beim Sprechen pulsiert.
// Kein totes Bild — sie bewegt sich, als stünde sie echt im Raum.
export default function NarratorAvatar3D({ narrator, speaking, size = 220 }) {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 120, damping: 12 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 120, damping: 12 });

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
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full relative"
        >
          {/* Lichtrand, der beim Sprechen pulsiert — sie wirkt lebendig. */}
          <motion.div
            animate={speaking ? { scale: [1, 1.06, 1], opacity: [0.55, 0.9, 0.55] } : { opacity: 0.4 }}
            transition={{ duration: speaking ? 1.1 : 3, repeat: Infinity, ease: "easeInOut" }}
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
      <div className="text-center" style={{ transform: "translateZ(40px)" }}>
        <p className="text-[14px] font-bold text-foreground">{name}</p>
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {speaking ? "erzählt …" : "Erzählerin"}
        </p>
      </div>
    </div>
  );
}