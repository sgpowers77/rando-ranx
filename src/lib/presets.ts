import { decadesFor, GAME_GENRES, GAME_PLATFORMS, MOVIE_GENRES, sanitizeFilters } from "@/lib/filters";
import type { Medium, PathFilters } from "@/lib/types";

export type TourneyPreset = {
  id: string;
  title: string;
  blurb: string;
};

export const TOURNEY_PRESETS: TourneyPreset[] = [
  {
    id: "star-wars-newbie",
    title: "Haven't watched Star Wars or anything really",
    blurb: "Friendly, widely seen crowd-pleasers. Easy jumping-on point.",
  },
  {
    id: "that-movie-was-boring",
    title: "That Movie was Boring",
    blurb: "Skip the slow burn. Action, thrills, and spectacle.",
  },
  {
    id: "vcr-whats-that",
    title: "VCR? What's that?",
    blurb: "2000s onward. Streaming-era hits, not tape-era deep cuts.",
  },
  {
    id: "drive-in",
    title: "Lets Go to the Drive In",
    blurb: "Hot nights, double features, and mid-century theatrical fun.",
  },
  {
    id: "vcr-rentals",
    title: "VCR Rentals",
    blurb: "Friday-night tape energy from the '80s and '90s.",
  },
  {
    id: "cannes-ovation",
    title: "20 Minute Standing Ovation at Cannes",
    blurb: "Festival prestige, arthouse, and films people clap at.",
  },
  {
    id: "french-one",
    title: "The French One Was Better",
    blurb: "Non-English and worldly titles welcome. The remake can wait.",
  },
  {
    id: "thrills-n-chills",
    title: "Thrills N Chills",
    blurb: "Horror and thriller. Jump scares, dread, and late-night nerves.",
  },
  {
    id: "date-night",
    title: "Date Night",
    blurb: "Romance and comedy you can actually sit through together.",
  },
  {
    id: "feel-good-only",
    title: "Feel Good Only",
    blurb: "No grimdark. Comedy, adventure, animation, and warmth.",
  },
  {
    id: "no-subtitles",
    title: "I Don’t Like Subtitles… or Thinking",
    blurb: "English dialogue only. Big, easy crowd-pleasers. No homework.",
  },
  {
    id: "technicolor-ruined",
    title: "Technicolor Ruined Cinema",
    blurb: "Studio-era decades before color took over. 1940s is as early as the catalog goes.",
  },
  {
    id: "blood-n-guts",
    title: "Blood N' Guts",
    blurb: "Horror, crime, and the kind of action that needs a mop.",
  },
  {
    id: "high-brow-hits",
    title: "High Brow Hits",
    blurb: "Widely seen prestige. Drama people pretend they saw in theaters.",
  },
  {
    id: "low-brow-laughs",
    title: "Low Brow Laughs",
    blurb: "English-language comedy. Jokes first. Themes later. Maybe never.",
  },
  {
    id: "oscar-bait",
    title: "Oscar Bait and Switch",
    blurb: "Serious drama with award-season lighting. Bring a thought, not popcorn.",
  },
  {
    id: "kids-table",
    title: "Kids Table, Adults Pay",
    blurb: "G and PG animation, adventure, and comedy. You bought the tickets.",
  },
  {
    id: "direct-to-video",
    title: "Direct-to-Video Energy",
    blurb: "Little-seen '80s–'00s tapes. The cover art promised more than the runtime.",
  },
  {
    id: "because-of-lawyers",
    title: "They Don't Make 'Em Because of Lawyers",
    blurb: "1970s–80s R-rated chaos. Insurance had not entered the chat.",
  },
  {
    id: "airport-movie",
    title: "Airport Movie Syndrome",
    blurb: "English crowd-pleasers you could finish between boarding and baggage.",
  },
  {
    id: "walmart-dvd",
    title: "Walmart DVD Bin Royalty",
    blurb: "2000s leftovers. Three-dollar cases, five-dollar plots.",
  },
  {
    id: "cgi-entered-chat",
    title: "CGI Has Entered the Chat",
    blurb: "2000s onward spectacle. If it can explode in pixels, it will.",
  },
];

