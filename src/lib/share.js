// Ein Link für alle: jeder kann ihn weitergeben. Wer darüber kommt, hat ab der
// Anmeldung alles frei (Gold-Zugang).
export const SHARE_TOKEN = "pro";

export function buildShareUrl() {
  return `${window.location.origin}/?invite=${SHARE_TOKEN}`;
}