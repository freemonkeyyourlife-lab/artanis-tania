// Nach außen zählt der Künstlername — der echte Name taucht nirgends auf.
export function publicName(user, fallback = "Gast") {
  if (!user) return fallback;
  if (user.role === "admin") return "Artanis";
  return user.full_name || (user.email ? user.email.split("@")[0] : "") || fallback;
}