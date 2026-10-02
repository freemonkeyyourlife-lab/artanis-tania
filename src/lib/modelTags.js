// Wofür ein Modell taugt: Stil, Freizügigkeit und Stimmung. Damit steht vorher
// fest, welches Modell für welchen Sinn der beste Griff ist.

const IMAGE_STYLES = [
  { id: "FOTOREAL", label: "Fotoreal", tone: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  { id: "ANIME", label: "Anime", tone: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30" },
  { id: "ILLUSTRATION", label: "Illustration", tone: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  { id: "COMIC", label: "Comic", tone: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  { id: "RENDER_3D", label: "3D & Render", tone: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  { id: "GEMISCHT", label: "Gemischt", tone: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
];

export const STYLES = {
  BILD: IMAGE_STYLES,
  VIDEO: IMAGE_STYLES,
  TEXT: [
    { id: "ERZAEHLEND", label: "Erzählend", tone: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
    { id: "DIALOG", label: "Dialog", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    { id: "ROLLENSPIEL", label: "Rollenspiel", tone: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30" },
    { id: "ANALYTISCH", label: "Analytisch", tone: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
    { id: "SACHLICH", label: "Sachlich", tone: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  ],
};

// Wie weit ein Modell geht — von zahm bis ohne Grenze.
export const EXPLICIT_LEVELS = [
  { id: "ZAHM", label: "Zahm", rank: 0, tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { id: "ANZUEGLICH", label: "Anzüglich", rank: 1, tone: "bg-teal-500/15 text-teal-300 border-teal-500/30" },
  { id: "SINNLICH", label: "Sinnlich", rank: 2, tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { id: "EXPLIZIT", label: "Explizit", rank: 3, tone: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  { id: "HART", label: "Hart", rank: 4, tone: "bg-red-500/15 text-red-300 border-red-500/30" },
];

// Wofür man ein Modell nimmt — die Stimmung und der Sinn.
export const MOODS = [
  { id: "ROMANTISCH", label: "Romantisch", tone: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  { id: "ZART", label: "Zart", tone: "bg-pink-500/15 text-pink-300 border-pink-500/30" },
  { id: "VERFUEHRERISCH", label: "Verführerisch", tone: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30" },
  { id: "SINNLICH", label: "Sinnlich", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { id: "VERSCHMITZT", label: "Verschmitzt", tone: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  { id: "HEISS", label: "Heiß", tone: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  { id: "HART", label: "Hart", tone: "bg-red-500/15 text-red-300 border-red-500/30" },
  { id: "SPIELERISCH", label: "Spielerisch", tone: "bg-lime-500/15 text-lime-300 border-lime-500/30" },
  { id: "VERSORGT", label: "Versorgt", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { id: "STORY", label: "Story", tone: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  { id: "PORTRÄT", label: "Porträt", tone: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
];

const find = (list, id) => list.find((o) => o.id === id) || null;

export const styleOptions = (kind) => STYLES[kind] || STYLES.BILD;
export const styleOption = (kind, id) => find(styleOptions(kind), id);
export const explicitOption = (id) => find(EXPLICIT_LEVELS, id);
export const moodOption = (id) => find(MOODS, id);

export const styleLabel = (kind, id) => styleOption(kind, id)?.label || id;
export const explicitLabel = (id) => explicitOption(id)?.label || id;
export const moodLabel = (id) => moodOption(id)?.label || id;

export const emptyTags = () => ({ style: "", explicit: "", moods: [] });

export const tagsOf = (model) => ({
  style: model?.style || "",
  explicit: model?.explicit || "",
  moods: Array.isArray(model?.moods) ? model.moods : [],
});

// Nur das anzeigen, was in der eigenen Liste auch wirklich vorkommt.
export function usedOptions(models, kind) {
  const list = models || [];
  const has = (id) => id && list.some((m) => m[id] || (Array.isArray(m[id]) && m[id].length));
  return {
    styles: styleOptions(kind).filter((s) => list.some((m) => m.style === s.id)),
    explicits: EXPLICIT_LEVELS.filter((e) => list.some((m) => m.explicit === e.id)),
    moods: MOODS.filter((mo) => list.some((m) => (m.moods || []).includes(mo.id))),
    any: has("style") || has("explicit") || has("moods"),
  };
}

export function matchesFilter(model, filter = {}) {
  if (filter.style && model?.style !== filter.style) return false;
  if (filter.explicit && model?.explicit !== filter.explicit) return false;
  const moods = filter.moods || [];
  if (moods.length && !moods.some((m) => (model?.moods || []).includes(m))) return false;
  return true;
}

export const filterEmpty = (filter) =>
  !filter?.style && !filter?.explicit && !(filter?.moods || []).length;

// Das beste Modell für eine Stimmung: Treffer in der Stimmung zählen am meisten,
// Stil und Freizügigkeit danach, ein Favorit bekommt den letzten Ausschlag.
export function bestModelFor(models, need = {}) {
  const wanted = need.moods || [];
  let best = null;
  (models || [])
    .filter((m) => m && m.enabled !== false)
    .forEach((m) => {
      const hits = wanted.filter((w) => (m.moods || []).includes(w));
      let score = hits.length * 3;
      if (need.style && m.style === need.style) score += 2;
      if (need.explicit && m.explicit === need.explicit) score += 2;
      if (need.explicit && m.explicit) {
        const want = explicitOption(need.explicit)?.rank ?? 2;
        const has = explicitOption(m.explicit)?.rank ?? 2;
        score -= Math.abs(want - has);
      }
      if (m.favorite) score += 1;
      if (!best || score > best.score) best = { model: m, score, moods: hits };
    });
  if (!best || best.score <= 0) return null;
  return best;
}