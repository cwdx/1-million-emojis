import { PALETTE } from './canvas'
import { GROUPS, NAMES } from './palette-names'

export type EmojiInfo = { name: string; group: string }
const INFO = new Map(NAMES.map(([e, name, g]) => [e, { name, group: GROUPS[g]! }]))
export const emojiInfo = (e: string): EmojiInfo => INFO.get(e) ?? { name: 'emoji', group: 'Symbols' }

const BY_GROUP = new Map<string, string[]>()
for (const e of PALETTE) { const g = emojiInfo(e).group; BY_GROUP.set(g, [...(BY_GROUP.get(g) ?? []), e]) }
/** From `group`, or the whole palette. */
export function drawEmoji(group?: string): string {
  const from = (group && BY_GROUP.get(group)) || PALETTE
  return from[Math.floor(Math.random() * from.length)]!
}
