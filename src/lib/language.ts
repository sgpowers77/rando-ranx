import type { CatalogTitle } from "@/lib/types";

export function spokenLanguagesIncludeEnglish(raw: string | undefined): boolean {
  if (!raw) return false;
  return /'iso_639_1'\s*:\s*'en'|"iso_639_1"\s*:\s*"en"|'name'\s*:\s*'English'|"name"\s*:\s*"English"/i.test(
    raw
  );
}

export function isEnglishDialogueFilm(
  originalLanguage: string | undefined,
  spokenLanguagesRaw: string | undefined
): boolean {
  const orig = (originalLanguage ?? "").trim().toLowerCase();
  if (orig === "en") return true;
  return spokenLanguagesIncludeEnglish(spokenLanguagesRaw);
}

export function titleIsEnglishDialogue(title: CatalogTitle): boolean {
  if (title.medium !== "movie") return true;
  if (title.englishDialogue === false) return false;
  if (title.englishDialogue === true) return true;
  const orig = (title.originalLanguage ?? "").trim().toLowerCase();
  if (orig === "en") return true;
  if (orig) return false;
  return true;
}
