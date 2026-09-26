import { describe, expect, it } from 'vitest'
import { blockOf, cellAt, cellLabel, CELLS, inkLeft, isCell, isPaletteEmoji, isTile, line, PALETTE, TILES, tileOf, tileRanges, xy } from '../src/canvas'
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
  it('is read in tiles, one range per row', () => {
    expect(TILES).toBe(32)
    expect(tileOf(cellAt(33, 64)!)).toEqual({ tx: 1, ty: 2 })
    expect(tileRanges(0, 0)[1]).toEqual([1000, 1031])
    expect(tileRanges(31, 31)).toHaveLength(8) // the last tile: rows 992–999, columns 992–999
    expect(tileRanges(31, 31)[0]).toEqual([cellAt(992, 992), cellAt(999, 992)])
    expect(isTile(31, 0) && !isTile(32, 0)).toBe(true)
  })
  it('maps cells to minimap blocks', () => expect(blockOf(cellAt(25, 13)!)).toBe(1 * 100 + 2))
  it('fills every cell a stroke passes through', () => {
    expect(line(cellAt(0, 0)!, cellAt(3, 0)!)).toEqual([0, 1, 2, 3])
    expect(line(cellAt(0, 0)!, cellAt(2, 2)!)).toEqual([cellAt(0, 0), cellAt(1, 1), cellAt(2, 2)])
  })
  it('gives each painter a pot of ink', () => { expect(inkLeft(0)).toBe(60); expect(inkLeft(75)).toBe(0) })
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
