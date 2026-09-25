# @cw/emoji

The code behind [1 Million Emojis](https://chriswijnia.com/experiments/emoji): a shared 1000 × 1000 canvas of emoji,
where [TypeSafe AI](https://docs.typesafe.ai/api)'s Jev (System One) joins in with every stroke.

- **The canvas** (`canvas.ts`, no dependencies, safe in a browser): 1000 × 1000 cells, the same on every screen, read
  in 32 × 32 tiles; a painter's ink (60 cells, back one a second); strokes as the cells a line passes through; and a
  palette of 1,792 emoji, each a whole grapheme, so sequences joined with a zero-width joiner stay one emoji.
- **Names** (`names.ts`, `palette-names.ts`): each palette emoji's Unicode name and group, from
  [unicode-emoji-json](https://github.com/muan/unicode-emoji-json), compact enough for a browser to search by name.
- **Jev joins in** (`jev-join.ts`): after someone paints a stroke, Jev chooses one empty square next to it and what goes
  there, as one typed Choice over (square, emoji) pairs, each described by name with what is around it. It sees the
  stroke as a small picture; its pick is drawn from its probabilities, so it does not settle into one move.

```ts
import { jevChoose } from '@cw/jev'
import { cellAt, jevJoin } from '@cw/emoji'

const keys = { gateway: process.env.AI_GATEWAY_API_KEY, typesafe: process.env.TYPESAFE_API_KEY }
const stroke = [cellAt(10, 10)!, cellAt(11, 10)!, cellAt(12, 10)!] // the cells just painted, in order
const near = new Map(stroke.map((c) => [c, '🌊'])) // cell → emoji around it, empty cells left out
const joined = await jevJoin((q) => jevChoose(keys, q), near, stroke)
// → { cell, emoji, p, candidates: [{ cell, emoji, p }, …] }
```

On the site, strokes go through the server (palette only, within the painter's ink) into Postgres, the canvas draws
with WebGPU (an emoji atlas and one instanced quad per cell) or Canvas 2D, and it stays live with server-sent events:
the server polls the placements table by id and sends what is new.

MIT licence.
