export const EXPERIENCE_HIDE_KEY = "randoranx-hide-tourney-experience";

export function experienceHidden(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(EXPERIENCE_HIDE_KEY) === "1";
}

export function setExperienceHidden(hidden: boolean) {
  if (typeof window === "undefined") return;
  if (hidden) window.localStorage.setItem(EXPERIENCE_HIDE_KEY, "1");
  else window.localStorage.removeItem(EXPERIENCE_HIDE_KEY);
}

/** @deprecated Use experienceHidden */
export const tourneyExperienceHidden = experienceHidden;
/** @deprecated Use setExperienceHidden */
export const setTourneyExperienceHidden = setExperienceHidden;
export const TOURNEY_EXPERIENCE_HIDE_KEY = EXPERIENCE_HIDE_KEY;
