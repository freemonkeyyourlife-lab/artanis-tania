// „Blick als": Du schaust dir die App so an, wie ein bestimmter Nutzer sie
// sieht — ohne dich ab- und wieder anzumelden. Die Testnutzer sind gespielte
// Konten und liegen nur bei dir im Browser; es sind keine echten Anmeldungen.

const KEY = "artanis_view_as";
const LIST_KEY = "artanis_test_users";

const DEFAULT_TEST_USERS = [
  { id: "test-1", name: "Julia", memberStatus: "STANDARD" },
  { id: "test-2", name: "Marc", memberStatus: "STANDARD" },
  { id: "test-3", name: "Sven", memberStatus: "GOLD" },
  { id: "test-4", name: "Nina", memberStatus: "STANDARD" },
  { id: "test-5", name: "Tom", memberStatus: "GOLD" },
];

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* ignore */
  }
};

let listeners = [];

const emit = () => listeners.forEach((fn) => fn());

export const subscribeViewAs = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((x) => x !== fn);
  };
};

export const getViewAs = () => read(KEY, null);

export const setViewAs = (user) => {
  write(KEY, user || null);
  emit();
};

export const testUsers = () => {
  const list = read(LIST_KEY, null);
  return Array.isArray(list) ? list : DEFAULT_TEST_USERS;
};

export const addTestUser = (name, memberStatus = "STANDARD") => {
  const user = { id: `test-${Date.now()}`, name: name.trim(), memberStatus };
  write(LIST_KEY, [...testUsers(), user]);
  emit();
  return user;
};

export const removeTestUser = (id) => {
  write(LIST_KEY, testUsers().filter((u) => u.id !== id));
  if (getViewAs()?.id === id) write(KEY, null);
  emit();
};