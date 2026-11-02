import { base44 } from "@/api/base44Client";
import { cropUrlToPortrait } from "@/lib/trainImage";
import { signQuelleUrl } from "@/lib/quelleArchive";

// Geteilte Trainings-Logik — vom Upload bis zum fertigen Charakter.
// Genutzt vom geführten Assistenten, damit jeder Schritt dieselbe Pipeline
// treibt und nichts auseinanderdriftet.

export const signUri = async (uri) => {
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: uri,
      expires_in: 3600,
    });
    return r.signed_url;
  } catch {
    return null;
  }
};

// Ordner-/Dateiname → Personenname: erstes Pfadsegment.
export const personFromName = (name) => {
  const parts = (name || "").split(/[\\/]/).filter(Boolean);
  if (parts.length > 1) return parts[0].trim();
  return "";
};

export const loadSets = async () => {
  const { items } = await base44.entities.TrainingSet.filter(
    {},
    { sort: "-created_date", limit: 100 }
  );
  return items;
};

export const ensureSet = async (person, sets) => {
  const found = sets.find((s) => s.personName === person);
  if (found) return found;
  return base44.entities.TrainingSet.create({
    personName: person,
    name: `Set ${person}`,
    images: [],
    generatedImages: [],
    sourceMedia: [],
    targetCount: 12,
  });
};

// Ein passendes Bild derselben Person erzeugen — braucht ein Referenzbild.
export const fillSetCore = async (set) => {
  const ref = (set.images || [])[0] || (set.generatedImages || [])[0];
  if (!ref) return false;
  const refUrls = [ref.startsWith("http") ? ref : await signUri(ref)];
  const res = await base44.integrations.Core.GenerateImage({
    prompt:
      `Porträt einer Person namens ${set.personName}. ` +
      "Neue Pose, gleiche Person, fotorealistisch, neutraler Hintergrund, gleiches Licht. Erwachsene Person, keine realen Personen.",
    existing_image_urls: refUrls,
  });
  if (res?.url) {
    const generatedImages = [...(set.generatedImages || []), res.url];
    const total = (set.images?.length || 0) + generatedImages.length;
    await base44.entities.TrainingSet.update(set.id, {
      generatedImages,
      status: total >= (set.targetCount || 12) ? "BEREIT" : "SAMMLUNG",
    });
    return true;
  }
  return false;
};

// Ein Set bis zum Ziel auffüllen (max. 10 Generierungen pro Aufruf).
export const fillToTarget = async (setId) => {
  let cur = await base44.entities.TrainingSet.get(setId).catch((e) =>
    e.status === 404 ? null : Promise.reject(e)
  );
  if (!cur) return;
  const target = cur.targetCount || 12;
  for (let i = 0; i < 10; i++) {
    const have = (cur.images?.length || 0) + (cur.generatedImages?.length || 0);
    if (have >= target) break;
    const ok = await fillSetCore(cur);
    if (!ok) break;
    cur = await base44.entities.TrainingSet.get(setId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!cur) break;
  }
};

// Aus einem Set einen Charakter ziehen — vorhandenen aktualisieren, nicht doppelt.
export const extractCore = async (set) => {
  const refUri = (set.images || [])[0];
  const refUrl = refUri ? await signUri(refUri) : null;
  let appearance = "";
  if (refUrl) {
    const r = await base44.integrations.Core.InvokeLLM({
      prompt:
        "Beschreibe das Aussehen der Person auf diesem Bild in 2-3 Sätzen, auf Deutsch. Erwachsene Person.",
      file_urls: [refUrl],
    });
    appearance = typeof r === "string" ? r : String(r || "");
  }
  const { items } = await base44.entities.Character.filter(
    { name: set.personName },
    { limit: 1 }
  );
  const existing = items[0];
  let charId;
  if (existing) {
    await base44.entities.Character.update(existing.id, {
      appearance: appearance || existing.appearance,
      avatar: refUri || existing.avatar,
      images: Array.from(
        new Set([...(existing.images || []), ...(set.images || [])])
      ),
    });
    charId = existing.id;
  } else {
    const created = await base44.entities.Character.create({
      name: set.personName,
      adultAge: 25,
      appearance,
      avatar: refUri || "",
      images: set.images || [],
      fictional: true,
      createdByRole: "DAVID",
    });
    charId = created.id;
  }
  await base44.entities.TrainingSet.update(set.id, { status: "TRAINIERT" });
  return charId;
};

