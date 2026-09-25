import { sample, type JevChoice } from '@cw/jev'
import { drawEmoji, emojiGroups, emojiInfo } from './names'

// Jev paints a cell: it reads the strip around it (the cells either side, in order, each emoji with its name) and
// chooses, as one typed Choice, the emoji that carries the strip on. Its options: the neighbours' own emoji, some from
// their groups (animals beside animals, food beside food) and some from other groups, so there is always something new
// to reach for. The pick is drawn from Jev's probabilities rather than always its first choice, so it does not settle
// into repeating one emoji. `choose` is a Jev Choice call (@cw/jev `jevChoose` with its keys, or one that also limits
// and records calls).
export type JevChoose = (q: { state: unknown; instructions: string; criteria: Record<string, string>; timeoutMs?: number }) => Promise<JevChoice | null>
export type JevPainted = { emoji: string; p: number; candidates: { emoji: string; p: number }[] }

/** The cells read either side of the one painted. */
export const AROUND = 8
const TEMPERATURE = 1

/** Jev's emoji for `cell`, given the emoji `near` it (cell → emoji, empty cells absent); null if Jev did not answer. */
export async function jevPaint(choose: JevChoose, near: ReadonlyMap<number, string>, cell: number): Promise<JevPainted | null> {
  const named = (e: string | undefined) => (e ? `${e} ${emojiInfo(e).name}` : '· empty')
  const strip = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => named(near.get(from + i)))
  const around = [...new Set(near.values())]
  const groups = [...new Set(around.map((e) => emojiInfo(e).group))]
  const others = emojiGroups().filter((g) => !groups.includes(g)).sort(() => Math.random() - 0.5).slice(0, 3)
  const options = [...new Set([
    ...around.slice(0, 4),
    ...groups.flatMap((g) => drawEmoji(4, g)),
    ...others.flatMap((g) => drawEmoji(3, g)),
    ...drawEmoji(4),
  ])].filter((e) => e !== near.get(cell)).slice(0, 20)
  const criteria = Object.fromEntries(options.map((e, i) => [`e${i}`, `${e} ${emojiInfo(e).name} (${emojiInfo(e).group})`]))
  const answer = await choose({
    state: { before: strip(cell - AROUND, cell), thisCell: named(near.get(cell)), after: strip(cell + 1, cell + AROUND + 1) },
    instructions: 'People paint a long strip of emoji, one cell at a time, reading left to right. Choose the emoji for thisCell so the strip reads on: carry on a scene or a little story from the emoji before it, or start a new one where the strip is empty. Repeat a neighbour only when it clearly makes a pattern.',
    criteria,
    timeoutMs: 6000,
  })
  if (!answer) return null
  const key = sample(answer.probabilities, Object.keys(criteria), TEMPERATURE) ?? answer.choice
  const pick = (k: string) => options[Number(k.slice(1))]!
  return {
    emoji: pick(key), p: answer.probabilities[key] ?? 0,
    candidates: Object.entries(answer.probabilities).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, p]) => ({ emoji: pick(k), p })),
  }
}
