// Der Call-Link bleibt derselbe, bis der Gastgeber bewusst einen neuen erzeugt.
const KEY = "artanis_call_token";

export function getCallToken() {
  let token = null;
  try { token = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
  if (!token) {
    token = crypto.randomUUID();
    try { localStorage.setItem(KEY, token); } catch (e) { /* ignore */ }
  }
  return token;
}

export function resetCallToken() {
  const token = crypto.randomUUID();
  try { localStorage.setItem(KEY, token); } catch (e) { /* ignore */ }
  return token;
}