import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const dest = process.env.MOVIES_METADATA_PATH?.trim() || path.join(process.cwd(), "data", "movies_metadata.csv");
const url =
  "https://huggingface.co/datasets/jamil1016/Movie_Dataset/resolve/main/movies_metadata.csv?download=true";

try {
  const info = await stat(dest);
  if (info.isFile() && info.size > 1_000_000) {
    console.log(`Using existing ${dest} (${info.size} bytes)`);
    process.exit(0);
  }
} catch {
  // download
}

await mkdir(path.dirname(dest), { recursive: true });
const res = await fetch(url, {
  headers: { "User-Agent": "RandoRanx/1.0 (movies dataset loader)" },
  redirect: "follow",
});
if (!res.ok) {
  console.error(`Download failed: HTTP ${res.status}`);
  console.error("Place movies_metadata.csv from https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset into data/");
  process.exit(1);
}
const buffer = Buffer.from(await res.arrayBuffer());
await writeFile(dest, buffer);
console.log(`Wrote ${dest} (${buffer.byteLength} bytes)`);
