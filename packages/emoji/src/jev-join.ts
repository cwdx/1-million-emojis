import { sample, type JevAsk } from '@cw/jev'
import { cellAt, cellLabel, line, PALETTE, xy } from './canvas'
import { emojiInfo } from './names'
import { KEYWORDS } from './palette-keywords'

// One request: a Choice over (emoji, place) pairs, and a Noul on whether the stroke is an unfinished shape. The emoji
// share keywords with the scene, so Jev chooses between fitting ones; the pick is drawn wider the less sure Jev is.
export type JevJoined = { cell: number; cells: number[]; emoji: string; p: number; candidates: { cell: number; emoji: string; p: number }[] }

/** How far around a stroke Jev reads, in cells. */
export const MARGIN = 2
const PICTURE = 14
const RELATED = 6
const WILD = 2
/** Above this, Jev finishes the stroke with its own emoji instead of adding one. */
const FINISH = 0.7
const MAX_FINISH = 3
const DIRS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] as const

const WORDS = new Map(PALETTE.map((e) => [e, (KEYWORDS[e] ?? '').split(' ').filter(Boolean)]))
const DF = new Map<string, number>()
for (const ws of WORDS.values()) for (const w of ws) DF.set(w, (DF.get(w) ?? 0) + 1)

const counts = (near: ReadonlyMap<number, string>) => {
  const n = new Map<string, number>()
  for (const e of near.values()) n.set(e, (n.get(e) ?? 0) + 1)
  return [...n].sort((a, b) => b[1] - a[1])
}

/** Emoji sharing the scene's keywords (the rarer, the more they count), a little shuffled, then wildcards; none already in the scene. */
export function relatedEmoji(near: ReadonlyMap<number, string>, random = Math.random): string[] {
  const want = new Map<string, number>()
  for (const [e, n] of counts(near)) for (const w of WORDS.get(e) ?? []) want.set(w, (want.get(w) ?? 0) + n)
  const used = new Set(near.values())
  const scored = PALETTE.flatMap((e) => {
    if (used.has(e)) return []
    const s = (WORDS.get(e) ?? []).reduce((sum, w) => sum + (want.get(w) ?? 0) * Math.log(1 + PALETTE.length / DF.get(w)!), 0)
    return s > 0 ? [[e, s * (0.75 + random() / 2)] as const] : []
  })
  // 🏄‍♂️ and 🏄‍♀️ share their keywords: one of them is enough
  const seen = new Set<string>(), out: string[] = []
  for (const [e] of scored.sort((a, b) => b[1] - a[1])) {
    const k = KEYWORDS[e]!
    if (!seen.has(k)) { seen.add(k); out.push(e) }
    if (out.length === RELATED) break
  }
  for (let t = 0; out.length < RELATED + WILD && t < 50; t++) {
    const e = PALETTE[Math.floor(random() * PALETTE.length)]!
    if (!used.has(e) && !out.includes(e)) out.push(e)
  }
  return out
}

type Shape = { noun: string; closed: boolean; across: boolean }
/** What the stroke looks like: a cell, a line, a loop, a filled patch or a curve. */
export function shapeOf(stroke: readonly number[]): Shape {
  const pts = stroke.map(xy)
  const w = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x)) + 1
  const h = Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y)) + 1
  const a = pts[0]!, b = pts.at(-1)!
  const across = w >= h
  if (stroke.length === 1) return { noun: 'cell', closed: false, across }
  if (stroke.length >= 6 && w >= 3 && h >= 3 && Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= MAX_FINISH + 1) return { noun: 'loop', closed: true, across }
  if (h === 1 || w === 1) return { noun: 'line', closed: false, across }
  if (w >= 3 && h >= 3 && new Set(stroke).size >= w * h * 0.6) return { noun: 'patch', closed: false, across }
  return { noun: 'curve', closed: false, across }
}

type Place = { cell: number; where: string }
/** Up to three empty squares, each named by where it sits against the stroke. */
function placesFor(near: ReadonlyMap<number, string>, stroke: readonly number[], shape: Shape): Place[] {
  const empty = (x: number, y: number) => { const c = cellAt(x, y); return c !== undefined && !near.has(c) ? c : undefined }
  const out: Place[] = []
  const add = (cell: number | undefined, where: string) => { if (cell !== undefined && !out.some((p) => p.cell === cell)) out.push({ cell, where }) }
  const pts = stroke.map(xy), last = pts.at(-1)!, prev = pts.at(-2) ?? { x: last.x - 1, y: last.y }
  if (shape.closed) {
    const cx = Math.round(pts.reduce((s, p) => s + p.x, 0) / pts.length), cy = Math.round(pts.reduce((s, p) => s + p.y, 0) / pts.length)
    add(empty(cx, cy), 'inside the loop')
  } else add(empty(last.x + Math.sign(last.x - prev.x), last.y + Math.sign(last.y - prev.y)), `at the end of the ${shape.noun}, carrying it on`)
  // from the middle of the stroke outwards, the first stroke cell with room on that side
  const middle = pts.map((p, i) => ({ p, d: Math.abs(i - pts.length / 2) })).sort((a, b) => a.d - b.d).map(({ p }) => p)
  const sides = shape.across ? [[0, -1, 'above'], [0, 1, 'below']] as const : [[-1, 0, 'left of'], [1, 0, 'right of']] as const
  for (const [dx, dy, side] of sides) add(middle.map((p) => empty(p.x + dx, p.y + dy)).find((c) => c !== undefined), `${side} the ${shape.noun}`)
  if (!out.length) for (const p of [...pts].reverse()) for (const [dx, dy] of DIRS) add(empty(p.x + dx, p.y + dy), `next to the ${shape.noun}`)
  return out.slice(0, 3)
}

