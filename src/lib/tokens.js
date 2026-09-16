const KEY = "a_t_tokens";
const STARTING_TOKENS = 50;

export function getTokens() {
  try { return parseInt(localStorage.getItem(KEY) || String(STARTING_TOKENS)); } catch { return STARTING_TOKENS; }
}

export function spendTokens(amount) {
  const current = getTokens();
  if (current < amount) return false;
  localStorage.setItem(KEY, String(current - amount));
  window.dispatchEvent(new Event("tokens-changed"));
  return true;
}

export function addTokens(amount) {
  const current = getTokens();
  const newVal = current + amount;
  localStorage.setItem(KEY, String(newVal));
  window.dispatchEvent(new Event("tokens-changed"));
  return newVal;
}