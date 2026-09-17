import type { CatalogTitle } from "@/lib/types";

function movie(
  id: string,
  title: string,
  year: number,
  genres: string[],
  obscurity: CatalogTitle["obscurity"]
): CatalogTitle {
  return { id, medium: "movie", title, year, genres, obscurity, source: "catalog" };
}

function game(
  id: string,
  title: string,
  year: number,
  genres: string[],
  obscurity: CatalogTitle["obscurity"]
): CatalogTitle {
  return { id, medium: "game", title, year, genres, obscurity, source: "catalog" };
}

export const MOVIES: CatalogTitle[] = [
  movie("movie-godfather", "The Godfather", 1972, ["Crime", "Drama"], 2),
  movie("movie-parasite", "Parasite", 2019, ["Thriller", "Drama"], 2),
  movie("movie-spirited-away", "Spirited Away", 2001, ["Animation", "Adventure"], 2),
  movie("movie-pulp-fiction", "Pulp Fiction", 1994, ["Crime", "Drama"], 2),
  movie("movie-get-out", "Get Out", 2017, ["Horror", "Thriller"], 2),
  movie("movie-shawshank", "The Shawshank Redemption", 1994, ["Drama"], 1),
  movie("movie-fury-road", "Mad Max: Fury Road", 2015, ["Action", "Adventure"], 2),
  movie("movie-mood-for-love", "In the Mood for Love", 2000, ["Romance", "Drama"], 4),
  movie("movie-dark-knight", "The Dark Knight", 2008, ["Action", "Crime"], 1),
  movie("movie-moonlight", "Moonlight", 2016, ["Drama"], 3),
  movie("movie-alien", "Alien", 1979, ["Horror", "Sci-Fi"], 2),
  movie("movie-eeaao", "Everything Everywhere All at Once", 2022, ["Comedy", "Sci-Fi"], 3),
  movie("movie-casablanca", "Casablanca", 1942, ["Romance", "Drama"], 2),
  movie("movie-pans-labyrinth", "Pan's Labyrinth", 2006, ["Drama", "Thriller"], 3),
  movie("movie-whiplash", "Whiplash", 2014, ["Drama"], 3),
  movie("movie-portrait", "Portrait of a Lady on Fire", 2019, ["Romance", "Drama"], 4),
  movie("movie-die-hard", "Die Hard", 1988, ["Action", "Thriller"], 1),
  movie("movie-budapest", "The Grand Budapest Hotel", 2014, ["Comedy", "Drama"], 2),
  movie("movie-no-country", "No Country for Old Men", 2007, ["Crime", "Thriller"], 2),
  movie("movie-lady-bird", "Lady Bird", 2017, ["Comedy", "Drama"], 3),
  movie("movie-jurassic-park", "Jurassic Park", 1993, ["Adventure", "Sci-Fi"], 1),
  movie("movie-arrival", "Arrival", 2016, ["Sci-Fi", "Drama"], 3),
  movie("movie-do-the-right-thing", "Do the Right Thing", 1989, ["Drama", "Comedy"], 3),
  movie("movie-social-network", "The Social Network", 2010, ["Drama"], 2),
  movie("movie-dune-two", "Dune: Part Two", 2024, ["Sci-Fi", "Action"], 1),
  movie("movie-wanda", "Wanda", 1970, ["Drama"], 5),
  movie("movie-killer-of-sheep", "Killer of Sheep", 1978, ["Drama"], 5),
  movie("movie-tetsuo", "Tetsuo: The Iron Man", 1989, ["Horror", "Sci-Fi"], 5),
  movie("movie-pomegranates", "The Color of Pomegranates", 1969, ["Drama"], 5),
  movie("movie-jeanne-dielman", "Jeanne Dielman, 23, quai du Commerce, 1080 Bruxelles", 1975, ["Drama"], 5),
];

