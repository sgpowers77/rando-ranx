import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const MOVIES_METADATA_FILENAME = "movies_metadata.csv";

export const DATASET_MIRRORS = [
  "https://huggingface.co/datasets/jamil1016/Movie_Dataset/resolve/main/movies_metadata.csv?download=true",
];

export function moviesMetadataPath(): string {
  return (
    process.env.MOVIES_METADATA_PATH?.trim() ||
    path.join(process.cwd(), "data", MOVIES_METADATA_FILENAME)
  );
}

export async function ensureMoviesMetadata(): Promise<{ path: string; downloaded: boolean }> {
  const dest = moviesMetadataPath();
  try {
    const info = await stat(dest);
    if (info.isFile() && info.size > 1_000_000) return { path: dest, downloaded: false };
  } catch {
    // fetch below
  }

  await mkdir(path.dirname(dest), { recursive: true });
  let lastError: unknown;
  for (const url of DATASET_MIRRORS) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "RandoRanx/1.0 (movies dataset loader)", Accept: "*/*" },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.byteLength < 1_000_000) throw new Error("Downloaded file is too small to be movies_metadata.csv");
      await writeFile(dest, buffer);
      return { path: dest, downloaded: true };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not download movies_metadata.csv");
}
