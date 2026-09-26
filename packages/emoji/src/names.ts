import { PALETTE } from './canvas'
import { GROUPS, NAMES } from './palette-names'

// What each palette emoji is called, and its Unicode group (Smileys & Emotion, Animals & Nature, Food & Drink…), from
// the generated table (palette-names.ts): Jev is told names, not only pictures, and draws its options by group.
export type EmojiInfo = { name: string; group: string }
const INFO = new Map(NAMES.map(([e, name, g]) => [e, { name, group: GROUPS[g]! }]))
export const emojiInfo = (e: string): EmojiInfo => INFO.get(e) ?? { name: 'emoji', group: 'Symbols' }

const BY_GROUP = new Map<string, string[]>()
for (const e of PALETTE) { const g = emojiInfo(e).group; BY_GROUP.set(g, [...(BY_GROUP.get(g) ?? []), e]) }
/** An emoji drawn from the palette's `group` (or any group). */
export function drawEmoji(group?: string): string {
  const from = (group && BY_GROUP.get(group)) || PALETTE
  return from[Math.floor(Math.random() * from.length)]!
}