/** The empty cells that would close the loop, or carry the line on; empty if neither fits. */
function finishCells(near: ReadonlyMap<number, string>, stroke: readonly number[], shape: Shape): number[] {
  if (shape.noun === 'cell' || shape.noun === 'patch') return []
  const last = stroke.at(-1)!
  if (shape.closed) return line(last, stroke[0]!).slice(1, -1).filter((c) => !near.has(c)).slice(0, MAX_FINISH)
  const { x, y } = xy(last), prev = xy(stroke.at(-2)!)
  const dx = Math.sign(x - prev.x), dy = Math.sign(y - prev.y)
  const cells: number[] = []
  for (let i = 1; i <= 2; i++) { const c = cellAt(x + dx * i, y + dy * i); if (c === undefined || near.has(c)) break; cells.push(c) }
  return cells
}

/** Rows of emoji, · for an empty cell. */
function picture(near: ReadonlyMap<number, string>, stroke: readonly number[]) {
  const pts = stroke.map(xy)
  const x0 = Math.min(...pts.map((p) => p.x)) - 1, y0 = Math.min(...pts.map((p) => p.y)) - 1
  const w = Math.min(PICTURE, Math.max(...pts.map((p) => p.x)) - x0 + 2), h = Math.min(PICTURE, Math.max(...pts.map((p) => p.y)) - y0 + 2)
  return Array.from({ length: h }, (_, j) => Array.from({ length: w }, (_, i) => { const c = cellAt(x0 + i, y0 + j); return (c !== undefined && near.get(c)) || '·' }).join(''))
}

/** Jev's move next to `stroke`, given the emoji `near` it (cell → emoji); null if Jev did not answer. */
export async function jevJoin(ask: JevAsk, near: ReadonlyMap<number, string>, stroke: readonly number[], random = Math.random): Promise<JevJoined | null> {
  if (!stroke.length) return null
  const shape = shapeOf(stroke)
  const places = placesFor(near, stroke, shape)
  if (!places.length) return null
  const own = near.get(stroke.at(-1)!)
  const ownName = own ? emojiInfo(own).name : 'emoji'
  const options = relatedEmoji(near, random).flatMap((emoji) => places.map((p) => ({ ...p, emoji })))
  const criteria = Object.fromEntries(options.map((o, i) => [`o${i}`, `${o.emoji} ${emojiInfo(o.emoji).name}, ${o.where}`]))
  const finish = own ? finishCells(near, stroke, shape) : []

  const r = await ask({
    state: {
      justPainted: `a ${shape.noun} of ${stroke.length} ${ownName}, ending at ${cellLabel(stroke.at(-1)!)}`,
      around: counts(near).slice(0, 8).map(([e, n]) => `${n}× ${emojiInfo(e).name}`).join(', '),
      picture: picture(near, stroke),
    },
    questions: {
      pick: {
        type: 'choice',
        instructions: 'People draw pictures with emoji on a shared grid, one cell each. Someone just painted a stroke (`justPainted`; `around` counts what is nearby; in `picture`, · is empty). Add one new emoji in one square next to it so the picture grows: something that belongs with what is there, in the place it would be in the same scene.',
        criteria,
      },
      ...(finish.length ? { finish: { type: 'noul' as const, instructions: `The painter meant this stroke to go on: ${finish.length} more ${ownName} would ${shape.closed ? 'close the loop' : 'carry the line on'}, as its painter most likely meant.` } } : {}),
    },
    timeoutMs: 6000,
  })
  const pick = r?.answers.pick
  if (!r || !pick?.probabilities) return null
  const keys = Object.keys(criteria)
  const key = sample(pick.probabilities, keys, 1 - (pick.confidence ?? 0)) ?? pick.choice
  if (!key || !(key in criteria)) return null
  const option = (k: string) => options[Number(k.slice(1))]!
  const candidates = Object.entries(pick.probabilities).filter(([k]) => k in criteria).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, p]) => ({ cell: option(k).cell, emoji: option(k).emoji, p }))
  const done = r.answers.finish?.noul ?? 0
  if (own && done >= FINISH) return { cell: finish.at(-1)!, cells: finish, emoji: own, p: done, candidates }
  const { cell, emoji } = option(key)
  return { cell, cells: [cell], emoji, p: pick.probabilities[key] ?? 0, candidates }
}
