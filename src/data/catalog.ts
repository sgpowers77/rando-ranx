import type { CatalogTitle } from "@/lib/types";

/** Small local movie list used only if movies_metadata.csv cannot be loaded. */

function movie(
  id: string,
  title: string,
  year: number,
  genres: string[],
  obscurity: CatalogTitle["obscurity"],
  englishDialogue = true
): CatalogTitle {
  return { id, medium: "movie", title, year, genres, obscurity, source: "catalog", englishDialogue };
}

function album(
  id: string,
  title: string,
  year: number,
  genres: string[],
  obscurity: CatalogTitle["obscurity"],
  artist: string
): CatalogTitle {
  return { id, medium: "music", title, year, genres, obscurity, source: "catalog", artist };
}

function game(
  id: string,
  title: string,
  year: number,
  genres: string[],
  obscurity: CatalogTitle["obscurity"],
  platforms: string[]
): CatalogTitle {
  return { id, medium: "game", title, year, genres, obscurity, source: "catalog", platforms };
}

export const MOVIES: CatalogTitle[] = [
  movie("movie-godfather", "The Godfather", 1972, ["Crime", "Drama"], 2),
  movie("movie-parasite", "Parasite", 2019, ["Thriller", "Drama"], 2, false),
  movie("movie-spirited-away", "Spirited Away", 2001, ["Animation", "Adventure"], 2, false),
  movie("movie-pulp-fiction", "Pulp Fiction", 1994, ["Crime", "Drama"], 2),
  movie("movie-get-out", "Get Out", 2017, ["Horror", "Thriller"], 2),
  movie("movie-shawshank", "The Shawshank Redemption", 1994, ["Drama"], 1),
  movie("movie-fury-road", "Mad Max: Fury Road", 2015, ["Action", "Adventure"], 2),
  movie("movie-mood-for-love", "In the Mood for Love", 2000, ["Romance", "Drama"], 4, false),
  movie("movie-dark-knight", "The Dark Knight", 2008, ["Action", "Crime"], 1),
  movie("movie-moonlight", "Moonlight", 2016, ["Drama"], 3),
  movie("movie-alien", "Alien", 1979, ["Horror", "Sci-Fi"], 2),
  movie("movie-eeaao", "Everything Everywhere All at Once", 2022, ["Comedy", "Sci-Fi"], 3),
  movie("movie-casablanca", "Casablanca", 1942, ["Romance", "Drama"], 2),
  movie("movie-pans-labyrinth", "Pan's Labyrinth", 2006, ["Drama", "Thriller"], 3, false),
  movie("movie-whiplash", "Whiplash", 2014, ["Drama"], 3),
  movie("movie-portrait", "Portrait of a Lady on Fire", 2019, ["Romance", "Drama"], 4, false),
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
  movie("movie-tetsuo", "Tetsuo: The Iron Man", 1989, ["Horror", "Sci-Fi"], 5, false),
  movie("movie-pomegranates", "The Color of Pomegranates", 1969, ["Drama"], 5, false),
  movie("movie-jeanne-dielman", "Jeanne Dielman, 23, quai du Commerce, 1080 Bruxelles", 1975, ["Drama"], 5, false),
  movie("movie-seven-samurai", "Seven Samurai", 1954, ["Action", "Drama"], 3, false),
  movie("movie-vertigo", "Vertigo", 1958, ["Thriller", "Romance"], 3),
  movie("movie-jaws", "Jaws", 1975, ["Thriller", "Adventure"], 1),
  movie("movie-blade-runner", "Blade Runner", 1982, ["Sci-Fi", "Thriller"], 2),
  movie("movie-my-neighbor-totoro", "My Neighbor Totoro", 1988, ["Animation", "Adventure"], 2, false),
  movie("movie-goodfellas", "Goodfellas", 1990, ["Crime", "Drama"], 2),
  movie("movie-before-sunrise", "Before Sunrise", 1995, ["Romance", "Drama"], 3),
  movie("movie-fargo", "Fargo", 1996, ["Crime", "Comedy"], 2),
  movie("movie-mulholland-drive", "Mulholland Drive", 2001, ["Thriller", "Drama"], 3),
  movie("movie-city-of-god", "City of God", 2002, ["Crime", "Drama"], 3, false),
  movie("movie-eternal-sunshine", "Eternal Sunshine of the Spotless Mind", 2004, ["Romance", "Sci-Fi"], 3),
  movie("movie-children-of-men", "Children of Men", 2006, ["Sci-Fi", "Thriller"], 3),
  movie("movie-there-will-be-blood", "There Will Be Blood", 2007, ["Drama"], 3),
  movie("movie-wall-e", "WALL-E", 2008, ["Animation", "Adventure"], 1),
  movie("movie-drive", "Drive", 2011, ["Crime", "Thriller"], 3),
  movie("movie-her", "Her", 2013, ["Romance", "Drama"], 3),
  movie("movie-mad-max-already", "The Tale of the Princess Kaguya", 2013, ["Animation", "Drama"], 4, false),
  movie("movie-ex-machina", "Ex Machina", 2014, ["Sci-Fi", "Thriller"], 3),
  movie("movie-spotlight", "Spotlight", 2015, ["Drama"], 3),
  movie("movie-the-witch", "The Witch", 2015, ["Horror", "Drama"], 4),
  movie("movie-manchester", "Manchester by the Sea", 2016, ["Drama"], 3),
  movie("movie-call-me-by-your-name", "Call Me by Your Name", 2017, ["Romance", "Drama"], 3),
  movie("movie-roma", "Roma", 2018, ["Drama"], 3, false),
  movie("movie-un-cut-gems", "Uncut Gems", 2019, ["Thriller", "Crime"], 3),
  movie("movie-nomadland", "Nomadland", 2020, ["Drama"], 3),
  movie("movie-the-power-of-the-dog", "The Power of the Dog", 2021, ["Drama"], 3),
  movie("movie-aftersun", "Aftersun", 2022, ["Drama"], 4),
  movie("movie-anatomy", "Anatomy of a Fall", 2023, ["Thriller", "Drama"], 3, false),
  movie("movie-the-zone", "The Zone of Interest", 2023, ["Drama"], 4),
];

