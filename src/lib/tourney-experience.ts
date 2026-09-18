export const TOURNEY_EXPERIENCE_HIDE_KEY = "randoranx-hide-tourney-experience";

export function tourneyExperienceHidden(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(TOURNEY_EXPERIENCE_HIDE_KEY) === "1";
}

export function setTourneyExperienceHidden(hidden: boolean) {
  if (typeof window === "undefined") return;
  if (hidden) window.localStorage.setItem(TOURNEY_EXPERIENCE_HIDE_KEY, "1");
  else window.localStorage.removeItem(TOURNEY_EXPERIENCE_HIDE_KEY);
}
