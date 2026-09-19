import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const dumpPath =
  process.env.MUSICBRAINZ_DUMP_PATH?.trim() || path.join(process.cwd(), "data", "music", "release-groups.json");
const outPath = path.join(process.cwd(), "public", "music-index.json");

const GENRE_RULES = [
  { genre: "Hip-Hop", test: /hip[\s-]*hop|\brap\b|trap|grime/ },
  { genre: "R&B", test: /r&b|rnb|soul|funk|motown/ },
  { genre: "Metal", test: /metal|hardcore punk/ },
  { genre: "Electronic", test: /electronic|techno|house|ambient|edm|synth|disco|idm/ },
  { genre: "Classical", test: /classical|opera|orchestr|symphony|baroque/ },
  { genre: "Country", test: /country|americana|bluegrass/ },
  { genre: "Jazz", test: /jazz|bebop|swing/ },
  { genre: "Folk", test: /folk|singer[\s-]*songwriter|bluegrass/ },
  { genre: "Pop", test: /\bpop\b|synthpop|dance pop/ },
  { genre: "Rock", test: /rock|punk|grunge|indie|alternative|britpop/ },
];

function mapGenres(tags) {
  const blob = (tags ?? []).map((tag) => String(tag?.name ?? tag ?? "").toLowerCase()).join(" | ");
  const found = [];
  for (const rule of GENRE_RULES) {
    if (rule.test.test(blob) && !found.includes(rule.genre)) found.push(rule.genre);
  }
  return found.length > 0 ? found.slice(0, 3) : ["Rock"];
}

function artistName(row) {
  const credits = row["artist-credit"] ?? row.artistCredit ?? [];
  if (!Array.isArray(credits) || credits.length === 0) return "";
  return credits
    .map((part) => `${part.name ?? part.artist?.name ?? ""}${part.joinphrase ?? ""}`)
    .join("")
    .trim();
}

function parseYear(row) {
  const raw = String(row["first-release-date"] ?? row.firstReleaseDate ?? "").slice(0, 4);
  const year = Number(raw);
  if (!Number.isFinite(year) || year < 1950 || year > 2030) return null;
  return year;
}

function obscurityFromRow(row) {
  const rating = row.rating ?? {};
  const votes = Number(rating["votes-count"] ?? rating.votesCount) || 0;
  const value = Number(rating.value) || 0;
  if (votes >= 40 && value >= 4.2) return 1;
  if (votes >= 20) return 2;
  if (votes >= 8) return 3;
  if (votes >= 2) return 4;
  const tagWeight = (row.tags ?? []).reduce((sum, tag) => sum + (Number(tag.count) || 1), 0);
  if (tagWeight >= 25) return 1;
  if (tagWeight >= 12) return 2;
  if (tagWeight >= 5) return 3;
  if (tagWeight >= 2) return 4;
  return 5;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

await mkdir(path.dirname(outPath), { recursive: true });
if (!(await exists(dumpPath))) {
  await writeFile(outPath, JSON.stringify({ source: "missing", albums: [] }));
  console.warn(`No dump at ${dumpPath}; wrote an empty music-index.json.`);
  process.exit(0);
}

const dump = JSON.parse(await readFile(dumpPath, "utf8"));
const rows = dump.albums ?? dump["release-groups"] ?? [];
const seen = new Set();
const albums = [];
for (const row of rows) {
  const mbid = row?.id;
  if (!mbid || seen.has(mbid)) continue;
  const title = String(row.title ?? "").trim();
  const year = parseYear(row);
  const primary = String(row["primary-type"] ?? row.primaryType ?? "Album");
  if (!title || !year) continue;
  if (/single|ep|broadcast|other/i.test(primary) && !/^album$/i.test(primary)) continue;
  seen.add(mbid);
  albums.push({
    id: `mbid-${mbid}`,
    title,
    year,
    artist: artistName(row) || undefined,
    genres: mapGenres(row.tags ?? []),
    obscurity: obscurityFromRow(row),
    musicbrainzId: mbid,
    imageUrl: `https://coverartarchive.org/release-group/${mbid}/front-250`,
  });
}

albums.sort((a, b) => a.title.localeCompare(b.title) || a.year - b.year);
const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
for (const album of albums) counts[album.obscurity] += 1;
await writeFile(outPath, JSON.stringify({ source: albums.length > 0 ? "dataset" : "missing", albums }));
console.log(`Wrote ${outPath} with ${albums.length} albums`);
console.log(`Obscurity buckets 1–5: ${counts[1]} / ${counts[2]} / ${counts[3]} / ${counts[4]} / ${counts[5]}`);