export const GAMES: CatalogTitle[] = [
  game("game-botw", "The Legend of Zelda: Breath of the Wild", 2017, ["Adventure", "Action"], 1, ["Nintendo"]),
  game("game-hades", "Hades", 2020, ["Action", "Indie"], 2, ["PC"]),
  game("game-stardew", "Stardew Valley", 2016, ["Simulation", "Indie"], 2, ["PC"]),
  game("game-elden-ring", "Elden Ring", 2022, ["Action", "RPG"], 1, ["PlayStation", "Xbox", "PC"]),
  game("game-portal-2", "Portal 2", 2011, ["Puzzle", "Action"], 2, ["PC", "PlayStation", "Xbox"]),
  game("game-mario-odyssey", "Super Mario Odyssey", 2017, ["Platformer", "Adventure"], 1, ["Nintendo"]),
  game("game-disco-elysium", "Disco Elysium", 2019, ["RPG", "Indie"], 3, ["PC"]),
  game("game-celeste", "Celeste", 2018, ["Platformer", "Indie"], 3, ["PC", "Nintendo", "PlayStation", "Xbox"]),
  game("game-last-of-us", "The Last of Us", 2013, ["Action", "Adventure"], 1, ["PlayStation"]),
  game("game-minecraft", "Minecraft", 2011, ["Adventure", "Simulation"], 1, ["PC"]),
  game("game-hollow-knight", "Hollow Knight", 2017, ["Action", "Indie"], 3, ["PC"]),
  game("game-bg3", "Baldur's Gate 3", 2023, ["RPG"], 2, ["PC"]),
  game("game-animal-crossing", "Animal Crossing: New Horizons", 2020, ["Simulation"], 1, ["Nintendo"]),
  game("game-rdr2", "Red Dead Redemption 2", 2018, ["Action", "Adventure"], 1, ["PlayStation", "Xbox"]),
  game("game-tetris-effect", "Tetris Effect", 2018, ["Puzzle"], 3, ["PlayStation"]),
  game("game-outer-wilds", "Outer Wilds", 2019, ["Adventure", "Puzzle"], 4, ["PC", "Xbox"]),
  game("game-sf6", "Street Fighter 6", 2023, ["Fighting"], 2, ["PlayStation", "Xbox", "PC"]),
  game("game-undertale", "Undertale", 2015, ["RPG", "Indie"], 2, ["PC"]),
  game("game-god-of-war", "God of War", 2018, ["Action", "Adventure"], 1, ["PlayStation"]),
  game("game-slay-the-spire", "Slay the Spire", 2019, ["Strategy", "Indie"], 3, ["PC"]),
  game("game-super-metroid", "Super Metroid", 1994, ["Action", "Adventure"], 3, ["Nintendo"]),
  game("game-it-takes-two", "It Takes Two", 2021, ["Adventure", "Platformer"], 2, ["PlayStation", "Xbox", "PC"]),
  game("game-persona-5", "Persona 5 Royal", 2019, ["RPG"], 2, ["PlayStation"]),
  game("game-among-us", "Among Us", 2018, ["Indie"], 1, ["Mobile"]),
  game("game-chrono-trigger", "Chrono Trigger", 1995, ["RPG"], 3, ["Nintendo"]),
  game("game-return-of-the-obra-dinn", "Return of the Obra Dinn", 2018, ["Puzzle", "Indie"], 4, ["PC"]),
  game("game-hypnospace", "Hypnospace Outlaw", 2019, ["Adventure", "Indie"], 5, ["PC"]),
  game("game-cruelty-squad", "Cruelty Squad", 2021, ["Action", "Indie"], 5, ["PC"]),
  game("game-baba", "Baba Is You", 2019, ["Puzzle", "Indie"], 4, ["PC", "Nintendo"]),
  game("game-uwu", "Umurangi Generation", 2020, ["Indie", "Simulation"], 5, ["PC", "Nintendo"]),
  game("game-halo", "Halo: Combat Evolved", 2001, ["Action"], 1, ["Xbox"]),
  game("game-wow", "World of Warcraft", 2004, ["RPG"], 1, ["PC"]),
  game("game-bioshock", "BioShock", 2007, ["Action", "Adventure"], 2, ["PC", "Xbox"]),
  game("game-left-4-dead-2", "Left 4 Dead 2", 2009, ["Action"], 2, ["PC", "Xbox"]),
  game("game-dark-souls", "Dark Souls", 2011, ["Action", "RPG"], 2, ["PlayStation", "Xbox"]),
  game("game-skyrim", "The Elder Scrolls V: Skyrim", 2011, ["RPG", "Adventure"], 1, ["PlayStation", "Xbox", "PC"]),
  game("game-journey", "Journey", 2012, ["Adventure", "Indie"], 3, ["PlayStation"]),
  game("game-the-witness", "The Witness", 2016, ["Puzzle", "Indie"], 4, ["PC", "PlayStation", "Xbox"]),
  game("game-overwatch", "Overwatch", 2016, ["Action"], 1, ["PC", "PlayStation", "Xbox"]),
  game("game-horizon", "Horizon Zero Dawn", 2017, ["Action", "Adventure"], 2, ["PlayStation"]),
  game("game-into-the-breach", "Into the Breach", 2018, ["Strategy", "Indie"], 4, ["PC", "Nintendo"]),
  game("game-sekiro", "Sekiro: Shadows Die Twice", 2019, ["Action", "Adventure"], 2, ["PlayStation", "Xbox", "PC"]),
  game("game-death-stranding", "Death Stranding", 2019, ["Adventure", "Action"], 3, ["PlayStation"]),
  game("game-hades-already", "A Short Hike", 2019, ["Adventure", "Indie"], 4, ["PC"]),
  game("game-animal-well", "Animal Well", 2024, ["Puzzle", "Indie"], 4, ["PC", "Nintendo", "PlayStation"]),
  game("game-balatro", "Balatro", 2024, ["Strategy", "Indie"], 2, ["PC"]),
  game("game-metaphor", "Metaphor: ReFantazio", 2024, ["RPG"], 3, ["PlayStation", "Xbox", "PC"]),
];

