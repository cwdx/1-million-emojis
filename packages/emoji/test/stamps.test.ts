import { describe, expect, it } from 'vitest'
import { cellAt, INK, isPaletteEmoji } from '../src/canvas'
import { COLOURS, stampAt, stampOffsets, STAMPS } from '../src/stamps'

describe('stamps', () => {
  it('each is one load of ink or less, in palette emoji, from known characters only', () => {
    for (const s of STAMPS) {
      const cells = stampOffsets(s)
      expect(cells.length, s.id).toBeGreaterThan(0)
      expect(cells.length, s.id).toBeLessThanOrEqual(INK)
      for (const [, , e] of cells) expect(isPaletteEmoji(e), `${s.id}: ${e}`).toBe(true)
      for (const ch of s.rows.join('')) expect(ch === '.' || ch === ' ' || ch in COLOURS || ch in (s.legend ?? {}), `${s.id}: ${ch}`).toBe(true)
    }
    expect(new Set(STAMPS.map((s) => s.id)).size).toBe(STAMPS.length)
  })
  it('lands centred on the cell, and drops what falls off the canvas', () => {
    const heart = STAMPS.find((s) => s.id === 'heart')!
    const at = stampAt(heart, 10, 10)
    expect(at).toContainEqual([cellAt(10, 12)!, '🟥'])
    expect(at.length).toBe(stampOffsets(heart).length)
    expect(stampAt(heart, 0, 0).length).toBeLessThan(at.length)
  })
})
