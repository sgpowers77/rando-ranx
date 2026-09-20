# RandoRanx

It's Showdown Time. Rank. Compare. Discover.

## What it does

1. Choose **Movies**, **Games**, or **Music**.
2. Choose **Tourney** (primary) or **Ranx**. Wikipedia search stays hidden until a mode is selected.
3. **Ranx** deals one title. Movies: Seen It / Haven't Seen It / Want to See It. Games: Played It / Haven't Played It / Want to Play It. Music: Heard It / Haven't Heard It / Want to Hear It. A title already in Results is never dealt again. Discard is hidden in Ranx. Drag the card onto **WTF??** for a blurb; **Continue** does not log a result.
4. Seen / played opens a 1–10 scale, an optional **watch date** picker (movies), and optional comments. **Next** saves and deals the next title. Haven't skips. Want parks the title on your list. Watch date is stored with the rating and included in **Letterboxd CSV** as `WatchedDate` when present.
5. **Tourney** and **Ranx** both start with **Choose an Experience** (unless you checked **Do not show again**). Pick a named preset, open **Filters** to customize, or turn on **Full Rando** next to Continue, then **Continue**. Full Rando greys out every preset and rolls a valid random filter mix (same Done-lock rules: at least one option in each group). After Continue, Tourney deals two titles. On a phone, both cards sit side by side with shorter posters and star/bookmark on the poster. **Select** logs a Contender; the other card goes to **Discard**. A **star** opens an optional 1–10 score, watch date, and comment modal (X or overlay to close). A **bookmark** adds or removes Watch without voting. **Undo** (top left above the cards) undoes the last Select (pair, log, and Discard), up to three times, and stays disabled when there is nothing to undo. **Skip** parks both cards so they are not re-dealt immediately, adds two more titles that match the current catalog and Filters, and shows that new pair. Skip does not count against stack size and does not end Tourney. Drag onto **WTF??** the same way as Ranx. On mobile, Tourney instructions live behind the header **info** icon next to Settings. Movie cards show the **director** under the title and above the year (from Wikidata / Wikipedia when the movies CSV has no director column). If a director is missing, that line stays empty so Select does not jump. Album cards show the **artist** the same way. Game cards skip a byline.
6. **Filters** and **Full Rando** are not on the catalog landing, the Ranx/Tourney picker, or the card-play screens. Open **Filters** from the button inside **Choose an Experience**, or from the empty-stack screen when a deal has no matching titles. Filters apply to **both Ranx and Tourney** for that catalog. Intro copy: filter categories must have at least one selection. Groups are **Decades**, Genre, Obscurity, and stack size (**10 / 25 / 50 / 100**, default 50). **Movies** add **MPAA Rating** plus **Include foreign / non-English films** (on by default; turn off for English-dialogue films only). **Games** add **Platform**: first-release family (**Nintendo**, **PlayStation**, **Xbox**, **PC**, **Mobile**, **Other**). Game genres are split for the catalog (Action, Adventure, Beat 'em Up, Casual, Fighting, Horror, Immersive Sim, Indie, JRPG, Metroidvania, Open World, Party, Platformer, Puzzle, Racing, Rhythm, RPG, Roguelike, Sandbox, Shooter, Simulation, Soulslike, Sports, Stealth, Strategy, Survival, Tactics, Visual Novel). Unchecked decades, genres, and platforms are excluded from the deal. Handhelds map to their home console family. Movies and Music do not show Platform. Music does not show MPAA or the foreign-film toggle. Game decades start at **1970s**. Music decades start at **1950s**. Game obscurity is AAA+ through Micro-Indie. Movie obscurity is 1 (wide release) through 5 (little-seen). Music obscurity is chart/canonical through obscure/private press, from MusicBrainz tags and rating votes. Each group has **Check all** / **Uncheck all**. **Done** stays greyed out until every group has a selection. Titles without a listed MPAA rating count as **Not Rated**. Movie decades, genres, and obscurity come from [The Movies Dataset](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset). Wikipedia is used for search and WTF blurbs, not as the movie catalog. Album deals use baked MusicBrainz **release groups** (albums), not tracks.
7. After Ranx or Tourney, search copy: build a custom queue by searching titles from Wikipedia.com. Queue is viewed and edited from the Queue icon to the right of the Movies, Games, or Music log. **Queue** adds search results you pick (checkboxes for several at once). Queue is never filled by random deals. The queue modal lists only the current catalog.
8. Movies, Games, and Music each keep their own **Results**, **Discard**, **Watch**, Queue, and Final Round contenders. The visible log never mixes catalogs. On desktop the left log **scrolls inside its pane** (sticky, viewport height). The **page scrollbar sits on the right edge of the window**, not between the log and the cards. Ranx will not re-deal a title already in **that catalog’s** Results. Tourney **Final Round** and Undo are per catalog. Discard stays hidden in Ranx. Select a Results row to change action, rating, or comments. Discard is listed, not scored. Export/print/CSV follow the current catalog. When a Tourney or Ranx stack is empty, **Final Round** is the primary button on the stage (the sidebar control stays secondary). After a Final Round champion, the primary button is **Return Home**, which asks to clear **that catalog’s** current Tourney or Ranx log (unscored Results plus Discard). Watch, ratings, comments, and notes stay. The other catalogs are not cleared.
9. On smaller screens, a **back arrow** left of the list icon returns home. Open the session log from the list icon.
10. The header **Settings** (gear) opens a **dropdown** with **Color palette**, **Export to PDF**, **Export to CSV**, **Letterboxd CSV**, and **Clear Session**. On a phone, Color palette opens a **modal** with the four schemes (Midnight Gold, Arcade Night, Pine Screen, Daylight). On desktop the four palettes stay in the dropdown. Palettes apply with CSS variables and are stored in this browser. PDF uses the browser print dialog (save as PDF). CSV downloads the current catalog’s log. **Letterboxd CSV** downloads a UTF-8 file Letterboxd can import ([importing data](https://letterboxd.com/about/importing-data/)) for **movies** only (ratings as Rating10, reviews, title/year, Directors when known, imdbID when known, WatchedDate when you entered a watch date; Watch/Want rows have no rating). Clear Session asks for confirmation, then wipes Movies, Games, and Music logs.
11. **Clear Session** confirmation clears **Movies, Games, and Music** logs, Discard, Watch tags, Queue, Final Round, remembered skip, filters, and searched titles. The catalog stays. Palettes are not reset.
12. Drag a Ranx or Tourney card onto the **WTF??** drop zone (visible while dragging) for a Wikipedia blurb. **Watchlist** tags it in the left log. **Continue** leaves the current title or matchup as-is.
13. Ranx, Tourney, WTF, the session log, and Wikipedia search show a **portrait** poster in a 2:3 frame. Movies still use Wikipedia / Wikimedia (and IMDb as the fallback link). The current deal preloads the next **10** posters and, every **10** selections or skips, queues another 10 from the upcoming stack so art stays ready past ~25 titles. Games prefer **Steam** library covers (from OpenGameDB `steam_id`) and GameDex / Wikimedia box art, then Wikipedia **video game** pages — not film pages. Album covers still come from the Cover Art Archive; clicking a Music cover (and the credit under it) opens the album’s **Wikipedia** page, not IMDb. Overlay star/bookmark and Select stay usable.

Answers stay in this browser via `localStorage`. There is no account and no database.

## Run locally

```bash
npm install
npm run fetch-movies
npm run build-movies-index
npm run fetch-games
npm run build-games-index
npm run fetch-music
npm run build-music-index
npm run dev -- --port 43147 --hostname 0.0.0.0
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

## GitHub Pages

Published URL: [https://sgpowers77.github.io/rando-ranx/](https://sgpowers77.github.io/rando-ranx/)

This app is a static Next.js export. GitHub Actions (`.github/workflows/pages.yml`) downloads The Movies Dataset, the public OpenGameDB / GameDex dumps, and a MusicBrainz release-group sample, writes `public/movies-index.json`, `public/games-index.json`, and `public/music-index.json`, and deploys the `out/` folder with `basePath` `/rando-ranx`.

### Enable Pages (once)

1. Open [https://github.com/sgpowers77/rando-ranx](https://github.com/sgpowers77/rando-ranx).
2. **Settings → Pages → Build and deployment → Source:** GitHub Actions.
3. Push or merge to **`main`** so the **Deploy GitHub Pages** workflow runs (Actions tab).
4. When the workflow is green, open `https://sgpowers77.github.io/rando-ranx/`.

### Local commands to produce the same export

```bash
npm run fetch-movies
npm run fetch-games
npm run fetch-music
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

## Game catalog (OpenGameDB + GameDex)

Games mode samples from a baked `public/games-index.json`, merged at build time from:

- [OpenGameDB](https://github.com/karlforshaw/opengamedb) platform CSVs (`title`, `released`, scores, `genre`)
- [GameDex](https://github.com/Darkvus/gamedex) documented fixture dumps (games, consoles, genres)

Titles are deduped by a stable identity (`title` + `year`, plus Steam / GameDex ids when present). Platform families, decades, genres, and obscurity are mapped onto the existing Filters (Nintendo / PlayStation / Xbox / PC / Mobile / Other). Handhelds roll into their home family. The small built-in games list is merged first so curated ids stay stable, then used as a fallback if the index is missing.

```bash
npm run fetch-games
npm run build-games-index
```

## Music catalog (MusicBrainz albums)

Music mode deals **albums** (MusicBrainz [release groups](https://musicbrainz.org/doc/Release_Group)), not tracks. The live MusicBrainz web service is rate-limited, so GitHub Pages cannot query it at deal time. `npm run fetch-music` samples album release groups (1 request/second, identifiable User-Agent) and writes `data/music/release-groups.json`. `npm run build-music-index` maps tags onto Rock / Pop / Hip-Hop / Jazz / Electronic / Classical / Country / R&B / Folk / Metal, first-release year onto decades from the 1950s, and rating votes / tag weight onto obscurity, then writes `public/music-index.json`. Covers load from the [Cover Art Archive](https://coverartarchive.org/). A small built-in album list is merged first and used if the index is missing.

[FreeAPIHub’s MusicBrainz page](https://freeapihub.com/apis/musicbrainz-api) is a wrapper around the same public MusicBrainz API this fetch uses directly.

```bash
npm run fetch-music
npm run build-music-index
```

```bash
npm run build
npm run start -- --port 43147
```

## Stack

Next.js, TypeScript, Tailwind CSS, and shadcn/ui.
