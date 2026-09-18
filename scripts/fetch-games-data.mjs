import { cp, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const destRoot = process.env.GAMES_DATA_DIR?.trim() || path.join(process.cwd(), "data", "games");
const sources = [
  {
    name: "opengamedb",
    url: "https://github.com/karlforshaw/opengamedb.git",
    dest: path.join(destRoot, "opengamedb"),
    marker: "pc.csv",
    extra: ["/tmp/game-src/opengamedb"],
  },
  {
    name: "gamedex",
    url: "https://github.com/Darkvus/gamedex.git",
    dest: path.join(destRoot, "gamedex"),
    marker: path.join("apps", "games", "fixtures", "games.json"),
    extra: ["/tmp/game-src/gamedex"],
  },
];

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function isReady(dir, marker) {
  try {
    const info = await stat(path.join(dir, marker));
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

async function copyIfReady(from, to, marker) {
  if (!(await isReady(from, marker))) return false;
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to, { recursive: true, force: true });
  return isReady(to, marker);
}

async function cloneRepo(url, dest) {
  await mkdir(path.dirname(dest), { recursive: true });
  await run("git", ["clone", "--depth", "1", url, dest]);
}

async function fetchSource(source) {
  if (await isReady(source.dest, source.marker)) {
    console.log(`Using existing ${source.dest}`);
    return true;
  }
  for (const extra of source.extra) {
    if (await copyIfReady(extra, source.dest, source.marker)) {
      console.log(`Copied ${source.name} from ${extra}`);
      return true;
    }
  }
  try {
    await cloneRepo(source.url, source.dest);
    if (await isReady(source.dest, source.marker)) {
      console.log(`Cloned ${source.name} into ${source.dest}`);
      return true;
    }
  } catch (error) {
    console.warn(`Clone ${source.name} failed: ${error instanceof Error ? error.message : error}`);
  }
  return false;
}

await mkdir(destRoot, { recursive: true });
const results = [];
for (const source of sources) {
  results.push(await fetchSource(source));
}
try {
  const listing = await readdir(destRoot);
  console.log(`data/games contains: ${listing.join(", ") || "(empty)"}`);
} catch {
  // ignore
}
if (!results.every(Boolean)) {
  console.warn("One or more game sources are missing. build-games-index will use whatever is present plus the local fallback catalog.");
  process.exit(0);
}
