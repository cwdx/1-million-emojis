# 1 Million Emojis

The code behind [1 Million Emojis](https://chriswijnia.com/experiments/emoji): a shared canvas of a million emoji cells,
read as one long strip, where visitors place emoji and [TypeSafe AI](https://docs.typesafe.ai/api)'s Jev (System One)
paints the next cell on request: it reads the strip around it by name and chooses, as one typed Choice, what comes next.

| Package | What it is | Licence |
| --- | --- | --- |
| [`packages/emoji`](packages/emoji) | The canvas and palette, emoji names and groups, and Jev's painter | MIT |
| [`packages/jev`](packages/jev) | A small Jev client: the Vercel AI Gateway first, TypeSafe directly as the fallback, answers checked, cost reported | MIT |

```sh
npm install
npm test          # the packages' unit tests (no Jev calls)
npm run typecheck
```

This repository is a mirror: it is copied from the site's monorepo on every change there, so pull requests are read
but applied upstream.
