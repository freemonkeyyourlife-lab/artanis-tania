const KEY = "a_t_favorites";

export function getFavorites() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function isFavorite(type, id) {
  return getFavorites().includes(`${type}:${id}`);
}

export function toggleFavorite(type, id) {
  const favs = getFavorites();
  const key = `${type}:${id}`;
  const idx = favs.indexOf(key);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(key);
  localStorage.setItem(KEY, JSON.stringify(favs));
  window.dispatchEvent(new Event("favorite-toggled"));
  return favs;
}