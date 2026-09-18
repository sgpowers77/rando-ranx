# RandoRanx

It's Showdown Time. Rank. Compare. Discover.

## What it does

1. Choose **Movies** or **Games**.
2. Choose **Tourney** (primary) or **Ranx**. Wikipedia search stays hidden until a mode is selected.
3. **Ranx** deals one title. Movies: Seen It / Haven't Seen It / Want to See It. Games: Played It / Haven't Played It / Want to Play It. A title already in Results is never dealt again. Discard is hidden in Ranx. Drag the card onto **WTF??** for a blurb; **Continue** does not log a result.
4. Seen / played opens a 1–10 scale, an optional **watch date** picker (movies), and optional comments. **Next** saves and deals the next title. Haven't skips. Want parks the title on your list. Watch date is stored with the rating and included in **Letterboxd CSV** as `WatchedDate` when present.
5. **Tourney** deals two titles. On a phone, both cards sit side by side with shorter posters and star/bookmark on the poster. **Select** logs a Contender; the other card goes to **Discard**. A **star** opens an optional 1–10 score, watch date, and comment modal (X or overlay to close). A **bookmark** adds or removes Watch without voting. **Undo** (top left above the cards) undoes the last Select (pair, log, and Discard), up to three times, and stays disabled when there is nothing to undo. **Skip** parks both cards so they are not re-dealt immediately, adds two more titles that match the current catalog and Filters, and shows that new pair. Skip does not count against stack size and does not end Tourney. Drag onto **WTF??** the same way as Ranx. On mobile, Tourney instructions live behind the header **info** icon next to Settings. Movie cards show the **director** under the title and above the year (from Wikidata / Wikipedia when the movies CSV has no director column). If a director is missing, that line stays empty so Select does not jump.
6. After Movies or Games, **Filters** (Lucide sliders icon) apply to **both Ranx and Tourney** for that catalog. A **Randomize** toggle sits next to Filters. Turn it on to pick a valid random combination — at least one option in Decades, Genre, Obscurity, stack size, and (for Movies) MPAA Rating plus the English / foreign toggle — then apply it immediately. Groups are never left empty (same Done-lock rules). Turning Randomize off keeps the last combination. Intro copy: filter categories must have at least one selection. Groups are **Decades**, Genre, Obscurity, stack size (**10 / 25 / 50 / 100**, default 50), and — for Movies — **MPAA Rating** plus **Include foreign / non-English films** (on by default; turn off for English-dialogue films only). Game decades start at **1970s**. Game obscurity is AAA+ through Micro-Indie. Movie obscurity is 1 (wide release) through 5 (little-seen). Each group has **Check all** / **Uncheck all**. **Done** stays greyed out until every group has a selection. Titles without a listed MPAA rating count as **Not Rated**. Movie decades, genres, and obscurity come from [The Movies Dataset](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset). Wikipedia is used for search and WTF blurbs, not as the movie catalog.
7. After Ranx or Tourney, **Search films** (or games) copy: build a custom queue by searching titles from Wikipedia.com. Queue is viewed and edited from the Queue icon to the right of the Movies or Games log. **Queue** adds search results you pick (checkboxes for several at once). Queue is never filled by random deals. The queue modal lists only the current catalog.
8. Movies and Games each keep their own **Results**, **Discard**, **Watch**, Queue, and Final Round contenders. The visible log never mixes catalogs. On desktop the left log **scrolls inside its pane** (sticky, viewport height). The **page scrollbar sits on the right edge of the window**, not between the log and the cards. Ranx will not re-deal a title already in **that catalog’s** Results. Tourney **Final Round** and Undo are per catalog. Discard stays hidden in Ranx. Select a Results row to change action, rating, or comments. Discard is listed, not scored. Export/print/CSV follow the current catalog.
9. On smaller screens, a **back arrow** left of the list icon returns home. Open the session log from the list icon.
10. The header **Settings** (gear) opens a **dropdown** with **Color palette**, **Export to PDF**, **Export to CSV**, **Letterboxd CSV**, and **Clear Session**. On a phone, Color palette opens a **modal** with the four schemes (Midnight Gold, Arcade Night, Pine Screen, Daylight). On desktop the four palettes stay in the dropdown. Palettes apply with CSS variables and are stored in this browser. PDF uses the browser print dialog (save as PDF). CSV downloads the current catalog’s log. **Letterboxd CSV** downloads a UTF-8 file Letterboxd can import ([importing data](https://letterboxd.com/about/importing-data/)) for **movies** only (ratings as Rating10, reviews, title/year, Directors when known, imdbID when known, WatchedDate when you entered a watch date; Watch/Want rows have no rating). Clear Session asks for confirmation, then wipes both Movies and Games logs.
11. **Clear Session** confirmation clears **both** Movies and Games logs, Discard, Watch tags, Queue, Final Round, remembered skip, filters, and searched titles. The catalog stays. Palettes are not reset.
12. Drag a Ranx or Tourney card onto the **WTF??** drop zone (visible while dragging) for a Wikipedia blurb. **Watchlist** tags it in the left log. **Continue** leaves the current title or matchup as-is.
13. Ranx, Tourney, WTF, the session log, and Wikipedia search show a **portrait** poster only from a Wikipedia **film** (or video game) page — not people, books, or same-name articles. The caption credits Wikipedia/Wikimedia. A loaded poster is a link to that title’s **IMDb** page (new tab). If a poster is not loaded within **10 seconds**, the same 2:3 frame links to IMDb instead. Overlay star/bookmark and Select stay usable. The current stack’s posters are preloaded so the next card is less likely to wait.

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

If download fails, Ranx still deals a small built-in movie fallback so the app is usable. Wikipedia search, WTF blurbs, Filters Done-lock, and CSV export stay available either way.

```bash
npm run build
npm run start -- --port 43147
```

## Stack

Next.js, TypeScript, Tailwind CSS, and shadcn/ui.
