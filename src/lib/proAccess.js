// Pro-Zugang. Kommt entweder vom Konto (Gold Member / Admin) oder über den
// Gratis-Link, mit dem man Pro vergeben kann, ohne dass sich jemand anmelden muss.
const KEY = "artanis_pro";

export const localProActive = () => {
  try {
    return localStorage.getItem(KEY) === "GOLD";
  } catch (e) {
    return false;
  }
};

export const grantLocalPro = (status = "GOLD") => {
  try {
    localStorage.setItem(KEY, status);
  } catch (e) {
    /* ignore */
  }
};

// Pro = Admin, Gold Member, oder über den Gratis-Link freigeschaltet.
export const hasProAccess = (user) =>
  user?.role === "admin" || user?.memberStatus === "GOLD" || localProActive();