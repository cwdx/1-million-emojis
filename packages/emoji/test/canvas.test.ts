import { describe, expect, it } from 'vitest'
import { blockOf, cellAt, cellLabel, CELLS, inkLeft, largestEmpty, isCell, isPaletteEmoji, line, PALETTE, xy } from '../src/canvas'
import { emojiInfo } from '../src/names'

describe('the canvas', () => {
  it('is 1000 × 1000 cells, numbered row by row', () => {
    expect(CELLS).toBe(1_000_000)
    expect(xy(1234)).toEqual({ x: 234, y: 1 })
    expect(cellAt(234, 1)).toBe(1234)
    expect(cellAt(1000, 0)).toBeUndefined()
    expect(isCell(CELLS - 1) && !isCell(CELLS) && !isCell(1.5)).toBe(true)
    expect(cellLabel(1234)).toBe('(234, 1)')
  })
  it('maps cells to minimap blocks', () => expect(blockOf(cellAt(25, 13)!)).toBe(1 * 100 + 2))
  it('fills every cell a stroke passes through', () => {
    expect(line(cellAt(0, 0)!, cellAt(3, 0)!)).toEqual([0, 1, 2, 3])
    expect(line(cellAt(0, 0)!, cellAt(2, 2)!)).toEqual([cellAt(0, 0), cellAt(1, 1), cellAt(2, 2)])
  })
  it('gives each painter a pot of ink', () => { expect(inkLeft(0)).toBe(300); expect(inkLeft(250)).toBe(50); expect(inkLeft(375)).toBe(0) })
})

describe('the palette', () => {
  it('keeps whole emoji, joined sequences and flags included', () => {
    expect(PALETTE.length).toBe(1792)
    for (const e of ['😶‍🌫️', '🇳🇱', '🌊']) expect(isPaletteEmoji(e)).toBe(true)
    for (const e of ['a', '', '🌊🌊', '🦰']) expect(isPaletteEmoji(e)).toBe(false)
  })
  it('knows names and groups', () => {
    expect(emojiInfo('🌊')).toEqual({ name: 'water wave', group: 'Travel & Places' })
  })
})

describe('largestEmpty', () => {
  it('finds the largest empty rectangle by area, not only a square', () => {
    expect(largestEmpty(() => false)).toEqual({ bx: 0, by: 0, w: 100, h: 100 })
    // paint down column 50: the left 50 columns are the biggest rectangle (the right side is 49)
    expect(largestEmpty((b) => b % 100 === 50)).toEqual({ bx: 0, by: 0, w: 50, h: 100 })
    // a painted row at 30 and a column at 80: 80 × 69 below the row beats any square
    const r = largestEmpty((b) => Math.floor(b / 100) === 30 || b % 100 === 80)
    expect(r).toEqual({ bx: 0, by: 31, w: 80, h: 69 })
  })
})
