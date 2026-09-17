import type { CatalogTitle } from "@/lib/types";

export const MOVIES: CatalogTitle[] = [
  { id: "movie-godfather", medium: "movie", title: "The Godfather", year: 1972 },
  { id: "movie-parasite", medium: "movie", title: "Parasite", year: 2019 },
  { id: "movie-spirited-away", medium: "movie", title: "Spirited Away", year: 2001 },
  { id: "movie-pulp-fiction", medium: "movie", title: "Pulp Fiction", year: 1994 },
  { id: "movie-get-out", medium: "movie", title: "Get Out", year: 2017 },
  { id: "movie-shawshank", medium: "movie", title: "The Shawshank Redemption", year: 1994 },
  { id: "movie-fury-road", medium: "movie", title: "Mad Max: Fury Road", year: 2015 },
  { id: "movie-mood-for-love", medium: "movie", title: "In the Mood for Love", year: 2000 },
  { id: "movie-dark-knight", medium: "movie", title: "The Dark Knight", year: 2008 },
  { id: "movie-moonlight", medium: "movie", title: "Moonlight", year: 2016 },
  { id: "movie-alien", medium: "movie", title: "Alien", year: 1979 },
  { id: "movie-eeaao", medium: "movie", title: "Everything Everywhere All at Once", year: 2022 },
  { id: "movie-casablanca", medium: "movie", title: "Casablanca", year: 1942 },
  { id: "movie-pans-labyrinth", medium: "movie", title: "Pan's Labyrinth", year: 2006 },
  { id: "movie-whiplash", medium: "movie", title: "Whiplash", year: 2014 },
  { id: "movie-portrait", medium: "movie", title: "Portrait of a Lady on Fire", year: 2019 },
  { id: "movie-die-hard", medium: "movie", title: "Die Hard", year: 1988 },
  { id: "movie-budapest", medium: "movie", title: "The Grand Budapest Hotel", year: 2014 },
  { id: "movie-no-country", medium: "movie", title: "No Country for Old Men", year: 2007 },
  { id: "movie-lady-bird", medium: "movie", title: "Lady Bird", year: 2017 },
  { id: "movie-jurassic-park", medium: "movie", title: "Jurassic Park", year: 1993 },
  { id: "movie-arrival", medium: "movie", title: "Arrival", year: 2016 },
  { id: "movie-do-the-right-thing", medium: "movie", title: "Do the Right Thing", year: 1989 },
  { id: "movie-social-network", medium: "movie", title: "The Social Network", year: 2010 },
  { id: "movie-dune-two", medium: "movie", title: "Dune: Part Two", year: 2024 },
];

export const GAMES: CatalogTitle[] = [
  { id: "game-botw", medium: "game", title: "The Legend of Zelda: Breath of the Wild", year: 2017 },
  { id: "game-hades", medium: "game", title: "Hades", year: 2020 },
  { id: "game-stardew", medium: "game", title: "Stardew Valley", year: 2016 },
  { id: "game-elden-ring", medium: "game", title: "Elden Ring", year: 2022 },
  { id: "game-portal-2", medium: "game", title: "Portal 2", year: 2011 },
  { id: "game-mario-odyssey", medium: "game", title: "Super Mario Odyssey", year: 2017 },
  { id: "game-disco-elysium", medium: "game", title: "Disco Elysium", year: 2019 },
  { id: "game-celeste", medium: "game", title: "Celeste", year: 2018 },
  { id: "game-last-of-us", medium: "game", title: "The Last of Us", year: 2013 },
  { id: "game-minecraft", medium: "game", title: "Minecraft", year: 2011 },
  { id: "game-hollow-knight", medium: "game", title: "Hollow Knight", year: 2017 },
  { id: "game-bg3", medium: "game", title: "Baldur's Gate 3", year: 2023 },
  { id: "game-animal-crossing", medium: "game", title: "Animal Crossing: New Horizons", year: 2020 },
  { id: "game-rdr2", medium: "game", title: "Red Dead Redemption 2", year: 2018 },
  { id: "game-tetris-effect", medium: "game", title: "Tetris Effect", year: 2018 },
  { id: "game-outer-wilds", medium: "game", title: "Outer Wilds", year: 2019 },
  { id: "game-sf6", medium: "game", title: "Street Fighter 6", year: 2023 },
  { id: "game-undertale", medium: "game", title: "Undertale", year: 2015 },
  { id: "game-god-of-war", medium: "game", title: "God of War", year: 2018 },
  { id: "game-slay-the-spire", medium: "game", title: "Slay the Spire", year: 2019 },
  { id: "game-super-metroid", medium: "game", title: "Super Metroid", year: 1994 },
  { id: "game-it-takes-two", medium: "game", title: "It Takes Two", year: 2021 },
  { id: "game-persona-5", medium: "game", title: "Persona 5 Royal", year: 2019 },
  { id: "game-among-us", medium: "game", title: "Among Us", year: 2018 },
  { id: "game-chrono-trigger", medium: "game", title: "Chrono Trigger", year: 1995 },
];

export const CATALOG: CatalogTitle[] = [...MOVIES, ...GAMES];

export const CATALOG_BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function titlesFor(medium: CatalogTitle["medium"]): CatalogTitle[] {
  return medium === "movie" ? MOVIES : GAMES;
}
