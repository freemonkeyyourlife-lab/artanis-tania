// Ein Wunsch läuft mit seinem Plan-Eintrag mit: wird der Eintrag weitergezogen,
// sieht man auch am Wunsch, wie weit er ist.
const PLAN_TO_REQUEST = {
  IDEA: "PLANNED",
  PLANNED: "PLANNED",
  RECORDED: "RECORDED",
  EDITING: "RECORDED",
  READY: "RECORDED",
  PUBLISHED: "CREATED",
};

export const requestStatusForPlan = (status) => PLAN_TO_REQUEST[status] || "PLANNED";

export const WORKING_REQUEST_STATUSES = ["PLANNED", "RECORDED", "CREATED"];