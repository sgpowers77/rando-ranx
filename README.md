# RandoRanx

Shuffle real movie or game titles. Rank them one at a time, or run a Tourney and score the winner.

## What it does

1. Choose **Movies** or **Games**.
2. Choose **Rank** or **Tourney**.
3. **Rank** deals one title. Movies: Seen It / Haven't Seen It / Want to See It. Games: Played It / Haven't Played It / Want to Play It.
4. Seen / played opens a 1–10 scale and optional comments. **Next** saves and deals the next title. Haven't skips. Want parks the title on your list.
5. **Tourney** deals two titles. Pick one, then score the winner 1–10 or **Skip scoring**. The unselected title goes to **Discard**. Check **Remember this setting** to skip scoring on later winners (turn it back off from the next matchup).
6. After Movies or Games, **Path settings** (gear under Rank / Tourney) filters that path by decade, genre, and obscurity (1 = blockbuster, 5 = extremely obscure indie). Rank and Tourney remember separate filters.
7. Search Wikipedia for any film (or game, on the Games path). **Use in Rank** or **Use in Tourney** deals it next. If Wikipedia is unreachable, a local fallback list is used.
8. The left-hand log has **Results** and **Discard** tabs. Select a Results row to change action, rating, or comments. Discard is listed, not scored.
9. On smaller screens, open the same log from the list icon in the header.
10. The printer icon opens a printable table of results and discards.

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