export const GAME_PRESETS: TourneyPreset[] = [
  {
    id: "nintendo-direct",
    title: "Nintendo Direct Fodder",
    blurb: "First-party energy. Platformers, adventures, and island life on Nintendo hardware.",
  },
  {
    id: "playstation-prestige",
    title: "PlayStation Prestige",
    blurb: "Big first-party set pieces. You will talk about the set dressing.",
  },
  {
    id: "xbox-launch-night",
    title: "Xbox Launch Night",
    blurb: "Green-box era shooters and the living-room LAN that followed.",
  },
  {
    id: "pc-master-race",
    title: "PC Master Race, Apparently",
    blurb: "Mouse, keyboard, and a settings menu longer than the campaign.",
  },
  {
    id: "handheld-back-seat",
    title: "Handheld in the Back Seat",
    blurb: "Cartridge RPGs and Metroidvania homework on Nintendo hardware.",
  },
  {
    id: "keyboard-mouse",
    title: "Keyboard and Mouse Only",
    blurb: "Strategy, puzzles, and sims that hate a thumbstick.",
  },
  {
    id: "souls-borne",
    title: "Souls-Borne and Suffering",
    blurb: "You will die. Then you will die with a build. Consoles and PC welcome.",
  },
  {
    id: "itch-until-dawn",
    title: "Itch.io Until Dawn",
    blurb: "Little-seen PC indies. Wishlist later. Play now.",
  },
  {
    id: "fight-stick-tax",
    title: "Fight Stick Tax",
    blurb: "Versus fighters on PlayStation, Xbox, and PC. Neutral jump, then mash.",
  },
  {
    id: "cozy-stardew",
    title: "Cozy Stardew Hours",
    blurb: "Farms, islands, and low-stakes loops. PC or Nintendo on the couch.",
  },
  {
    id: "puzzle-until-2am",
    title: "Puzzle Until 2am",
    blurb: "One more gate. One more rule. PC and Nintendo brain-breakers.",
  },
  {
    id: "jrpg-homework",
    title: "JRPG Homework",
    blurb: "Menus, jobs, and a 40-hour side quest. Nintendo and PlayStation first.",
  },
  {
    id: "cartridge-era",
    title: "Cartridge Era Only",
    blurb: "1990s Nintendo silicon. Blow on it if you must.",
  },
  {
    id: "split-screen",
    title: "Split-Screen Arguments",
    blurb: "Action and fighting you can lose a friendship over. Living-room hardware.",
  },
  {
    id: "one-more-run",
    title: "One More Run",
    blurb: "Roguelikes and deckbuilders on PC. The run is never the last run.",
  },
  {
    id: "open-world-hangover",
    title: "Open World Hangover",
    blurb: "Map icons, horse physics, and a main quest you keep postponing.",
  },
  {
    id: "phone-battery-tax",
    title: "Phone Battery Tax",
    blurb: "First shipped on a phone. Play between levels of real life.",
  },
  {
    id: "early-access-forever",
    title: "Early Access Forever",
    blurb: "PC indies that shipped a roadmap and a dream. Patch notes are the plot.",
  },
  {
    id: "trophy-hunting",
    title: "Trophy Hunting Season",
    blurb: "PlayStation first. Platinum or bust. The last 2% will hurt.",
  },
  {
    id: "gamerscore",
    title: "Gamerscore Doesn't Count",
    blurb: "Xbox action from the 360 years. The achievement popped. The pride did not.",
  },
  {
    id: "couch-co-op",
    title: "Couch Co-Op Night",
    blurb: "Platformers and adventures for two on the same TV. Pass the second pad.",
  },
  {
    id: "day-one-patch",
    title: "AAA Day-One Patch",
    blurb: "2020s spectacle on PlayStation, Xbox, and PC. Download size TBD.",
  },
];

