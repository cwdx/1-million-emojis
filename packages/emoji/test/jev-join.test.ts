import { describe, expect, it } from 'vitest'
import type { JevAsk, JevQuestion } from '@cw/jev'
import { cellAt, xy } from '../src/canvas'
import { jevJoin, relatedEmoji, shapeOf } from '../src/jev-join'

type Asked = Parameters<JevAsk>[0]
const answering = (finish?: number) => {
  const seen: { q?: Asked } = {}
  const ask: JevAsk = async (q) => {
    seen.q = q
    const keys = Object.keys((q.questions.pick as Extract<JevQuestion, { type: 'choice' }>).criteria)
    const pick = { choice: keys[0]!, confidence: 1, probabilities: Object.fromEntries(keys.map((k, i) => [k, i === 0 ? 0.9 : 0.1 / (keys.length - 1)])) }
    return { answers: { pick, ...(finish === undefined ? {} : { finish: { noul: finish } }) }, via: 'typesafe', cost: 0 }
  }
  return { ask, seen }
}
const row = (y: number, x0: number, x1: number) => Array.from({ length: x1 - x0 + 1 }, (_, i) => cellAt(x0 + i, y)!)

describe('jevJoin', () => {
  it('offers related emoji in named places next to the stroke and paints one', async () => {
    const stroke = row(10, 10, 12)
    const near = new Map(stroke.map((c) => [c, '🌊']))
    const { ask, seen } = answering()
    const r = (await jevJoin(ask, near, stroke, () => 0.5))!
    const criteria = Object.values((seen.q!.questions.pick as Extract<JevQuestion, { type: 'choice' }>).criteria)
    expect(criteria.some((o) => o.includes('above the line'))).toBe(true)
    expect(criteria.some((o) => o.includes('at the end of the line'))).toBe(true)
    // every option is new: none offers the stroke's own emoji
    expect(criteria.some((o) => o.startsWith('🌊'))).toBe(false)
    expect(seen.q!.state).toMatchObject({ around: '3× water wave', picture: ['·····', '·🌊🌊🌊·', '·····'] })
    expect(near.has(r.cell)).toBe(false)
    expect(r.cells).toEqual([r.cell])
    const { x, y } = xy(r.cell)
    expect(x >= 9 && x <= 13 && y >= 9 && y <= 11).toBe(true)
  })
  it('finishes the stroke with its own emoji when Jev is sure it is unfinished', async () => {
    const stroke = row(10, 10, 12)
    const near = new Map(stroke.map((c) => [c, '🌊']))
    const r = (await jevJoin(answering(0.9).ask, near, stroke))!
    expect(r).toMatchObject({ emoji: '🌊', cells: [cellAt(13, 10), cellAt(14, 10)] })
    expect((await jevJoin(answering(0.4).ask, near, stroke))!.emoji).not.toBe('🌊')
  })
  it('answers null without a stroke or an answer', async () => {
    expect(await jevJoin(async () => null, new Map(), [])).toBeNull()
    expect(await jevJoin(async () => null, new Map(), [5])).toBeNull()
  })
})

describe('relatedEmoji', () => {
  it('draws from the scene’s keywords, then wildcards, never what is there', () => {
    const near = new Map([[1, '🌊'], [2, '🌊']])
    let seed = 1
    const out = relatedEmoji(near, () => (seed = (seed * 16807) % 2147483647) / 2147483647)
    expect(out).toHaveLength(8)
    expect(out).not.toContain('🌊')
    expect(out.slice(0, 6).some((e) => ['🏄‍♂️', '🏄‍♀️', '🐬', '🦈', '🐙', '🐳', '🐋', '🐡', '🦑', '🐠'].includes(e))).toBe(true)
  })
})

describe('shapeOf', () => {
  it('tells a cell, a line and a loop apart', () => {
    expect(shapeOf([cellAt(5, 5)!]).noun).toBe('cell')
    expect(shapeOf(row(5, 5, 9)).noun).toBe('line')
    const loop = [...row(5, 5, 8), cellAt(8, 6)!, cellAt(8, 7)!, ...row(8, 5, 8).reverse(), cellAt(5, 7)!]
    expect(shapeOf(loop)).toMatchObject({ noun: 'loop', closed: true })
  })
})
