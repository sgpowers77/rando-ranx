import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const csvPath = process.env.MOVIES_METADATA_PATH?.trim() || path.join(process.cwd(), "data", "movies_metadata.csv");
const outPath = path.join(process.cwd(), "public", "movies-index.json");

const GENRE_ALIAS = {
  Animation: "Animation",
  Comedy: "Comedy",
  Family: "Adventure",
  Adventure: "Adventure",
  Action: "Action",
  Crime: "Crime",
  Drama: "Drama",
  Horror: "Horror",
  Romance: "Romance",
  Thriller: "Thriller",
  Mystery: "Thriller",
  Fantasy: "Adventure",
  "Science Fiction": "Sci-Fi",
  War: "Drama",
  Western: "Action",
  History: "Drama",
  Music: "Drama",
  Documentary: "Drama",
  "TV Movie": "Drama",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      continue;
    }
    if (char === "\r") continue;
    field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseGenres(raw) {
  const names = [...raw.matchAll(/'name':\s*'([^']+)'/g)].map((match) => match[1]);
  if (names.length === 0) {
    names.push(...[...raw.matchAll(/"name":\s*"([^"]+)"/g)].map((match) => match[1]));
  }
  return [...new Set(names.map((name) => GENRE_ALIAS[name]).filter(Boolean))];
}

function unitLog(value, high) {
  if (!Number.isFinite(value) || value <= 0 || high <= 0) return 0;
  return Math.min(1, Math.log1p(value) / Math.log1p(high));
}

function obscurityFromSignals({ budget, revenue, popularity, voteCount, voteAverage }) {
  const production = unitLog(budget, 150_000_000);
  const marketing = Math.max(unitLog(popularity, 30), unitLog(revenue, 400_000_000));
  const prestige = unitLog(voteCount, 5_000);
  const sentimentWeight = Math.min(1, Math.log1p(voteCount) / Math.log1p(250));
  const sentiment = sentimentWeight * Math.max(0, Math.min(1, ((voteAverage || 0) - 4.5) / 4.5));
  const fame = 0.3 * production + 0.3 * marketing + 0.25 * prestige + 0.15 * sentiment;
  if (fame >= 0.72) return 1;
  if (fame >= 0.5) return 2;
  if (fame >= 0.32) return 3;
  if (fame >= 0.16) return 4;
  return 5;
}

function spokenHasEnglish(raw) {
  return /'iso_639_1'\s*:\s*'en'|"iso_639_1"\s*:\s*"en"|'name'\s*:\s*'English'|"name"\s*:\s*"English"/i.test(
    raw ?? ""
  );
}

function isEnglishDialogue(origLang, spokenRaw) {
  const orig = (origLang ?? "").trim().toLowerCase();
  if (orig === "en") return true;
  return spokenHasEnglish(spokenRaw);
}

const RATING_Q = {
  Q18665330: "G",
  Q18665334: "PG",
  Q18665339: "PG-13",
  Q18665344: "R",
  Q18665349: "NC-17",
  Q47274658: "NC-17",
  Q29841078: "PG",
  Q50321114: "PG",
  Q29841070: "PG",
};

async function fetchMpaaByImdb() {
  const query = `SELECT ?imdb ?rating WHERE {
    ?film wdt:P345 ?imdb .
    ?film wdt:P1657 ?rating .
  }`;
  try {
    const url = new URL("https://query.wikidata.org/sparql");
    url.searchParams.set("format", "json");
    url.searchParams.set("query", query);
    const res = await fetch(url, {
      headers: { Accept: "application/sparql-results+json", "User-Agent": "RandoRanx/1.0 (mpaa index)" },
    });
    if (!res.ok) throw new Error(`SPARQL HTTP ${res.status}`);
    const data = await res.json();
    const map = new Map();
    for (const row of data.results?.bindings ?? []) {
      const imdb = row.imdb?.value;
      const ratingUri = row.rating?.value ?? "";
      const qid = ratingUri.split("/").pop();
      const mpaa = RATING_Q[qid];
      if (imdb && mpaa) map.set(imdb, mpaa);
    }
    console.log(`Wikidata MPA ratings for ${map.size} IMDb ids`);
    return map;
  } catch (error) {
    console.warn(`Could not load Wikidata MPA ratings: ${error instanceof Error ? error.message : error}`);
    return new Map();
  }
}

async function main() {
  await mkdir(path.dirname(outPath), { recursive: true });
  try {
    await stat(csvPath);
  } catch {
    await writeFile(outPath, JSON.stringify({ source: "missing", movies: [] }));
    console.warn(`No CSV at ${csvPath}; wrote an empty movies-index.json. Rank will use the local fallback.`);
    return;
  }

  const text = await readFile(csvPath, "utf8");
  const rows = parseCsv(text);
  const header = rows[0] ?? [];
  const idx = (name) => header.findIndex((col) => col.trim() === name);
  const iAdult = idx("adult");
  const iGenres = idx("genres");
  const iId = idx("id");
  const iImdb = idx("imdb_id");
  const iPop = idx("popularity");
  const iDate = idx("release_date");
  const iTitle = idx("title");
  const iVotes = idx("vote_count");
  const iBudget = idx("budget");
  const iRevenue = idx("revenue");
  const iVoteAvg = idx("vote_average");
  const iOrigLang = idx("original_language");
  const iSpoken = idx("spoken_languages");

  const mpaaByImdb = await fetchMpaaByImdb();
  const seen = new Set();
  const movies = [];
  for (let r = 1; r < rows.length; r += 1) {
    const cols = rows[r];
    if (!cols || cols.length < header.length - 2) continue;
    if ((cols[iAdult] ?? "").toLowerCase() === "true") continue;
    const title = (cols[iTitle] ?? "").trim();
    if (!title) continue;
    const year = Number((cols[iDate] ?? "").slice(0, 4));
    if (!Number.isFinite(year) || year < 1900 || year > 2030) continue;
    const tmdbId = (cols[iId] ?? "").trim();
    if (!/^\d+$/.test(tmdbId)) continue;
    const id = `tmdb-${tmdbId}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const genres = parseGenres(cols[iGenres] ?? "");
    if (genres.length === 0) genres.push("Drama");
    const popularity = Number(cols[iPop] ?? 0) || 0;
    const voteCount = Number(cols[iVotes] ?? 0) || 0;
    const budget = Number(cols[iBudget] ?? 0) || 0;
    const revenue = Number(cols[iRevenue] ?? 0) || 0;
    const voteAverage = Number(cols[iVoteAvg] ?? 0) || 0;
    const originalLanguage = (cols[iOrigLang] ?? "").trim();
    const en = isEnglishDialogue(originalLanguage, cols[iSpoken] ?? "");
    const imdbId = (cols[iImdb] ?? "").trim();
    const validImdb = /^tt\d+$/.test(imdbId) ? imdbId : undefined;
    movies.push({
      id,
      title,
      year,
      genres,
      obscurity: obscurityFromSignals({ budget, revenue, popularity, voteCount, voteAverage }),
      imdbId: validImdb,
      mpaa: (validImdb && mpaaByImdb.get(validImdb)) || "Not Rated",
      en,
    });
  }

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let english = 0;
  for (const movie of movies) {
    counts[movie.obscurity] += 1;
    if (movie.en) english += 1;
  }
  await writeFile(outPath, JSON.stringify({ source: "dataset", movies }));
  console.log(`Wrote ${outPath} with ${movies.length} movies`);
  console.log(`English-dialogue (orig_lang en or spoken English): ${english}`);
  console.log(`Obscurity buckets 1–5: ${counts[1]} / ${counts[2]} / ${counts[3]} / ${counts[4]} / ${counts[5]}`);
}

await main();
