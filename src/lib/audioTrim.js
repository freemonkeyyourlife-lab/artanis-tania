// Eine Aufnahme lesen, ihre Wellenform zeichnen und einen Ausschnitt
// daraus als fertige Tondatei zurückgeben. Alles im Browser — nichts
// verlässt das Gerät, bevor du den Ausschnitt wirklich übernimmst.

const audioContext = () => new (window.AudioContext || window.webkitAudioContext)();

// Datei oder Abruf-Link einlesen — heraus kommt der reine Ton.
export async function loadAudioBuffer(source) {
  const data = typeof source === "string"
    ? await (await fetch(source)).arrayBuffer()
    : await source.arrayBuffer();
  const ctx = audioContext();
  try {
    return await ctx.decodeAudioData(data);
  } finally {
    ctx.close();
  }
}

// Für die Anzeige: aus dem Ton werden Balken, einer je Bildspalte.
export function peaks(buffer, count = 160) {
  const channel = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(channel.length / count));
  const out = [];
  for (let i = 0; i < count; i += 1) {
    let max = 0;
    const from = i * step;
    for (let j = 0; j < step; j += 8) {
      const value = Math.abs(channel[from + j] || 0);
      if (value > max) max = value;
    }
    out.push(max);
  }
  return out;
}

// Den gewählten Ausschnitt als WAV-Datei — so lässt er sich hochladen wie jede Aufnahme.
export function sliceToWav(buffer, startSec, endSec) {
  const rate = buffer.sampleRate;
  const from = Math.max(0, Math.floor(startSec * rate));
  const to = Math.min(buffer.length, Math.max(from + 1, Math.floor(endSec * rate)));
  const length = to - from;
  const channels = Math.min(2, buffer.numberOfChannels);
  const bytes = 44 + length * channels * 2;
  const view = new DataView(new ArrayBuffer(bytes));
  const write = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  write(0, "RIFF");
  view.setUint32(4, bytes - 8, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, length * channels * 2, true);

  const tracks = [];
  for (let c = 0; c < channels; c += 1) tracks.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < length; i += 1) {
    for (let c = 0; c < channels; c += 1) {
      const sample = Math.max(-1, Math.min(1, tracks[c][from + i] || 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: "audio/wav" });
}

export const formatSeconds = (value) => {
  const total = Math.max(0, Number(value) || 0);
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  const tenth = Math.floor((total % 1) * 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenth}`;
};