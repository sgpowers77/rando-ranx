import { decadesFor, GAME_GENRES, MOVIE_GENRES, sanitizeFilters } from "@/lib/filters";
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
];

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
    default:
      return moviePreset("star-wars-newbie");
  }
}

function gamePreset(id: string): PathFilters {
  switch (id) {
    case "star-wars-newbie":
      return {
        decades: [2010, 2020],
        genres: ["Adventure", "Action", "Platformer", "RPG"],
        obscurity: [1, 2],
        mpaa: [],
        includeForeign: true,
        stackSize: 50,
      };
    case "that-movie-was-boring":
      return {
        decades: [2000, 2010, 2020],
        genres: ["Action", "Adventure", "Fighting"],
        obscurity: [1, 2, 3],
        mpaa: [],
        includeForeign: true,
        stackSize: 50,
      };
    case "vcr-whats-that":
      return {
        decades: [2010, 2020],
        genres: ["Action", "Adventure", "Platformer", "RPG", "Simulation"],
        obscurity: [1, 2],
        mpaa: [],
        includeForeign: true,
        stackSize: 50,
      };
    case "drive-in":
      return {
        decades: [1970, 1980, 1990],
        genres: ["Action", "Adventure", "Platformer", "Puzzle"],
        obscurity: [1, 2, 3],
        mpaa: [],
        includeForeign: true,
        stackSize: 50,
      };
    case "vcr-rentals":
      return {
        decades: [1980, 1990],
        genres: ["Action", "Adventure", "Platformer", "Fighting", "RPG"],
        obscurity: [1, 2, 3],
        mpaa: [],
        includeForeign: true,
        stackSize: 50,
      };
    case "cannes-ovation":
      return {
        decades: [2010, 2020],
        genres: ["Indie", "Adventure", "Puzzle", "RPG"],
        obscurity: [3, 4, 5],
        mpaa: [],
        includeForeign: true,
        stackSize: 50,
      };
    case "french-one":
      return {
        decades: [2000, 2010, 2020],
        genres: ["Indie", "Adventure", "Puzzle", "Simulation"],
        obscurity: [2, 3, 4, 5],
        mpaa: [],
        includeForeign: true,
        stackSize: 50,
      };
    case "thrills-n-chills":
      return {
        decades: [1990, 2000, 2010, 2020],
        genres: ["Action", "Adventure", "Fighting"],
        obscurity: [1, 2, 3, 4],
        mpaa: [],
        includeForeign: true,
        stackSize: 50,
      };
    case "date-night":
      return {
        decades: [2010, 2020],
        genres: ["Adventure", "Puzzle", "Simulation", "Indie"],
        obscurity: [1, 2, 3],
        mpaa: [],
        includeForeign: true,
        stackSize: 25,
      };
    case "feel-good-only":
      return {
        decades: [2010, 2020],
        genres: ["Adventure", "Platformer", "Simulation", "Puzzle"],
        obscurity: [1, 2],
        mpaa: [],
        includeForeign: true,
        stackSize: 50,
      };
    case "no-subtitles":
      return {
        decades: [2010, 2020],
        genres: ["Action", "Adventure", "Platformer", "Simulation"],
        obscurity: [1, 2],
        mpaa: [],
        includeForeign: true,
        stackSize: 50,
      };
    case "technicolor-ruined":
      return {
        decades: [1970],
        genres: ["Action", "Adventure", "Puzzle", "Platformer"],
        obscurity: [2, 3, 4],
        mpaa: [],
        includeForeign: true,
        stackSize: 50,
      };
    default:
      return gamePreset("star-wars-newbie");
  }
}

export function filtersForPreset(id: string, medium: Medium): PathFilters {
  const raw = medium === "movie" ? moviePreset(id) : gamePreset(id);
  const allowed = new Set(decadesFor(medium));
  const decades = raw.decades.filter((decade) => allowed.has(decade));
  const allowedGenres = new Set(medium === "movie" ? MOVIE_GENRES : GAME_GENRES);
  const genres = raw.genres.filter((genre) => allowedGenres.has(genre as never));
  return sanitizeFilters(
    {
      ...raw,
      decades: decades.length > 0 ? decades : [...decadesFor(medium)],
      genres: genres.length > 0 ? genres : [...allowedGenres],
    },
    medium
  );
}
