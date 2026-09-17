# RandoRanx

Shuffle real movie or game titles. Rank them one at a time, or run a Tourney and score the winner.

## What it does

1. Choose **Movies** or **Games**.
2. Choose **Rank** or **Tourney**.
3. **Rank** deals one title. Movies: Seen It / Haven't Seen It / Want to See It. Games: Played It / Haven't Played It / Want to Play It.
4. Seen / played opens a 1–10 scale and optional comments. **Next** saves and deals the next title. Haven't skips. Want parks the title on your list.
5. **Tourney** deals two titles. Pick one, then score the winner 1–10 or **Skip scoring**. The unselected title goes to **Discard**. Check **Remember this setting** to skip scoring on later winners (turn it back off from the next matchup). **Reshuffle** under the pair skips both cards with no winner and deals a new matchup; those titles stay out of the next deals.
6. After Movies or Games, **Path settings** filters Rank and Tourney separately by decade, genre, and obscurity (1 = blockbuster, 5 = extremely obscure indie). Each group has **Check all** / **Uncheck all**. Year, Genre, and Obscurity each need at least one box on both Rank and Tourney; **Done** stays greyed out until they do. Movie decades, genres, and obscurity come from [The Movies Dataset](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset) (`release_date`, `genres`, `popularity` / `vote_count`). Wikipedia is used for search and Tourney WTF blurbs, not as the movie catalog.
7. Search Wikipedia for any film (or game, on the Games path). **Use in Rank** or **Use in Tourney** deals it next. If Wikipedia is unreachable, a local fallback list is used.
8. The left-hand log has **Results**, **Discard**, and **Watch** tabs. Select a Results row to change action, rating, or comments. Discard is listed, not scored.
9. On smaller screens, open the same log from the list icon in the header.
10. The printable table in the header can be printed or downloaded as **CSV** (results, ratings, comments, discards, and watchlist status).
11. Home settings includes **Reset all**, which asks for confirmation then clears logs, Discard, Watch tags, remembered skip, filters, and searched titles. The catalog stays.
12. In Tourney, drag a card onto the **WTF??** drop zone for a Wikipedia blurb. **Watchlist** tags it in the left log. **Continue** leaves the matchup as-is.

Answers stay in this browser via `localStorage`. There is no account and no database.

## Run locally

```bash
npm install
npm run dev -- --port 43147 --hostname 127.0.0.1
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

## Movie catalog (The Movies Dataset)

Rank and Tourney sample films from `movies_metadata.csv` in [The Movies Dataset](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset) (MovieLens / TMDb metadata, ~45k titles). Place the file at:

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

If download fails, Rank still deals a small built-in movie fallback so the app is usable. Wikipedia search, WTF blurbs, Path settings Done-lock, and CSV export stay available either way.

```bash
npm run build
npm run start -- --port 43147
```

## Stack

Next.js, TypeScript, Tailwind CSS, and shadcn/ui.