export type PresetGroup = {
  id: string;
  title: string;
  presetIds: string[];
};

export const MOVIE_PRESET_GROUPS: PresetGroup[] = [
  {
    id: "easy-night",
    title: "Easy Night In",
    presetIds: ["star-wars-newbie", "no-subtitles", "feel-good-only", "kids-table", "airport-movie"],
  },
  {
    id: "time-warp",
    title: "Time Warp",
    presetIds: ["vcr-whats-that", "drive-in", "vcr-rentals", "technicolor-ruined", "cgi-entered-chat"],
  },
  {
    id: "prestige",
    title: "Prestige Homework",
    presetIds: ["cannes-ovation", "french-one", "high-brow-hits", "oscar-bait"],
  },
  {
    id: "guts",
    title: "Guts & Jump Scares",
    presetIds: ["that-movie-was-boring", "thrills-n-chills", "blood-n-guts", "because-of-lawyers"],
  },
  {
    id: "bargain",
    title: "Jokes, Tapes & Bargain Bins",
    presetIds: ["date-night", "low-brow-laughs", "direct-to-video", "walmart-dvd"],
  },
];

export const GAME_PRESET_GROUPS: PresetGroup[] = [
  {
    id: "first-party",
    title: "First-Party Hardware",
    presetIds: [
      "nintendo-direct",
      "playstation-prestige",
      "xbox-launch-night",
      "trophy-hunting",
      "gamerscore",
    ],
  },
  {
    id: "pc-phone",
    title: "PC, Peripherals & Phones",
    presetIds: [
      "pc-master-race",
      "keyboard-mouse",
      "itch-until-dawn",
      "early-access-forever",
      "phone-battery-tax",
    ],
  },
  {
    id: "cartridges",
    title: "Cartridges & Handhelds",
    presetIds: ["handheld-back-seat", "cartridge-era", "jrpg-homework"],
  },
  {
    id: "git-gud",
    title: "Git Gud Hours",
    presetIds: ["souls-borne", "fight-stick-tax", "one-more-run", "split-screen", "puzzle-until-2am"],
  },
  {
    id: "couch-map",
    title: "Couch Night & Open World",
    presetIds: ["cozy-stardew", "couch-co-op", "open-world-hangover", "day-one-patch"],
  },
];

export function groupedPresets(medium: Medium): { group: PresetGroup; presets: TourneyPreset[] }[] {
  const list = medium === "game" ? GAME_PRESETS : TOURNEY_PRESETS;
  const byId = new Map(list.map((preset) => [preset.id, preset]));
  const groups = medium === "game" ? GAME_PRESET_GROUPS : MOVIE_PRESET_GROUPS;
  return groups.map((group) => ({
    group,
    presets: group.presetIds
      .map((id) => byId.get(id))
      .filter((preset): preset is TourneyPreset => preset != null),
  }));
}

