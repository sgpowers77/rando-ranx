import type { CatalogTitle } from "@/lib/types";

/** Small local movie list used only if movies_metadata.csv cannot be loaded. */

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
  movie("movie-seven-samurai", "Seven Samurai", 1954, ["Action", "Drama"], 3),
  movie("movie-vertigo", "Vertigo", 1958, ["Thriller", "Romance"], 3),
  movie("movie-jaws", "Jaws", 1975, ["Thriller", "Adventure"], 1),
  movie("movie-blade-runner", "Blade Runner", 1982, ["Sci-Fi", "Thriller"], 2),
  movie("movie-my-neighbor-totoro", "My Neighbor Totoro", 1988, ["Animation", "Adventure"], 2),
  movie("movie-goodfellas", "Goodfellas", 1990, ["Crime", "Drama"], 2),
  movie("movie-before-sunrise", "Before Sunrise", 1995, ["Romance", "Drama"], 3),
  movie("movie-fargo", "Fargo", 1996, ["Crime", "Comedy"], 2),
  movie("movie-mulholland-drive", "Mulholland Drive", 2001, ["Thriller", "Drama"], 3),
  movie("movie-city-of-god", "City of God", 2002, ["Crime", "Drama"], 3),
  movie("movie-eternal-sunshine", "Eternal Sunshine of the Spotless Mind", 2004, ["Romance", "Sci-Fi"], 3),
  movie("movie-children-of-men", "Children of Men", 2006, ["Sci-Fi", "Thriller"], 3),
  movie("movie-there-will-be-blood", "There Will Be Blood", 2007, ["Drama"], 3),
  movie("movie-wall-e", "WALL-E", 2008, ["Animation", "Adventure"], 1),
  movie("movie-drive", "Drive", 2011, ["Crime", "Thriller"], 3),
  movie("movie-her", "Her", 2013, ["Romance", "Drama"], 3),
  movie("movie-mad-max-already", "The Tale of the Princess Kaguya", 2013, ["Animation", "Drama"], 4),
  movie("movie-ex-machina", "Ex Machina", 2014, ["Sci-Fi", "Thriller"], 3),
  movie("movie-spotlight", "Spotlight", 2015, ["Drama"], 3),
  movie("movie-the-witch", "The Witch", 2015, ["Horror", "Drama"], 4),
  movie("movie-manchester", "Manchester by the Sea", 2016, ["Drama"], 3),
  movie("movie-call-me-by-your-name", "Call Me by Your Name", 2017, ["Romance", "Drama"], 3),
  movie("movie-roma", "Roma", 2018, ["Drama"], 3),
  movie("movie-un-cut-gems", "Uncut Gems", 2019, ["Thriller", "Crime"], 3),
  movie("movie-nomadland", "Nomadland", 2020, ["Drama"], 3),
  movie("movie-the-power-of-the-dog", "The Power of the Dog", 2021, ["Drama"], 3),
  movie("movie-aftersun", "Aftersun", 2022, ["Drama"], 4),
  movie("movie-anatomy", "Anatomy of a Fall", 2023, ["Thriller", "Drama"], 3),
  movie("movie-the-zone", "The Zone of Interest", 2023, ["Drama"], 4),
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
  game("game-halo", "Halo: Combat Evolved", 2001, ["Action"], 1),
  game("game-wow", "World of Warcraft", 2004, ["RPG"], 1),
  game("game-bioshock", "BioShock", 2007, ["Action", "Adventure"], 2),
  game("game-left-4-dead-2", "Left 4 Dead 2", 2009, ["Action"], 2),
  game("game-dark-souls", "Dark Souls", 2011, ["Action", "RPG"], 2),
  game("game-skyrim", "The Elder Scrolls V: Skyrim", 2011, ["RPG", "Adventure"], 1),
  game("game-journey", "Journey", 2012, ["Adventure", "Indie"], 3),
  game("game-the-witness", "The Witness", 2016, ["Puzzle", "Indie"], 4),
  game("game-overwatch", "Overwatch", 2016, ["Action"], 1),
  game("game-horizon", "Horizon Zero Dawn", 2017, ["Action", "Adventure"], 2),
  game("game-into-the-breach", "Into the Breach", 2018, ["Strategy", "Indie"], 4),
  game("game-sekiro", "Sekiro: Shadows Die Twice", 2019, ["Action", "Adventure"], 2),
  game("game-death-stranding", "Death Stranding", 2019, ["Adventure", "Action"], 3),
  game("game-hades-already", "A Short Hike", 2019, ["Adventure", "Indie"], 4),
  game("game-animal-well", "Animal Well", 2024, ["Puzzle", "Indie"], 4),
  game("game-balatro", "Balatro", 2024, ["Strategy", "Indie"], 2),
  game("game-metaphor", "Metaphor: ReFantazio", 2024, ["RPG"], 3),
];

export const CATALOG: CatalogTitle[] = [...MOVIES, ...GAMES];

export const CATALOG_BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function titlesFor(medium: CatalogTitle["medium"]): CatalogTitle[] {
  return medium === "movie" ? MOVIES : GAMES;
}

export function withReleaseYear(
  title: CatalogTitle,
  releaseYears?: Record<string, number>
): CatalogTitle {
  const year = releaseYears?.[title.id];
  return year != null ? { ...title, year } : title;
}

export function resolveTitle(
  id: string,
  customTitles: CatalogTitle[] = [],
  releaseYears?: Record<string, number>,
  liveTitles: CatalogTitle[] = []
): CatalogTitle | undefined {
  const found =
    customTitles.find((item) => item.id === id) ??
    liveTitles.find((item) => item.id === id) ??
    CATALOG_BY_ID.get(id);
  return found ? withReleaseYear(found, releaseYears) : undefined;
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
