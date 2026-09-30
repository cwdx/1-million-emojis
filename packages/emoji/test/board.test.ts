import { describe, expect, it } from 'vitest'
import { decodeBoard, encodeBoard } from '../src/board'
import { CELLS, PALETTE } from '../src/canvas'

describe('the board bytes', () => {
  it('round-trips painted cells, Jev marks and far gaps, in cell order', () => {
    const cells: [number, string, boolean][] = [[999_999, '🌊', false], [0, '😀', true], [1, PALETTE.at(-1)!, false], [500_000, '🦈', true]]
    expect(decodeBoard(encodeBoard(cells))).toEqual([...cells].sort((a, b) => a[0] - b[0]))
    expect(decodeBoard(encodeBoard([]))).toEqual([])
  })
  it('skips an emoji the palette has lost, and packs a full canvas small', () => {
    expect(decodeBoard(encodeBoard([[5, 'not an emoji', false], [6, '🔥', false]]))).toEqual([[6, '🔥', false]])
    const full = Array.from({ length: CELLS }, (_, c) => [c, '🌊', false] as [number, string, boolean])
    const packed = encodeBoard(full)
    expect(packed.length).toBe(CELLS * 3)
    expect(decodeBoard(packed)).toHaveLength(CELLS)
  })
})