export const GAMES: CatalogTitle[] = [
  game("game-botw", "The Legend of Zelda: Breath of the Wild", 2017, ["Adventure", "Action"], 1),
  game("game-hades", "Hades", 2020, ["Action", "Indie"], 2),
  game("game-stardew", "Stardew Valley", 2016, ["Simulation", "Indie"], 2),
  game("game-elden-ring", "Elden Ring", 2022, ["Action", "RPG"], 1),
  game("game-portal-2", "Portal 2", 2011, ["Puzzle", "Action"], 2),
  game("game-mario-odyssey", "Super Mario Odyssey", 2017, ["Platformer", "Adventure"], 1),
  game("game-disco-elysium", "Disco Elysium", 2019, ["RPG", "Indie"], 3),
  game("game-celeste", "Celeste", 2018, ["Platformer", "Indie"], 3),
  game("game-last-of-us", "The Last of Us", 2013, ["Action", "Adventure"], 1),
  game("game-minecraft", "Minecraft", 2011, ["Adventure", "Simulation"], 1),
  game("game-hollow-knight", "Hollow Knight", 2017, ["Action", "Indie"], 3),
  game("game-bg3", "Baldur's Gate 3", 2023, ["RPG"], 2),
  game("game-animal-crossing", "Animal Crossing: New Horizons", 2020, ["Simulation"], 1),
  game("game-rdr2", "Red Dead Redemption 2", 2018, ["Action", "Adventure"], 1),
  game("game-tetris-effect", "Tetris Effect", 2018, ["Puzzle"], 3),
  game("game-outer-wilds", "Outer Wilds", 2019, ["Adventure", "Puzzle"], 4),
  game("game-sf6", "Street Fighter 6", 2023, ["Fighting"], 2),
  game("game-undertale", "Undertale", 2015, ["RPG", "Indie"], 2),
  game("game-god-of-war", "God of War", 2018, ["Action", "Adventure"], 1),
  game("game-slay-the-spire", "Slay the Spire", 2019, ["Strategy", "Indie"], 3),
  game("game-super-metroid", "Super Metroid", 1994, ["Action", "Adventure"], 3),
  game("game-it-takes-two", "It Takes Two", 2021, ["Adventure", "Platformer"], 2),
  game("game-persona-5", "Persona 5 Royal", 2019, ["RPG"], 2),
  game("game-among-us", "Among Us", 2018, ["Indie"], 1),
  game("game-chrono-trigger", "Chrono Trigger", 1995, ["RPG"], 3),
  game("game-return-of-the-obra-dinn", "Return of the Obra Dinn", 2018, ["Puzzle", "Indie"], 4),
  game("game-hypnospace", "Hypnospace Outlaw", 2019, ["Adventure", "Indie"], 5),
  game("game-cruelty-squad", "Cruelty Squad", 2021, ["Action", "Indie"], 5),
  game("game-baba", "Baba Is You", 2019, ["Puzzle", "Indie"], 4),
  game("game-uwu", "Umurangi Generation", 2020, ["Indie", "Simulation"], 5),
];

export const CATALOG: CatalogTitle[] = [...MOVIES, ...GAMES];

export const CATALOG_BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function titlesFor(medium: CatalogTitle["medium"]): CatalogTitle[] {
  return medium === "movie" ? MOVIES : GAMES;
}

export function resolveTitle(
  id: string,
  customTitles: CatalogTitle[] = []
): CatalogTitle | undefined {
  return customTitles.find((item) => item.id === id) ?? CATALOG_BY_ID.get(id);
}

export const SEARCH_FALLBACK: CatalogTitle[] = [
  movie("search-inception", "Inception", 2010, ["Sci-Fi", "Action"], 1),
  movie("search-heat", "Heat", 1995, ["Crime", "Thriller"], 2),
  movie("search-spirited", "Spirited Away", 2001, ["Animation"], 2),
  movie("search-paris-texas", "Paris, Texas", 1984, ["Drama"], 4),
  movie("search-climax", "Climax", 2018, ["Horror", "Drama"], 4),
  movie("search-aftersun", "Aftersun", 2022, ["Drama"], 4),
  game("search-hades", "Hades", 2020, ["Action", "Indie"], 2),
  game("search-outer-wilds", "Outer Wilds", 2019, ["Adventure"], 4),
];