export const ALBUMS: CatalogTitle[] = [
  album("music-kind-of-blue", "Kind of Blue", 1959, ["Jazz"], 1, "Miles Davis"),
  album("music-abbey-road", "Abbey Road", 1969, ["Rock"], 1, "The Beatles"),
  album("music-whats-going-on", "What's Going On", 1971, ["R&B"], 1, "Marvin Gaye"),
  album("music-blue", "Blue", 1971, ["Folk"], 2, "Joni Mitchell"),
  album("music-songs-in-the-key", "Songs in the Key of Life", 1976, ["R&B", "Pop"], 1, "Stevie Wonder"),
  album("music-rumours", "Rumours", 1977, ["Rock", "Pop"], 1, "Fleetwood Mac"),
  album("music-off-the-wall", "Off the Wall", 1979, ["Pop", "R&B"], 1, "Michael Jackson"),
  album("music-remain-in-light", "Remain in Light", 1980, ["Rock"], 2, "Talking Heads"),
  album("music-thriller", "Thriller", 1982, ["Pop"], 1, "Michael Jackson"),
  album("music-purple-rain", "Purple Rain", 1984, ["Pop", "Rock"], 1, "Prince"),
  album("music-it-takes-a-nation", "It Takes a Nation of Millions to Hold Us Back", 1988, ["Hip-Hop"], 2, "Public Enemy"),
  album("music-the-chronic", "The Chronic", 1992, ["Hip-Hop"], 1, "Dr. Dre"),
  album("music-enter-the-wu", "Enter the Wu-Tang (36 Chambers)", 1993, ["Hip-Hop"], 2, "Wu-Tang Clan"),
  album("music-dummy", "Dummy", 1994, ["Electronic"], 3, "Portishead"),
  album("music-ok-computer", "OK Computer", 1997, ["Rock"], 1, "Radiohead"),
  album("music-homework", "Homework", 1997, ["Electronic"], 2, "Daft Punk"),
  album("music-the-miseducation", "The Miseducation of Lauryn Hill", 1998, ["R&B", "Hip-Hop"], 1, "Lauryn Hill"),
  album("music-kid-a", "Kid A", 2000, ["Electronic", "Rock"], 2, "Radiohead"),
  album("music-is-this-it", "Is This It", 2001, ["Rock"], 2, "The Strokes"),
  album("music-yankee-hotel", "Yankee Hotel Foxtrot", 2002, ["Rock", "Folk"], 3, "Wilco"),
  album("music-speakerboxxx", "Speakerboxxx/The Love Below", 2003, ["Hip-Hop"], 2, "OutKast"),
  album("music-funeral", "Funeral", 2004, ["Rock"], 2, "Arcade Fire"),
  album("music-late-registration", "Late Registration", 2005, ["Hip-Hop"], 1, "Kanye West"),
  album("music-sound-of-silver", "Sound of Silver", 2007, ["Electronic"], 3, "LCD Soundsystem"),
  album("music-in-rainbows", "In Rainbows", 2007, ["Rock"], 2, "Radiohead"),
  album("music-my-beautiful", "My Beautiful Dark Twisted Fantasy", 2010, ["Hip-Hop"], 1, "Kanye West"),
  album("music-channel-orange", "Channel Orange", 2012, ["R&B"], 2, "Frank Ocean"),
  album("music-to-pimp-a-butterfly", "To Pimp a Butterfly", 2015, ["Hip-Hop", "Jazz"], 1, "Kendrick Lamar"),
  album("music-blonde", "Blonde", 2016, ["R&B", "Pop"], 2, "Frank Ocean"),
  album("music-lemonade", "Lemonade", 2016, ["R&B", "Pop"], 1, "Beyoncé"),
  album("music-melodrama", "Melodrama", 2017, ["Pop"], 2, "Lorde"),
  album("music-fetch-the-bolt", "Fetch the Bolt Cutters", 2020, ["Pop", "Folk"], 3, "Fiona Apple"),
  album("music-call-me-if", "Call Me If You Get Lost", 2021, ["Hip-Hop"], 2, "Tyler, the Creator"),
  album("music-dawn-fm", "Dawn FM", 2022, ["Pop", "R&B"], 2, "The Weeknd"),
  album("music-cowboy-carter", "Cowboy Carter", 2024, ["Country", "Pop"], 1, "Beyoncé"),
];

export const CATALOG: CatalogTitle[] = [...MOVIES, ...GAMES, ...ALBUMS];

export const CATALOG_BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function titlesFor(medium: CatalogTitle["medium"]): CatalogTitle[] {
  if (medium === "game") return GAMES;
  if (medium === "music") return ALBUMS;
  return MOVIES;
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
  game("search-hades", "Hades", 2020, ["Action", "Indie"], 2, ["PC"]),
  game("search-outer-wilds", "Outer Wilds", 2019, ["Adventure"], 4, ["PC", "Xbox"]),
  album("search-ok-computer", "OK Computer", 1997, ["Rock"], 1, "Radiohead"),
  album("search-kind-of-blue", "Kind of Blue", 1959, ["Jazz"], 1, "Miles Davis"),
];
