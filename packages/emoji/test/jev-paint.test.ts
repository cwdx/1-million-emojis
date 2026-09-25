import { describe, expect, it } from 'vitest'
import { jevPaint, type JevChoose } from '../src/jev-paint'
import { emojiInfo } from '../src/names'

describe('jevPaint', () => {
  it('asks one Choice over named options, the neighbours included, and paints one of them', async () => {
    let asked: Parameters<JevChoose>[0] | undefined
    const choose: JevChoose = async (q) => {
      asked = q
      const keys = Object.keys(q.criteria)
      return { choice: keys[0]!, probabilities: Object.fromEntries(keys.map((k, i) => [k, i === 0 ? 0.9 : 0.1 / (keys.length - 1)])) }
    }
    const r = (await jevPaint(choose, new Map([[9, '🌊'], [11, '🌅']]), 10))!
    const options = Object.values(asked!.criteria)
    expect(options.some((o) => o.startsWith('🌊 water wave'))).toBe(true)
    expect(asked!.state).toMatchObject({ thisCell: '· empty' })
    expect(options.some((o) => o.startsWith(r.emoji))).toBe(true)
    expect(r.candidates.length).toBeGreaterThan(0)
  })
  it('answers null when Jev does not', async () => expect(await jevPaint(async () => null, new Map(), 0)).toBeNull())
  it('names emoji from the Unicode data', () => expect(emojiInfo('🌊')).toEqual(expect.objectContaining({ name: 'water wave' })))
})
