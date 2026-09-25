import { PALETTE } from './canvas'
import { GROUPS, NAMES } from './palette-names'

// What each palette emoji is called, and its Unicode group (Smileys & Emotion, Animals & Nature, Food & Drink…), from
// the generated table (palette-names.ts): Jev is told names, not only pictures, and draws its options by group.
export type EmojiInfo = { name: string; group: string }
const INFO = new Map(NAMES.map(([e, name, g]) => [e, { name, group: GROUPS[g]! }]))
export const emojiInfo = (e: string): EmojiInfo => INFO.get(e) ?? { name: 'emoji', group: 'Symbols' }
export const emojiGroups = (): readonly string[] => GROUPS

const BY_GROUP = new Map<string, string[]>()
for (const e of PALETTE) BY_GROUP.set(emojiInfo(e).group, [...(BY_GROUP.get(emojiInfo(e).group) ?? []), e])
/** The palette's emoji in `group`. */
export const inGroup = (group: string): readonly string[] => BY_GROUP.get(group) ?? []
const draw = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]!
/** `n` emoji drawn from the palette's `group` (or any group). */
export function drawEmoji(n: number, group?: string): string[] {
  const from = (group && BY_GROUP.get(group)) || PALETTE
  return Array.from({ length: n }, () => draw(from))
}
/** The palette emoji whose name has every word of `query` (lower case), in palette order. */
export function searchPalette(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return words.length ? PALETTE.filter((e) => words.every((w) => emojiInfo(e).name.includes(w))) : [...PALETTE]
}
