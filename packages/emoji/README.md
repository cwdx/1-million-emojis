# @cw/emoji

The code behind [1 Million Emojis](https://chriswijnia.com/experiments/emoji): a shared canvas of a million emoji
cells, read as one long strip, where [TypeSafe AI](https://docs.typesafe.ai/api)'s Jev (System One) paints too.

- **The canvas** (`canvas.ts`, no dependencies, safe in a browser): a million cells read in chunks of a thousand, and a
  palette of 1,792 emoji, each a whole grapheme, so sequences joined with a zero-width joiner stay one emoji.
- **Names** (`names.ts`): each palette emoji's Unicode name and group, from
  [unicode-emoji-json](https://github.com/muan/unicode-emoji-json).
- **Jev's painter** (`jev-paint.ts`): Jev reads the eight cells either side of a cell, by name, and chooses the emoji
  that carries the strip on, as one typed Choice. Its options are the neighbours' own emoji plus some drawn from their
  groups and from others; the pick is drawn from Jev's probabilities, so it does not settle into repeating one emoji.

```ts
import { jevChoose } from '@cw/jev'
import { jevPaint } from '@cw/emoji'

const keys = { gateway: process.env.AI_GATEWAY_API_KEY, typesafe: process.env.TYPESAFE_API_KEY }
const near = new Map([[41, '🌊'], [42, '🌊'], [44, '🌅']]) // cell → emoji, empty cells left out
const painted = await jevPaint((q) => jevChoose(keys, q), near, 43)
// → { emoji, p, candidates: [{ emoji, p }, …] }
```

On the site, placements go through the server (palette only, rate-limited) into Postgres, and the canvas stays live
with server-sent events: the server polls the placements table by id and sends what is new.

MIT licence.
