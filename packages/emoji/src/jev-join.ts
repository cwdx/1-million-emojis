import { sample, type JevChoice } from '@cw/jev'
import { cellAt, cellLabel, xy } from './canvas'
import { drawEmoji, emojiGroups, emojiInfo } from './names'

// Jev joins in: after someone paints a stroke, Jev chooses one empty square next to it and what goes there, as one
// typed Choice over (square, emoji) pairs, so a drawing grows by one more cell. Each option says where the square is
// and what is around it, by name ("above: 🌊 water wave"); every option is a new emoji, from the neighbours' Unicode
// group or another, so Jev adds to the picture rather than copying the stroke. Jev also sees the stroke as a small picture. The pick is
// drawn from Jev's probabilities, so it does not settle into one move. `choose` is a Jev Choice call (@cw/jev
// `jevChoose` with its keys, or one that also limits and records calls).
export type JevChoose = (q: { state: unknown; instructions: string; criteria: Record<string, string>; timeoutMs?: number }) => Promise<JevChoice | null>
export type JevJoined = { cell: number; emoji: string; p: number; candidates: { cell: number; emoji: string; p: number }[] }

/** How far around a stroke Jev reads (cells), and how many squares it is offered. */
export const MARGIN = 2
const SQUARES = 6
const PICTURE = 14
const TEMPERATURE = 1
const DIRS = [[-1, -1, 'above left'], [0, -1, 'above'], [1, -1, 'above right'], [-1, 0, 'left'], [1, 0, 'right'], [-1, 1, 'below left'], [0, 1, 'below'], [1, 1, 'below right']] as const

/** The filled cells around `cell`, as [direction, emoji]. */
function around(near: ReadonlyMap<number, string>, cell: number) {
  const { x, y } = xy(cell)
  return DIRS.flatMap(([dx, dy, dir]) => { const c = cellAt(x + dx, y + dy); const e = c === undefined ? undefined : near.get(c); return e ? [[dir, e] as const] : [] })
}

/** The empty squares touching the stroke, latest first, spread along it. */
function frontier(near: ReadonlyMap<number, string>, stroke: readonly number[]) {
  const seen = new Set<number>(), out: number[] = []
  for (const s of [...stroke].reverse()) {
    const { x, y } = xy(s)
    for (const [dx, dy] of DIRS) {
      const c = cellAt(x + dx, y + dy)
      if (c !== undefined && !near.has(c) && !seen.has(c)) { seen.add(c); out.push(c) }
    }
  }
  const step = Math.max(1, Math.floor(out.length / SQUARES))
  return out.filter((_, i) => i % step === 0).slice(0, SQUARES)
}

/** The stroke and its surroundings as rows of emoji (· for an empty cell), at most PICTURE wide and tall. */
function picture(near: ReadonlyMap<number, string>, stroke: readonly number[]) {
  const pts = stroke.map(xy)
  const x0 = Math.min(...pts.map((p) => p.x)) - 1, y0 = Math.min(...pts.map((p) => p.y)) - 1
  const w = Math.min(PICTURE, Math.max(...pts.map((p) => p.x)) - x0 + 2), h = Math.min(PICTURE, Math.max(...pts.map((p) => p.y)) - y0 + 2)
  return Array.from({ length: h }, (_, j) => Array.from({ length: w }, (_, i) => { const c = cellAt(x0 + i, y0 + j); return (c !== undefined && near.get(c)) || '·' }).join(''))
}

/** Jev's square and emoji next to `stroke`, given the emoji `near` it (cell → emoji); null if Jev did not answer. */
export async function jevJoin(choose: JevChoose, near: ReadonlyMap<number, string>, stroke: readonly number[]): Promise<JevJoined | null> {
  if (!stroke.length) return null
  const squares = frontier(near, stroke)
  if (!squares.length) return null
  // Every option is new: two emoji per square, never one already around the stroke (one from the neighbours' group,
  // one from another). Offered the stroke's own emoji, even at only two squares, Jev copied it nearly every time, which
  // adds nothing a painter could not.
  const used = new Set(near.values())
  const options: { cell: number; emoji: string }[] = []
  for (const cell of squares) {
    const next = around(near, cell).map(([, e]) => e)
    const groups = [...new Set(next.map((e) => emojiInfo(e).group))]
    const other = emojiGroups().filter((g) => !groups.includes(g))
    const fresh = (group?: string) => { for (let t = 0; t < 8; t++) { const e = drawEmoji(1, group)[0]!; if (!used.has(e)) { used.add(e); return e } } }
    for (const e of [fresh(groups[Math.floor(Math.random() * groups.length)]), fresh(other[Math.floor(Math.random() * other.length)])]) if (e) options.push({ cell, emoji: e })
  }
  const describe = (o: { cell: number; emoji: string }) => {
    const by = around(near, o.cell).map(([dir, e]) => `${dir}: ${e} ${emojiInfo(e).name}`).join('; ')
    return `${o.emoji} ${emojiInfo(o.emoji).name} at ${cellLabel(o.cell)}${by ? ` (${by})` : ''}`
  }
  const criteria = Object.fromEntries(options.map((o, i) => [`o${i}`, describe(o)]))
  const last = stroke.at(-1)!
  const answer = await choose({
    state: { justPainted: `${stroke.length} cell${stroke.length === 1 ? '' : 's'} of ${near.get(last) ?? 'emoji'}, ending at ${cellLabel(last)}`, picture: picture(near, stroke) },
    instructions: 'People draw pictures with emoji on a shared grid, one cell each. Someone just painted a stroke (see picture, · is empty). Add one new emoji in one square next to it so the picture grows: something that belongs with what is there, as part of the same scene or story. (The emoji of the stroke itself is not offered.)',
    criteria,
    timeoutMs: 6000,
  })
  if (!answer) return null
  const key = sample(answer.probabilities, Object.keys(criteria), TEMPERATURE) ?? answer.choice
  const pick = (k: string) => options[Number(k.slice(1))]!
  return {
    ...pick(key), p: answer.probabilities[key] ?? 0,
    candidates: Object.entries(answer.probabilities).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, p]) => ({ ...pick(k), p })),
  }
}
