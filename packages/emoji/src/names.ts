import { PALETTE } from './canvas'
import data from 'unicode-emoji-json/data-by-emoji.json'

// What each palette emoji is called, and its Unicode group (Smileys & Emotion, Animals & Nature, Food & Drink…), from
// the Unicode data (unicode-emoji-json): Jev is told the names, not only the pictures, and draws its options by group.
type Entry = { name: string; group: string }
const byEmoji = data as Record<string, Entry>
const bare = (e: string) => e.replace(/️/g, '')
const byBare = new Map(Object.entries(byEmoji).map(([k, v]) => [bare(k), v]))
export const emojiInfo = (e: string): Entry => byEmoji[e] ?? byBare.get(bare(e)) ?? { name: 'emoji', group: 'Symbols' }

const GROUPS = new Map<string, string[]>()
for (const e of PALETTE) {
  const g = emojiInfo(e).group
  GROUPS.set(g, [...(GROUPS.get(g) ?? []), e])
}
const draw = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]!
/** `n` emoji drawn from the palette's `group` (or any group). */
export function drawEmoji(n: number, group?: string): string[] {
  const from = (group && GROUPS.get(group)) || PALETTE
  return Array.from({ length: n }, () => draw(from))
}
export const emojiGroups = () => [...GROUPS.keys()]
