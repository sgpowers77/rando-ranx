# RandoRanx

Shuffle real movie or game titles. Rank them one at a time, or run a Tourney and score the winner.

## What it does

1. Choose **Movies** or **Games**.
2. Choose **Rank** or **Tourney**.
3. **Rank** deals one title. Movies: Seen It / Haven't Seen It / Want to See It. Games: Played It / Haven't Played It / Want to Play It.
4. Seen / played opens a 1–10 scale and optional comments. **Next** saves and deals the next title. Haven't skips. Want parks the title on your list.
5. **Tourney** deals two titles. Pick one, then score the winner 1–10 or **Skip scoring**. The unselected title goes to **Discard**. Check **Remember this setting** to skip scoring on later winners (turn it back off from the next matchup).
6. After Movies or Games, **Path settings** filters Rank and Tourney separately by decade, genre, and obscurity (1 = blockbuster, 5 = extremely obscure indie). Each group has **Check all** / **Uncheck all**, and changes apply immediately to the cards in that path. Decade uses the Wikipedia / Wikidata release year (the same source as search and blurbs), not a local catalog year if those disagree. Unchecked decades never appear in that path.
7. Search Wikipedia for any film (or game, on the Games path). **Use in Rank** or **Use in Tourney** deals it next. If Wikipedia is unreachable, a local fallback list is used.
8. The left-hand log has **Results** and **Discard** tabs. Select a Results row to change action, rating, or comments. Discard is listed, not scored.
9. On smaller screens, open the same log from the list icon in the header.
11. Home settings includes **Reset all**, which asks for confirmation then clears logs, Discard, Watch tags, remembered skip, filters, and searched titles. The catalog stays.
12. In Tourney, drag a card onto the **WTF??** drop zone for a Wikipedia blurb. **Watchlist** tags it in the left log. **Continue** leaves the matchup as-is.

Answers stay in this browser via `localStorage`. There is no account and no database.

## Run locally

```bash
npm install
npm run dev -- --port 43147 --hostname 127.0.0.1
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

```bash
npm run build
npm run start -- --port 43147
```

## Stack

Next.js, TypeScript, Tailwind CSS, and shadcn/ui.
