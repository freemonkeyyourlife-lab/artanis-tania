// Bild-Vorverarbeitung fürs Training: Zuschnitt auf 3:4-Porträt,
// perceptueller Hash zur Entdoppelung und Schärfe-Messung für Video-Frames.
// Alles client-seitig, bevor die Dateien gespeichert werden (stored privately).

function loadBitmap(file) {
  return createImageBitmap(file);
}

// Center-Crop auf 3:4-Hochformat, max. 1024 px hoch, als JPEG.
export async function cropToPortrait(file, ratio = 3 / 4, maxH = 1024) {
  const bitmap = await loadBitmap(file);
  const { width, height } = bitmap;
  let cw = width;
  let ch = height;
  let sx = 0;
  let sy = 0;
  const current = width / height;
  if (current > ratio) {
    cw = Math.round(height * ratio);
    sx = Math.round((width - cw) / 2);
  } else {
    ch = Math.round(width / ratio);
    sy = Math.round((height - ch) / 2);
  }
  const scale = ch > maxH ? maxH / ch : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cw * scale);
  canvas.height = Math.round(ch * scale);
  canvas.getContext("2d").drawImage(bitmap, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.92));
  bitmap.close?.();
  return new File([blob], (file.name || "bild").replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

// 8x8-Grauwert-Hash (Average-Hash) — gleiche Hashes = nahzu identisches Bild.
export async function signatureOf(file) {
  const bitmap = await loadBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, 8, 8);
  const data = ctx.getImageData(0, 0, 8, 8).data;
  bitmap.close?.();
  const gray = [];
  for (let i = 0; i < 64; i++) {
    gray.push(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
  }
  const avg = gray.reduce((a, b) => a + b, 0) / 64;
  return gray.map((g) => (g > avg ? 1 : 0)).join("");
}

// Schärfe-Messung (Gradienten-Betrag) — höhere Werte = schärferes Bild.
export async function sharpnessOf(file) {
  const bitmap = await loadBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, 64, 64);
  const data = ctx.getImageData(0, 0, 64, 64).data;
  bitmap.close?.();
  let sum = 0;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 63; x++) {
      const i = (y * 64 + x) * 4;
      const j = (y * 64 + x + 1) * 4;
      const a = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const b = (data[j] + data[j + 1] + data[j + 2]) / 3;
      sum += Math.abs(a - b);
    }
  }
  return sum;
}