// Erklärungen an oder aus. Jeder kann das für sich umschalten, jederzeit —
// die Einstellung bleibt im Browser gespeichert.

const KEY = "artanis_info_mode";

let listeners = [];

const read = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch (e) {
    return true;
  }
};

let value = read();

export const getInfoMode = () => value;

export const setInfoMode = (on) => {
  value = !!on;
  try {
    localStorage.setItem(KEY, value ? "on" : "off");
  } catch (e) {
    /* ignore */
  }
  listeners.forEach((fn) => fn(value));
};

export const subscribeInfoMode = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((x) => x !== fn);
  };
};