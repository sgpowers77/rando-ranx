import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const dest = path.join(process.cwd(), "data", "music", "release-groups.json");
const UA = "RandoRanx/1.0 ( https://github.com/sgpowers77/rando-ranx ; album catalog )";
const BASE = "https://musicbrainz.org/ws/2/release-group";

const QUERIES = [
  'primarytype:album AND tag:rock',
  'primarytype:album AND tag:pop',
  'primarytype:album AND tag:"hip hop"',
  'primarytype:album AND tag:jazz',
  'primarytype:album AND tag:electronic',
  'primarytype:album AND tag:classical',
  'primarytype:album AND tag:country',
  'primarytype:album AND tag:soul',
  'primarytype:album AND tag:folk',
  'primarytype:album AND tag:metal',
  'primarytype:album AND firstreleasedate:[1960 TO 1969]',
  'primarytype:album AND firstreleasedate:[1970 TO 1979]',
  'primarytype:album AND firstreleasedate:[1980 TO 1989]',
  'primarytype:album AND firstreleasedate:[1990 TO 1999]',
  'primarytype:album AND firstreleasedate:[2000 TO 2009]',
  'primarytype:album AND firstreleasedate:[2010 TO 2026]',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function search(query, offset) {
  const url = new URL(BASE);
  url.searchParams.set("query", query);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", String(offset));
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`MusicBrainz HTTP ${res.status} for ${query} offset ${offset}`);
  return res.json();
}

try {
  const info = await stat(dest);
  if (info.isFile() && info.size > 50_000) {
    console.log(`Using existing ${dest} (${info.size} bytes)`);
    process.exit(0);
  }
} catch {
  // fetch
}

const byId = new Map();
for (const query of QUERIES) {
  for (const offset of [0, 100]) {
    try {
      const data = await search(query, offset);
      const rows = data["release-groups"] ?? data.releaseGroups ?? [];
      for (const row of rows) {
        if (row?.id && !byId.has(row.id)) byId.set(row.id, row);
      }
      console.log(`MusicBrainz ${query} offset ${offset}: ${rows.length} (unique ${byId.size})`);
    } catch (error) {
      console.warn(error instanceof Error ? error.message : error);
    }
    await sleep(1100);
  }
}

await mkdir(path.dirname(dest), { recursive: true });
const albums = [...byId.values()];
await writeFile(dest, JSON.stringify({ source: "musicbrainz", fetchedAt: new Date().toISOString(), albums }));
console.log(`Wrote ${dest} with ${albums.length} release groups`);
if (albums.length === 0) {
  console.warn("No MusicBrainz rows; build-music-index will fall back to the local album list.");
}