function moviePreset(id: string): PathFilters {
  switch (id) {
    case "star-wars-newbie":
      return {
        decades: [1990, 2000, 2010, 2020],
        genres: ["Action", "Adventure", "Animation", "Comedy", "Sci-Fi"],
        obscurity: [1, 2],
        mpaa: ["G", "PG", "PG-13"],
        includeForeign: false,
        stackSize: 50,
      };
    case "that-movie-was-boring":
      return {
        decades: [1980, 1990, 2000, 2010, 2020],
        genres: ["Action", "Adventure", "Horror", "Sci-Fi", "Thriller"],
        obscurity: [1, 2, 3],
        mpaa: ["PG-13", "R", "NC-17"],
        includeForeign: true,
        stackSize: 50,
      };
    case "vcr-whats-that":
      return {
        decades: [2000, 2010, 2020],
        genres: ["Action", "Adventure", "Animation", "Comedy", "Sci-Fi"],
        obscurity: [1, 2],
        mpaa: ["G", "PG", "PG-13"],
        includeForeign: false,
        stackSize: 50,
      };
    case "drive-in":
      return {
        decades: [1950, 1960, 1970],
        genres: ["Action", "Adventure", "Horror", "Romance", "Sci-Fi", "Thriller"],
        obscurity: [1, 2, 3],
        mpaa: ["G", "PG", "PG-13", "R", "Not Rated"],
        includeForeign: true,
        stackSize: 50,
      };
    case "vcr-rentals":
      return {
        decades: [1980, 1990],
        genres: ["Action", "Adventure", "Comedy", "Horror", "Sci-Fi", "Thriller"],
        obscurity: [1, 2, 3],
        mpaa: ["PG", "PG-13", "R"],
        includeForeign: false,
        stackSize: 50,
      };
    case "cannes-ovation":
      return {
        decades: [1960, 1970, 1980, 1990, 2000, 2010, 2020],
        genres: ["Drama", "Romance", "Thriller"],
        obscurity: [3, 4, 5],
        mpaa: ["PG-13", "R", "Not Rated"],
        includeForeign: true,
        stackSize: 50,
      };
    case "french-one":
      return {
        decades: [1960, 1970, 1980, 1990, 2000, 2010, 2020],
        genres: ["Drama", "Romance", "Thriller", "Animation", "Comedy"],
        obscurity: [2, 3, 4, 5],
        mpaa: ["PG", "PG-13", "R", "Not Rated"],
        includeForeign: true,
        stackSize: 50,
      };
    case "thrills-n-chills":
      return {
        decades: [1970, 1980, 1990, 2000, 2010, 2020],
        genres: ["Horror", "Thriller"],
        obscurity: [1, 2, 3, 4],
        mpaa: ["PG-13", "R", "NC-17", "Not Rated"],
        includeForeign: true,
        stackSize: 50,
      };
    case "date-night":
      return {
        decades: [1990, 2000, 2010, 2020],
        genres: ["Comedy", "Romance", "Drama"],
        obscurity: [1, 2, 3],
        mpaa: ["PG", "PG-13", "R"],
        includeForeign: true,
        stackSize: 25,
      };
    case "feel-good-only":
      return {
        decades: [1980, 1990, 2000, 2010, 2020],
        genres: ["Comedy", "Animation", "Adventure", "Romance"],
        obscurity: [1, 2],
        mpaa: ["G", "PG", "PG-13"],
        includeForeign: true,
        stackSize: 50,
      };
    case "no-subtitles":
      return {
        decades: [1990, 2000, 2010, 2020],
        genres: ["Action", "Adventure", "Animation", "Comedy", "Sci-Fi"],
        obscurity: [1, 2],
        mpaa: ["G", "PG", "PG-13"],
        includeForeign: false,
        stackSize: 50,
      };
    case "technicolor-ruined":
      return {
        decades: [1940],
        genres: ["Drama", "Romance", "Crime", "Comedy", "Thriller"],
        obscurity: [1, 2, 3, 4],
        mpaa: ["G", "PG", "Not Rated"],
        includeForeign: true,
        stackSize: 50,
      };
    case "blood-n-guts":
      return {
        decades: [1970, 1980, 1990, 2000, 2010, 2020],
        genres: ["Horror", "Crime", "Action", "Thriller"],
        obscurity: [1, 2, 3, 4],
        mpaa: ["R", "NC-17", "Not Rated"],
        includeForeign: true,
        stackSize: 50,
      };
    case "high-brow-hits":
      return {
        decades: [1960, 1970, 1980, 1990, 2000, 2010, 2020],
        genres: ["Drama", "Romance", "Thriller"],
        obscurity: [1, 2],
        mpaa: ["PG-13", "R", "Not Rated"],
        includeForeign: true,
        stackSize: 50,
      };
    case "low-brow-laughs":
      return {
        decades: [1980, 1990, 2000, 2010, 2020],
        genres: ["Comedy"],
        obscurity: [1, 2, 3],
        mpaa: ["PG", "PG-13", "R"],
        includeForeign: false,
        stackSize: 50,
      };
    case "oscar-bait":
      return {
        decades: [1990, 2000, 2010, 2020],
        genres: ["Drama"],
        obscurity: [2, 3, 4],
        mpaa: ["PG-13", "R", "Not Rated"],
        includeForeign: true,
        stackSize: 25,
      };
    case "kids-table":
      return {
        decades: [1990, 2000, 2010, 2020],
        genres: ["Animation", "Adventure", "Comedy"],
        obscurity: [1, 2],
        mpaa: ["G", "PG"],
        includeForeign: true,
        stackSize: 50,
      };
    case "direct-to-video":
      return {
        decades: [1980, 1990, 2000],
        genres: ["Action", "Horror", "Crime", "Thriller"],
        obscurity: [4, 5],
        mpaa: ["PG-13", "R", "Not Rated"],
        includeForeign: false,
        stackSize: 50,
      };
    case "because-of-lawyers":
      return {
        decades: [1970, 1980],
        genres: ["Action", "Crime", "Horror", "Thriller"],
        obscurity: [1, 2, 3],
        mpaa: ["R", "NC-17", "Not Rated"],
        includeForeign: true,
        stackSize: 50,
      };
    case "airport-movie":
      return {
        decades: [2000, 2010, 2020],
        genres: ["Comedy", "Adventure", "Romance", "Action"],
        obscurity: [1, 2],
        mpaa: ["G", "PG", "PG-13"],
        includeForeign: false,
        stackSize: 25,
      };
    case "walmart-dvd":
      return {
        decades: [2000, 2010],
        genres: ["Action", "Comedy", "Horror", "Sci-Fi"],
        obscurity: [3, 4, 5],
        mpaa: ["PG-13", "R"],
        includeForeign: false,
        stackSize: 50,
      };
    case "cgi-entered-chat":
      return {
        decades: [2000, 2010, 2020],
        genres: ["Action", "Adventure", "Animation", "Sci-Fi"],
        obscurity: [1, 2],
        mpaa: ["PG", "PG-13"],
        includeForeign: true,
        stackSize: 100,
      };
    default:
      return moviePreset("star-wars-newbie");
  }
}

