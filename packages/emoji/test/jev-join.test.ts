import { describe, expect, it } from 'vitest'
import { cellAt } from '../src/canvas'
import { jevJoin, type JevChoose } from '../src/jev-join'

describe('jevJoin', () => {
  it('offers named squares next to the stroke and paints one of them', async () => {
    let asked: Parameters<JevChoose>[0] | undefined
    const choose: JevChoose = async (q) => {
      asked = q
      const keys = Object.keys(q.criteria)
      return { choice: keys[0]!, probabilities: Object.fromEntries(keys.map((k, i) => [k, i === 0 ? 0.9 : 0.1 / (keys.length - 1)])) }
    }
    const stroke = [cellAt(10, 10)!, cellAt(11, 10)!, cellAt(12, 10)!]
    const near = new Map(stroke.map((c) => [c, '🌊']))
    const r = (await jevJoin(choose, near, stroke))!
    expect(near.has(r.cell)).toBe(false)
    expect(Object.values(asked!.criteria).some((o) => o.includes('water wave'))).toBe(true)
    expect(asked!.state).toMatchObject({ picture: ['·····', '·🌊🌊🌊·', '·····'] })
    const { x, y } = { x: r.cell % 1000, y: Math.floor(r.cell / 1000) }
    expect(x >= 9 && x <= 13 && y >= 9 && y <= 11).toBe(true)
  })
  it('answers null without a stroke or an answer', async () => {
    expect(await jevJoin(async () => null, new Map(), [])).toBeNull()
    expect(await jevJoin(async () => null, new Map(), [5])).toBeNull()
  })
})
