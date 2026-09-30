// Ein Chat von der normalen Chat-Seite landet im laufenden Video-Call — ohne dass
// du die Seite verlassen oder hin und her wechseln musst.
let pending = null;
let listeners = [];

export const requestStage = (conversation) => {
  pending = conversation ? { id: conversation.id, title: conversation.title || "" } : null;
  listeners.forEach((fn) => fn(pending));
};

export const takePendingStage = () => {
  const p = pending;
  pending = null;
  return p;
};

export const onStageRequest = (fn) => {
  listeners.push(fn);
  return () => { listeners = listeners.filter((x) => x !== fn); };
};