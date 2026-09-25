# 1 Million Emojis

The code behind [1 Million Emojis](https://chriswijnia.com/experiments/emoji): a shared 1000 × 1000 canvas of emoji,
where visitors paint strokes and [TypeSafe AI](https://docs.typesafe.ai/api)'s Jev (System One) joins in: after each
stroke it chooses, as one typed Choice, a square next to it and the emoji that goes there.

| Package | What it is | Licence |
| --- | --- | --- |
| [`packages/emoji`](packages/emoji) | The canvas's rules (grid, tiles, ink), the palette with names and groups, and Jev joining a stroke | MIT |
| [`packages/jev`](packages/jev) | A small Jev client: the Vercel AI Gateway first, TypeSafe directly as the fallback, answers checked, cost reported | MIT |

```sh
npm install
npm test          # the packages' unit tests (no Jev calls)
npm run typecheck
```

This repository is a mirror: it is copied from the site's monorepo on every change there, so pull requests are read
but applied upstream.