function gameFilters(
  partial: Pick<PathFilters, "decades" | "genres" | "obscurity" | "platforms"> &
    Partial<Pick<PathFilters, "stackSize">>
): PathFilters {
  return {
    mpaa: [],
    includeForeign: true,
    stackSize: 50,
    ...partial,
  };
}

function gamePreset(id: string): PathFilters {
  switch (id) {
    case "nintendo-direct":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Platformer", "Adventure", "Simulation", "Action"],
        obscurity: [1, 2],
        platforms: ["Nintendo"],
      });
    case "playstation-prestige":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Action", "Adventure", "RPG"],
        obscurity: [1, 2],
        platforms: ["PlayStation"],
      });
    case "xbox-launch-night":
      return gameFilters({
        decades: [2000, 2010],
        genres: ["Action", "Adventure"],
        obscurity: [1, 2],
        platforms: ["Xbox"],
      });
    case "pc-master-race":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Action", "Adventure", "Indie", "RPG", "Simulation"],
        obscurity: [1, 2, 3],
        platforms: ["PC"],
      });
    case "handheld-back-seat":
      return gameFilters({
        decades: [1990],
        genres: ["RPG", "Adventure", "Action"],
        obscurity: [1, 2, 3],
        platforms: ["Nintendo"],
      });
    case "keyboard-mouse":
      return gameFilters({
        decades: [2000, 2010, 2020],
        genres: ["Strategy", "Puzzle", "Simulation"],
        obscurity: [2, 3, 4],
        platforms: ["PC"],
      });
    case "souls-borne":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Action", "RPG"],
        obscurity: [1, 2, 3],
        platforms: ["PlayStation", "Xbox", "PC"],
      });
    case "itch-until-dawn":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Indie", "Adventure", "Puzzle"],
        obscurity: [3, 4, 5],
        platforms: ["PC"],
      });
    case "fight-stick-tax":
      return gameFilters({
        decades: [2000, 2010, 2020],
        genres: ["Fighting"],
        obscurity: [1, 2, 3],
        platforms: ["PlayStation", "Xbox", "PC"],
      });
    case "cozy-stardew":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Simulation", "Indie"],
        obscurity: [1, 2, 3],
        platforms: ["PC", "Nintendo"],
      });
    case "puzzle-until-2am":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Puzzle"],
        obscurity: [2, 3, 4, 5],
        platforms: ["PC", "Nintendo"],
      });
    case "jrpg-homework":
      return gameFilters({
        decades: [1990, 2000, 2010, 2020],
        genres: ["RPG"],
        obscurity: [1, 2, 3],
        platforms: ["Nintendo", "PlayStation"],
      });
    case "cartridge-era":
      return gameFilters({
        decades: [1990],
        genres: ["Action", "Adventure", "RPG", "Platformer"],
        obscurity: [2, 3, 4],
        platforms: ["Nintendo"],
      });
    case "split-screen":
      return gameFilters({
        decades: [2000, 2010, 2020],
        genres: ["Action", "Fighting"],
        obscurity: [1, 2],
        platforms: ["Xbox", "PlayStation", "Nintendo"],
      });
    case "one-more-run":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Indie", "Strategy", "Action"],
        obscurity: [2, 3, 4],
        platforms: ["PC"],
      });
    case "open-world-hangover":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Action", "Adventure", "RPG"],
        obscurity: [1, 2],
        platforms: ["PlayStation", "Xbox", "PC"],
        stackSize: 25,
      });
    case "phone-battery-tax":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Indie", "Simulation", "Puzzle"],
        obscurity: [1, 2, 3],
        platforms: ["Mobile"],
      });
    case "early-access-forever":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Indie"],
        obscurity: [3, 4, 5],
        platforms: ["PC"],
      });
    case "trophy-hunting":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Action", "Adventure"],
        obscurity: [1, 2],
        platforms: ["PlayStation"],
      });
    case "gamerscore":
      return gameFilters({
        decades: [2000, 2010],
        genres: ["Action", "Adventure"],
        obscurity: [1, 2],
        platforms: ["Xbox"],
      });
    case "couch-co-op":
      return gameFilters({
        decades: [2010, 2020],
        genres: ["Platformer", "Adventure", "Puzzle"],
        obscurity: [1, 2, 3],
        platforms: ["Nintendo", "PlayStation", "Xbox"],
        stackSize: 25,
      });
    case "day-one-patch":
      return gameFilters({
        decades: [2020],
        genres: ["Action", "Adventure", "RPG"],
        obscurity: [1, 2],
        platforms: ["PlayStation", "Xbox", "PC"],
        stackSize: 100,
      });
    default:
      return gamePreset("nintendo-direct");
  }
}

export function filtersForPreset(id: string, medium: Medium): PathFilters {
  const raw = medium === "movie" ? moviePreset(id) : gamePreset(id);
  const allowed = new Set(decadesFor(medium));
  const decades = raw.decades.filter((decade) => allowed.has(decade));
  const allowedGenres = new Set(medium === "movie" ? MOVIE_GENRES : GAME_GENRES);
  const genres = raw.genres.filter((genre) => allowedGenres.has(genre as never));
  const allowedPlatforms = new Set(GAME_PLATFORMS);
  const platforms =
    medium === "game"
      ? (raw.platforms ?? []).filter((platform) => allowedPlatforms.has(platform as never))
      : [];
  return sanitizeFilters(
    {
      ...raw,
      decades: decades.length > 0 ? decades : [...decadesFor(medium)],
      genres: genres.length > 0 ? genres : [...allowedGenres],
      platforms: medium === "game" ? (platforms.length > 0 ? platforms : [...GAME_PLATFORMS]) : [],
    },
    medium
  );
}
