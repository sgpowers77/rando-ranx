Place `movies_metadata.csv` from [The Movies Dataset](https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset) in this folder.

RandoRanx also tries a public Hugging Face mirror on first movie deal if the file is missing.

Game dumps land under `data/games/` after `npm run fetch-games` (OpenGameDB CSVs and GameDex fixtures). They are not committed. `npm run build-games-index` writes `public/games-index.json`.
