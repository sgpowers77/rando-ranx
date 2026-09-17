# RandoRanx

Shuffle a real movie or game title, then rank it, skip it, or park it on a want list. Every answer lands in a printable table.

## What it does

1. Choose **Movies** or **Games**.
2. RandoRanx deals one title and year from a static catalog.
3. Movies: **Seen It**, **Haven't Seen It**, **Want to See It**.
4. Games: **Played It**, **Haven't Played It**, **Want to Play It**.
5. Seen / played opens a 1–10 scale and an optional comments field. **Next** saves that rating and deals the next title.
6. Haven't skips immediately.
7. Want saves the title to the queue, then deals the next title.
8. The printer icon (top right) opens a log of rated titles, skips, and the want-to-see / want-to-play queue. Use **Print table** for a paper copy.

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