// Archiv-Bilder → zuschneiden → ins Set → auffüllen → Charakter ziehen → trainiert.
export const archiveTrain = async (selected, person, sets) => {
  const target = await ensureSet(person, sets);
  const existing = new Set(target.images || []);
  const images = [...(target.images || [])];
  let avatar = target.avatar;
  let taken = 0;
  for (const q of selected) {
    const url = await signQuelleUrl(q);
    if (!url) continue;
    try {
      const cropped = await cropUrlToPortrait(url);
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({
        file: cropped,
      });
      if (file_uri && !existing.has(file_uri)) {
        images.push(file_uri);
        existing.add(file_uri);
        if (!avatar) avatar = file_uri;
        taken += 1;
      }
    } catch {
      /* einzelnes Bild überspringen */
    }
  }
  if (!taken) return { target, taken };
  await base44.entities.TrainingSet.update(target.id, { images, avatar });
  await fillToTarget(target.id);
  const fresh = await base44.entities.TrainingSet.get(target.id).catch(() => null);
  if (fresh) await extractCore(fresh);
  return { target, taken };
};

// Upload-Batch: pro Ordnername einsortieren, Rest in den Pool.
export const ingestBatch = async (items, sets) => {
  const grouped = {};
  const loose = [];
  for (const it of items) {
    const person = personFromName(it.name);
    if (person) (grouped[person] = grouped[person] || []).push(it);
    else loose.push(it);
  }
  const created = [...sets];
  for (const person of Object.keys(grouped)) {
    let target = created.find((s) => s.personName === person);
    if (!target) {
      target = await base44.entities.TrainingSet.create({
        personName: person,
        name: `Set ${person}`,
        images: [],
        generatedImages: [],
        sourceMedia: [],
        targetCount: 12,
      });
      created.push(target);
    }
    const existing = new Set(target.images || []);
    const images = [...(target.images || [])];
    const sourceMedia = [...(target.sourceMedia || [])];
    let avatar = target.avatar;
    for (const it of grouped[person]) {
      if (it.type === "IMAGE" && !existing.has(it.uri)) {
        images.push(it.uri);
        existing.add(it.uri);
        if (!avatar) avatar = it.uri;
      } else if (it.type === "VIDEO") {
        sourceMedia.push(it.uri);
      }
    }
    await base44.entities.TrainingSet.update(target.id, { images, sourceMedia, avatar });
  }
  for (const t of created) {
    const have = (t.images?.length || 0) + (t.generatedImages?.length || 0);
    if (have > 0 && have < (t.targetCount || 12)) {
      await fillToTarget(t.id).catch(() => {});
    }
  }
  return { loose, sets: created };
};

// Pool automatisch zuordnen (Ordner-/Dateiname trifft Person).
export const autoSortPool = async (pool, sets) => {
  const byPerson = {};
  pool.forEach((p) => {
    let person = personFromName(p.name);
    if (!person) {
      const s = sets.find((x) =>
        (p.name || "").toLowerCase().includes(x.personName.toLowerCase())
      );
      if (s) person = s.personName;
    }
    if (person) (byPerson[person] = byPerson[person] || { items: [] }).items.push(p);
  });
  const matched = Object.values(byPerson).flatMap((g) => g.items);
  if (!matched.length) return { matched: 0, persons: 0, sets };
  const created = [...sets];
  for (const [person, g] of Object.entries(byPerson)) {
    let target = created.find((s) => s.personName === person);
    if (!target) {
      target = await base44.entities.TrainingSet.create({
        personName: person,
        name: `Set ${person}`,
        images: [],
        generatedImages: [],
        sourceMedia: [],
        targetCount: 12,
      });
      created.push(target);
    }
    const images = [...(target.images || [])];
    const sourceMedia = [...(target.sourceMedia || [])];
    let avatar = target.avatar;
    for (const p of g.items) {
      if (p.type === "IMAGE") {
        images.push(p.uri);
        if (!avatar) avatar = p.uri;
      } else if (p.type === "VIDEO") {
        sourceMedia.push(p.uri);
      }
    }
    await base44.entities.TrainingSet.update(target.id, { images, sourceMedia, avatar });
  }
  return { matched: matched.length, persons: Object.keys(byPerson).length, sets: created };
};

export const setTotal = (s) => (s.images?.length || 0) + (s.generatedImages?.length || 0);
export const setMissing = (s) => Math.max(0, (s.targetCount || 12) - setTotal(s));