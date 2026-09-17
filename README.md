# RandoRanx

It's Showdown Time. Rank. Compare. Discover.

## What it does

1. Choose **Movies** or **Games**.
2. Choose **Ranx** or **Tourney**. Wikipedia search stays hidden until a mode is selected.
3. **Ranx** deals one title. Movies: Seen It / Haven't Seen It / Want to See It. Games: Played It / Haven't Played It / Want to Play It. A title already in Results is never dealt again. Discard is hidden in Ranx. Drag the card onto **WTF??** for a blurb; **Continue** does not log a result.
4. Seen / played opens a 1–10 scale and optional comments. **Next** saves and deals the next title. Haven't skips. Want parks the title on your list.
5. **Tourney** deals two titles. On a phone, both cards sit side by side with shorter posters and star/bookmark on the poster. **Select** logs a Contender; the other card goes to **Discard**. A **star** opens an optional 1–10 score and comment modal (X or overlay to close). A **bookmark** adds or removes Watch without voting. **Back** undoes the last Select (pair, log, and Discard), up to three times. **Skip** both cards with no winner. Drag onto **WTF??** the same way as Ranx. On mobile, Tourney instructions live behind the header **info** icon next to print.
6. After Movies or Games, **Path settings** filters Ranx and Tourney separately by decade, genre, obscurity, and — for Movies — **MPAA Rating** (G, PG, PG-13, R, NC-17, Not Rated). Game decades start at **1970s**. Game obscurity is AAA+ through Micro-Indie. Movie obscurity stays blockbuster through extremely obscure indie. Each group has **Check all** / **Uncheck all**. Every group needs at least one box on both Ranx and Tourney; **Done** stays greyed out until they do. Movie decades, genres, and obscurity come from [The Movies Dataset](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset). MPAA values come from Wikidata when known; otherwise **Not Rated**. Wikipedia is used for search and WTF blurbs, not as the movie catalog.
7. Search Wikipedia after Ranx or Tourney is selected. **Queue** adds search results you pick (checkboxes for several at once). Queue is never filled by random deals. A queue icon appears opposite Session log once at least one title is queued. The queue modal lists the current catalog, lets you remove items, search again, and optionally **Only present user-queued items**.
8. The left-hand log has **Results**, **Discard** (Tourney only), and **Watch** tabs. **Final Round** in Results pairs logged Contenders like Tourney until a champion. Select a Results row to change action, rating, or comments. Discard is listed, not scored.
9. On smaller screens, a **back arrow** left of the list icon returns home. Open the session log from the list icon.
10. The printable table in the header can be printed or downloaded as **CSV** (results, ratings, comments, discards, and watchlist status).
11. Home settings includes **Reset all**, which asks for confirmation then clears logs, Discard, Watch tags, Queue, remembered skip, filters, and searched titles. The catalog stays.
12. Drag a Ranx or Tourney card onto the **WTF??** drop zone (visible while dragging) for a Wikipedia blurb. **Watchlist** tags it in the left log. **Continue** leaves the current title or matchup as-is.
13. Ranx, Tourney, WTF, the session log, and Wikipedia search show a **portrait** poster only from a Wikipedia **film** (or video game) page — not people, books, or same-name articles. The caption credits Wikipedia/Wikimedia. Missing film-page images stay as an empty frame.

Answers stay in this browser via `localStorage`. There is no account and no database.

## Run locally

```bash
npm install
npm run fetch-movies
npm run build-movies-index
npm run dev -- --port 43147 --hostname 0.0.0.0
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

## GitHub Pages

Published URL: [https://sgpowers77.github.io/rando-ranx/](https://sgpowers77.github.io/rando-ranx/)

This app is a static Next.js export. GitHub Actions (`.github/workflows/pages.yml`) downloads The Movies Dataset, writes `public/movies-index.json`, and deploys the `out/` folder with `basePath` `/rando-ranx`.

### Enable Pages (once)

1. Open [https://github.com/sgpowers77/rando-ranx](https://github.com/sgpowers77/rando-ranx).
2. **Settings → Pages → Build and deployment → Source:** GitHub Actions.
3. Push or merge to **`main`** so the **Deploy GitHub Pages** workflow runs (Actions tab).
4. When the workflow is green, open `https://sgpowers77.github.io/rando-ranx/`.

### Local commands to produce the same export

```bash
npm run fetch-movies
npm run export:pages
```

The static site is written to `out/`.

If `git push` to GitHub fails with `could not read Username for 'https://github.com'`, authenticate (GitHub CLI `gh auth login`, or SSH `git remote set-url github git@github.com:sgpowers77/rando-ranx.git`) and push `main`. Enabling Pages from Actions is still required in the repo settings.

## Movie catalog (The Movies Dataset)

Ranx and Tourney sample films from `movies_metadata.csv` in [The Movies Dataset](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset) (MovieLens / TMDb metadata, ~45k titles). Place the file at:

```
data/movies_metadata.csv
```

Or set `MOVIES_METADATA_PATH` to an absolute path. On first movie deal, RandoRanx tries a public Hugging Face mirror if the file is missing (no Kaggle key required):

```bash
npm run fetch-movies
```

Kaggle (optional, if you prefer the official zip):

```bash
kaggle datasets download -d rounakbanik/the-movies-dataset
unzip the-movies-dataset.zip movies_metadata.csv -d data
```

If download fails, Ranx still deals a small built-in movie fallback so the app is usable. Wikipedia search, WTF blurbs, Path settings Done-lock, and CSV export stay available either way.

```bash
npm run build
npm run start -- --port 43147
```

## Stack

Next.js, TypeScript, Tailwind CSS, and shadcn/ui.
