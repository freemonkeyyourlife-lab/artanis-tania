// Mehrere Bildschirme gleichzeitig: sie werden auf eine gemeinsame Fläche
// gezeichnet und als EIN Bild gesendet. So sehen alle im Call alle Monitore
// nebeneinander — zwei zu zweit, drei zu dritt —, ohne dass für jeden Monitor
// eine eigene Leitung nötig wäre.
const FRAME_MS = 1000 / 15;
const WIDTH = 1920;
const HEIGHT = 1080;

function grid(count) {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count <= 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  return { cols: 3, rows: Math.ceil(count / 3) };
}

export function createScreenMixer() {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  const tiles = []; // { stream, video }
  let timer = null;

  const render = () => {
    const { cols, rows } = grid(tiles.length);
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    tiles.forEach((tile, i) => {
      const v = tile.video;
      if (!v.videoWidth || !v.videoHeight) return;
      const scale = Math.min(cellW / v.videoWidth, cellH / v.videoHeight);
      const w = v.videoWidth * scale;
      const h = v.videoHeight * scale;
      const x = (i % cols) * cellW + (cellW - w) / 2;
      const y = Math.floor(i / cols) * cellH + (cellH - h) / 2;
      ctx.drawImage(v, x, y, w, h);
    });
  };

  const stream = canvas.captureStream(15);
  const track = stream.getVideoTracks()[0];

  const add = (screenStream) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    // Außerhalb des Sichtfelds eingehängt — manche Browser zeichnen nur
    // eingehängte Videos zuverlässig auf die Fläche.
    video.style.cssText = "position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;";
    video.srcObject = screenStream;
    document.body.appendChild(video);
    video.play().catch(() => {});
    tiles.push({ stream: screenStream, video });
    if (!timer) timer = setInterval(render, FRAME_MS);
    render();
  };

  const remove = (screenStream) => {
    const at = tiles.findIndex((t) => t.stream === screenStream);
    if (at < 0) return;
    const tile = tiles[at];
    tile.video.srcObject = null;
    tile.video.remove();
    tiles.splice(at, 1);
    render();
    if (tiles.length === 0) stop();
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
    tiles.forEach((t) => { t.video.srcObject = null; t.video.remove(); });
    tiles.length = 0;
    track.stop();
  };

  return { stream, track, add, remove, stop, count: () => tiles.length };
}