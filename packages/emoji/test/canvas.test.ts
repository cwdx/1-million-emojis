import { describe, expect, it } from 'vitest'
import { cellLabel, CELLS, chunkOf, chunkRange, isCell, isPaletteEmoji, PALETTE } from '../src/canvas'

describe('the emoji canvas', () => {
  it('keeps a palette of whole emoji, joined sequences and flags included', () => {
    expect(PALETTE.length).toBe(1792)
    expect(new Set(PALETTE).size).toBe(PALETTE.length)
    for (const e of ['😶‍🌫️', '🇳🇱', '🌊']) expect(isPaletteEmoji(e)).toBe(true)
    for (const e of ['😶', 'a', '', ' ', '🌊🌊', '🦰']) expect(isPaletteEmoji(e)).toBe(e === '😶')
  })
  it('numbers a million cells and reads them in chunks', () => {
    expect(isCell(0) && isCell(CELLS - 1)).toBe(true)
    expect(isCell(CELLS) || isCell(-1) || isCell(1.5)).toBe(false)
    expect(chunkOf(1999)).toBe(1)
    expect(chunkRange(999)).toEqual([999000, 1000000])
    expect(cellLabel(42)).toBe('#000042')
  })
})
