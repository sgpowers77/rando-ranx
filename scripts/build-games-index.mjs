import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const dataRoot = process.env.GAMES_DATA_DIR?.trim() || path.join(process.cwd(), "data", "games");
const ogdbRoot = path.join(dataRoot, "opengamedb");
const gamedexRoot = path.join(dataRoot, "gamedex");
const outPath = path.join(process.cwd(), "public", "games-index.json");

const GAME_GENRES = [
  "Action",
  "Adventure",
  "Fighting",
  "Indie",
  "Platformer",
  "Puzzle",
  "RPG",
  "Simulation",
  "Strategy",
];

const FILE_PLATFORM = {
  "32x": "Other",
  arcade: "Other",
  atari_2600: "Other",
  atari_5200: "Other",
  atari_7800: "Other",
  atari_8_bit_family: "Other",
  dreamcast: "Other",
  game_boy: "Nintendo",
  game_boy_advance: "Nintendo",
  game_boy_color: "Nintendo",
  gamecube: "Nintendo",
  game_gear: "Other",
  master_system: "Other",
  mega_drive: "Other",
  nintendo_3ds: "Nintendo",
  nintendo_64: "Nintendo",
  nintendo_ds: "Nintendo",
  nintendo_entertainment_system: "Nintendo",
  nintendo_switch: "Nintendo",
  pc: "PC",
  playstation: "PlayStation",
  playstation_2: "PlayStation",
  playstation_3: "PlayStation",
  playstation_portable: "PlayStation",
  playstation_vita: "PlayStation",
  sega_cd: "Other",
  sega_saturn: "Other",
  steam: "PC",
  super_nintendo_entertainment_system: "Nintendo",
  "turbografx-16": "Other",
  wii: "Nintendo",
  wii_u: "Nintendo",
  xbox: "Xbox",
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

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function identityKey(title, year) {
  const name = String(title ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[™®©]/g, "")
    .replace(/\s+\((?:19|20)\d{2}\)$/, "");
  return `game|${name}|${year}`;
}

function parseYear(raw) {
  const text = String(raw ?? "").trim();
  const match = text.match(/\b((?:19|20)\d{2})\b/);
  if (!match) return null;
  const year = Number(match[1]);
  if (!Number.isFinite(year) || year < 1970 || year > 2030) return null;
  return year;
}

function mapGenres(raw) {
  const blob = String(raw ?? "")
    .toLowerCase()
    .replace(/[_/»]+/g, " ")
    .replace(/-/g, " ");
  const found = [];
  const add = (genre) => {
    if (GAME_GENRES.includes(genre) && !found.includes(genre)) found.push(genre);
  };
  if (/role[\s-]*play|\brpg\b|jrpg/.test(blob)) add("RPG");
  if (/platform/.test(blob)) add("Platformer");
  if (/puzzle|match 3|hidden object/.test(blob)) add("Puzzle");
  if (/fight|beat[\s'-]*em|brawler/.test(blob)) add("Fighting");
  if (/strateg|tactics|4x|card game|deck[\s-]*build|roguelike/.test(blob)) add("Strategy");
  if (/simulat|life sim|management|tycoon|farm|sport|racing|driving/.test(blob)) add("Simulation");
  if (/\bindie\b|casual|experimental/.test(blob)) add("Indie");
  if (/adventure|metroidvania|point[\s-]*and[\s-]*click|visual novel|sandbox/.test(blob)) add("Adventure");
  if (/action|shooter|\bfps\b|\btps\b|stealth|arcade|horror/.test(blob)) add("Action");
  return found.length > 0 ? found : ["Adventure"];
}

function mapPlatforms(...rawValues) {
  const found = [];
  const add = (family) => {
    if (!found.includes(family)) found.push(family);
  };
  for (const raw of rawValues) {
    const blob = String(raw ?? "").toLowerCase();
    if (!blob.trim()) continue;
    if (/nintendo|switch\b|wii\b|\bsnes\b|\bnes\b|gamecube|game boy|\b3ds\b|\b2ds\b|\bnds\b|nintendo ds|virtual boy|famicom/.test(blob)) {
      add("Nintendo");
    }
    if (/playstation|\bps[1-5]\b|\bps vita|\bpsp\b|sony/.test(blob)) add("PlayStation");
    if (/xbox|series x|series s/.test(blob)) add("Xbox");
    if (/\bpc\b|windows|steam|macos|linux|ms-dos|dos\b|steam deck/.test(blob)) add("PC");
    if (/\bios\b|android|mobile|iphone|ipad|n-gage|smartphone/.test(blob)) add("Mobile");
    if (/arcade|atari|sega|dreamcast|genesis|mega drive|master system|saturn|game gear|32x|turbografx|pc engine|neo geo|commodore|amiga|zx spectrum|intellivision|colecovision|ouya|3do/.test(blob)) {
      add("Other");
    }
  }
  return found.length > 0 ? found : ["Other"];
}

function obscurityFromScores({ metascore, gfScore, platformCount }) {
  const meta = Number(metascore);
  const gf = Number(gfScore);
  const platforms = Number(platformCount) || 1;
  let fame = 0;
  if (Number.isFinite(meta) && meta > 0) fame = Math.max(fame, Math.min(1, meta / 100));
  if (Number.isFinite(gf) && gf > 0) fame = Math.max(fame, Math.min(1, gf / 5));
  if (fame <= 0) {
    if (platforms >= 4) return 3;
    return 5;
  }
  if (fame >= 0.9) return 1;
  if (fame >= 0.8) return 2;
  if (fame >= 0.7) return 3;
  if (fame >= 0.55) return 4;
  return 5;
}

function mergeInto(byKey, row) {
  const key = identityKey(row.title, row.year);
  if (!key.endsWith(`|${row.year}`) || !row.title) return;
  const existing = byKey.get(key);
  if (!existing) {
    byKey.set(key, {
      id: row.id,
      title: row.title,
      year: row.year,
      genres: [...new Set(row.genres)],
      platforms: [...new Set(row.platforms)],
      obscurity: row.obscurity,
      sourceIds: [...(row.sourceIds ?? [])],
      steamAppId: row.steamAppId,
      imageUrl: row.imageUrl,
    });
    return;
  }
  existing.genres = [...new Set([...existing.genres, ...row.genres])];
  existing.platforms = [...new Set([...existing.platforms, ...row.platforms])];
  existing.sourceIds = [...new Set([...(existing.sourceIds ?? []), ...(row.sourceIds ?? [])])];
  if (row.obscurity < existing.obscurity) existing.obscurity = row.obscurity;
  if (row.id?.startsWith("gdx-") && existing.id.startsWith("ogdb-")) existing.id = row.id;
  if (!existing.steamAppId && row.steamAppId) existing.steamAppId = row.steamAppId;
  if (!existing.imageUrl && row.imageUrl) existing.imageUrl = row.imageUrl;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadOpenGameDb(byKey) {
  if (!(await exists(ogdbRoot))) return { files: 0, rows: 0 };
  const names = (await readdir(ogdbRoot)).filter((name) => name.endsWith(".csv") && name !== "names.csv");
  let rows = 0;
  for (const name of names) {
    const stem = name.replace(/\.csv$/i, "");
    const family = FILE_PLATFORM[stem] ?? mapPlatforms(stem)[0] ?? "Other";
    const text = await readFile(path.join(ogdbRoot, name), "utf8");
    const table = parseCsv(text);
    const header = (table[0] ?? []).map((col) => col.trim().toLowerCase());
    const idx = (label) => header.indexOf(label);
    const iTitle = idx("title");
    const iReleased = idx("released");
    const iGf = idx("gf_score");
    const iMeta = idx("metascore");
    const iGenre = idx("genre");
    const iSteam = idx("steam_id");
    const iCover = idx("cover_art_url");
    for (let r = 1; r < table.length; r += 1) {
      const cols = table[r];
      if (!cols) continue;
      const title = (cols[iTitle] ?? "").trim().replace(/^"|"$/g, "");
      if (!title) continue;
      const year = parseYear(cols[iReleased]);
      if (!year) continue;
      const genres = mapGenres(cols[iGenre] ?? "");
      const metascore = Number(cols[iMeta]);
      const gfScore = Number(cols[iGf]);
      const steamId = iSteam >= 0 ? (cols[iSteam] ?? "").trim() : "";
      const id = steamId && /^\d+$/.test(steamId) ? `ogdb-steam-${steamId}` : `ogdb-${slug(title)}-${year}`;
      mergeInto(byKey, {
        id,
        title,
        year,
        genres,
        platforms: [family],
        obscurity: obscurityFromScores({
          metascore,
          gfScore,
          platformCount: 1,
        }),
        sourceIds: [id, steamId ? `steam-${steamId}` : ""].filter(Boolean),
        steamAppId: steamId && /^\d+$/.test(steamId) ? steamId : undefined,
        imageUrl: iCover >= 0 ? (cols[iCover] ?? "").trim() || undefined : undefined,
      });
      rows += 1;
    }
  }
  return { files: names.length, rows };
}

async function readJson(filePath) {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text);
}

function asList(data) {
  return Array.isArray(data) ? data : [];
}

function fixtureFields(entry) {
  if (!entry || typeof entry !== "object") return null;
  if (entry.fields && typeof entry.fields === "object") {
    return { pk: entry.pk, ...entry.fields };
  }
  return entry;
}

async function loadGameDex(byKey) {
  if (!(await exists(gamedexRoot))) return { games: 0 };
  const genreById = new Map();
  const consoleById = new Map();
  const genreFiles = [
    path.join(gamedexRoot, "apps/genres/fixtures/genres.json"),
    path.join(gamedexRoot, "apps/genres/fixtures/import/genres.json"),
  ];
  const consoleFiles = [
    path.join(gamedexRoot, "apps/consoles/fixtures/consoles.json"),
    path.join(gamedexRoot, "apps/consoles/fixtures/import/consoles.json"),
  ];
  for (const file of genreFiles) {
    if (!(await exists(file))) continue;
    for (const entry of asList(await readJson(file))) {
      const row = fixtureFields(entry);
      if (!row) continue;
      const name = row.name_en ?? row.name;
      const id = row.pk ?? name;
      if (name) genreById.set(String(id), name);
      if (name) genreById.set(String(name), name);
    }
  }
  for (const file of consoleFiles) {
    if (!(await exists(file))) continue;
    for (const entry of asList(await readJson(file))) {
      const row = fixtureFields(entry);
      if (!row) continue;
      const name = row.name_en ?? row.name;
      const id = row.pk ?? name;
      if (name) consoleById.set(String(id), name);
      if (name) consoleById.set(String(name), name);
    }
  }

  const gameFiles = [
    path.join(gamedexRoot, "apps/games/fixtures/games.json"),
    path.join(gamedexRoot, "apps/games/fixtures/import/games.json"),
  ];
  let games = 0;
  for (const file of gameFiles) {
    if (!(await exists(file))) continue;
    for (const entry of asList(await readJson(file))) {
      const row = fixtureFields(entry);
      if (!row) continue;
      const title = String(row.name_en ?? row.name ?? "").trim();
      const year = parseYear(row.release_year);
      if (!title || !year) continue;
      const genreName =
        genreById.get(String(row.genre ?? "")) ??
        (typeof row.genre === "string" ? row.genre : "");
      const consoleNames = [];
      const consoles = row.consoles;
      if (Array.isArray(consoles)) {
        for (const item of consoles) {
          const name = consoleById.get(String(item)) ?? String(item);
          if (name) consoleNames.push(name);
        }
      } else if (typeof consoles === "string" && consoles.trim()) {
        consoleNames.push(...consoles.split(/[,/|]/).map((part) => part.trim()));
      }
      const id = `gdx-${row.slug || slug(title)}`;
      const cover = String(row.cover_url ?? row.cover ?? "").trim();
      mergeInto(byKey, {
        id,
        title,
        year,
        genres: mapGenres(genreName),
        platforms: mapPlatforms(...consoleNames),
        obscurity: obscurityFromScores({ platformCount: consoleNames.length }),
        sourceIds: [id, row.pk ? `gdx-pk-${row.pk}` : ""].filter(Boolean),
        imageUrl: cover || undefined,
      });
      games += 1;
    }
  }
  return { games };
}

async function main() {
  await mkdir(path.dirname(outPath), { recursive: true });
  const byKey = new Map();
  const ogdb = await loadOpenGameDb(byKey);
  const gdx = await loadGameDex(byKey);

  const games = [];
  const seenIds = new Set();
  for (const row of byKey.values()) {
    let id = row.id;
    if (seenIds.has(id)) {
      id = `${id}-${row.year}`;
    }
    let suffix = 2;
    while (seenIds.has(id)) {
      id = `${row.id}-${row.year}-${suffix}`;
      suffix += 1;
    }
    seenIds.add(id);
    const platforms = row.platforms.filter(Boolean);
    const steamFromIds = (row.sourceIds ?? [])
      .map((value) => String(value).match(/^steam-(\d+)$/)?.[1])
      .find(Boolean);
    games.push({
      id,
      title: row.title,
      year: row.year,
      genres: row.genres.length > 0 ? row.genres : ["Adventure"],
      obscurity: row.obscurity,
      platforms: platforms.length > 0 ? platforms : ["Other"],
      ...(row.steamAppId || steamFromIds ? { steamAppId: row.steamAppId || steamFromIds } : {}),
      ...(row.imageUrl ? { imageUrl: row.imageUrl } : {}),
    });
  }

  games.sort((a, b) => a.title.localeCompare(b.title) || a.year - b.year);

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const platforms = {};
  for (const game of games) {
    counts[game.obscurity] += 1;
    for (const family of game.platforms) platforms[family] = (platforms[family] ?? 0) + 1;
  }

  const source =
    games.length === 0 ? "missing" : ogdb.rows > 0 || gdx.games > 0 ? "dataset" : "missing";
  await writeFile(
    outPath,
    JSON.stringify({
      source,
      games,
    })
  );
  console.log(`Wrote ${outPath} with ${games.length} games`);
  console.log(`OpenGameDB CSV files ${ogdb.files}, rows ${ogdb.rows}; GameDex records ${gdx.games}`);
  console.log(`Obscurity buckets 1–5: ${counts[1]} / ${counts[2]} / ${counts[3]} / ${counts[4]} / ${counts[5]}`);
  console.log(`Platforms: ${JSON.stringify(platforms)}`);
}

await main();
