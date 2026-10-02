// Dieselben Bausteine in allen vier Blöcken der Erzählerin — damit es überall
// gleich aussieht und sich nichts auseinanderentwickelt.

export const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

export const labelCls = "block text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5";

export const chipCls = (on) =>
  on
    ? "px-3.5 py-2 rounded-full text-[12px] font-bold glass-btn glass-btn-accent text-gloss"
    : "px-3.5 py-2 rounded-full text-[12px] font-bold glass-btn text-muted-foreground";

export const btnCls =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[13px] font-bold text-foreground disabled:opacity-50";

export const btnAccentCls =
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50";