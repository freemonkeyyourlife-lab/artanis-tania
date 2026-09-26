export const COIN_VALUE = 0.1;

export function coinsForPrice(price) {
  return Math.max(1, Math.round(Number(price) / COIN_VALUE));
}

export function formatCoins(amount) {
  return (amount || 0).toLocaleString("de-DE");
}