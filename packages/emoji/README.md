# @cw/emoji

The code behind [1 Million Emojis](https://chriswijnia.com/lab/emoji): a shared 1000 × 1000 canvas of emoji,
where [TypeSafe AI](https://docs.typesafe.ai/api)'s Jev (System One) joins in with every stroke.

- **The canvas** (`canvas.ts`, no dependencies, safe in a browser): 1000 × 1000 cells, the same on every screen, read
  in 32 × 32 tiles; a painter's ink (60 cells, back one a second); strokes as the cells a line passes through; and a
  palette of 1,792 emoji, each a whole grapheme, so sequences joined with a zero-width joiner stay one emoji.
- **Names** (`names.ts`, `palette-names.ts`, `palette-keywords.ts`): each palette emoji's Unicode name and group, from
  [unicode-emoji-json](https://github.com/muan/unicode-emoji-json), compact enough for a browser to search by name;
  and its [emojilib](https://github.com/muan/emojilib) keywords, the common ones left out.
- **Jev joins in** (`jev-join.ts`): after someone paints a stroke, one request asks Jev two things. A Choice over
  (emoji, place) pairs: emoji that share keywords with what is around the stroke (rarer words count more), plus two
  wildcards, in up to three places named against the stroke (above it, at its end, inside a loop). And a Noul: is the
  stroke unfinished? Above 0.7, Jev closes the loop or carries the line on with the stroke's own emoji. Jev sees the
  stroke's shape, what is around it by name and a small picture; its pick is drawn wider the less sure it is.

```ts
import { jevAsk } from '@cw/jev'
import { cellAt, jevJoin } from '@cw/emoji'

const keys = { gateway: process.env.AI_GATEWAY_API_KEY, typesafe: process.env.TYPESAFE_API_KEY }
const stroke = [cellAt(10, 10)!, cellAt(11, 10)!, cellAt(12, 10)!] // the cells just painted, in order
const near = new Map(stroke.map((c) => [c, '🌊'])) // cell → emoji around it, empty cells left out
const joined = await jevJoin((q) => jevAsk(keys, q), near, stroke)
// → { cell, cells, emoji, p, candidates: [{ cell, emoji, p }, …] }
```

On the site, strokes go through the server (palette only, within the painter's ink) into Postgres, the canvas draws
with WebGPU (an emoji atlas and one instanced quad per cell) or Canvas 2D, and it stays live with server-sent events:
the server polls the placements table by id and sends what is new.

MIT licence.
