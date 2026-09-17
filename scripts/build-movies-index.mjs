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

function obscurityFrom(popularity, voteCount) {
  if (voteCount >= 4000 || popularity >= 25) return 1;
  if (voteCount >= 1200 || popularity >= 12) return 2;
  if (voteCount >= 300 || popularity >= 6) return 3;
  if (voteCount >= 60 || popularity >= 2) return 4;
  return 5;
}

async function main() {
  await mkdir(path.dirname(outPath), { recursive: true });
  try {
    const csvInfo = await stat(csvPath);
    try {
      const outInfo = await stat(outPath);
      if (outInfo.isFile() && outInfo.mtimeMs >= csvInfo.mtimeMs && outInfo.size > 100_000) {
        console.log(`movies-index.json is up to date (${outInfo.size} bytes)`);
        return;
      }
    } catch {
      // rebuild
    }
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
    const imdbId = (cols[iImdb] ?? "").trim();
    movies.push({
      id,
      title,
      year,
      genres,
      obscurity: obscurityFrom(popularity, voteCount),
      imdbId: /^tt\d+$/.test(imdbId) ? imdbId : undefined,
    });
  }

  await writeFile(outPath, JSON.stringify({ source: "dataset", movies }));
  console.log(`Wrote ${outPath} with ${movies.length} movies`);
}

await main();
