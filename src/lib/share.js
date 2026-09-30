// Ein Link für alle: jeder kann ihn weitergeben. Wer darüber kommt, hat ab der
// Anmeldung alles frei (Gold-Zugang).
export const SHARE_TOKEN = "pro";

export function buildShareUrl() {
  return `${window.location.origin}/?invite=${SHARE_TOKEN}`;
}

// Fertiger Telegram-Link: öffnet Telegram und lässt dich den Chat auswählen.
export function telegramShareUrl(url, text = "") {
  const params = new URLSearchParams({ url });
  if (text) params.set("text", text);
  return `https://t.me/share/url?${params.toString()}`;
}