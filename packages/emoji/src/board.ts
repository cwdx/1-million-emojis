import { PALETTE } from './canvas'

// The whole canvas as one string: the painted cells in order, each as the gap from the one before (a varint) and two
// bytes (its palette index + 1, the top bit set when Jev painted it), in base64url. Sparse or full, it packs small:
// a full canvas is all gaps of one.
const INDEX = new Map(PALETTE.map((e, i) => [e, i]))
const JEV = 0x8000

export function encodeBoard(cells: Iterable<readonly [number, string, boolean]>): string {
  const bytes: number[] = []
  let prev = -1
  for (const [cell, emoji, jev] of [...cells].sort((a, b) => a[0] - b[0])) {
    const i = INDEX.get(emoji)
    if (i === undefined) continue
    for (let gap = cell - prev; ; gap >>>= 7) { if (gap < 0x80) { bytes.push(gap); break } bytes.push((gap & 0x7f) | 0x80) }
    const v = (i + 1) | (jev ? JEV : 0)
    bytes.push(v & 0xff, v >> 8)
    prev = cell
  }
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.slice(i, i + 0x8000))
  return btoa(s).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export function decodeBoard(packed: string): [number, string, boolean][] {
  const s = atob(packed.replaceAll('-', '+').replaceAll('_', '/'))
  const out: [number, string, boolean][] = []
  let at = 0, prev = -1
  while (at < s.length) {
    let gap = 0
    for (let shift = 0; ; shift += 7) { const b = s.charCodeAt(at++); gap |= (b & 0x7f) << shift; if (b < 0x80) break }
    const v = s.charCodeAt(at) | (s.charCodeAt(at + 1) << 8)
    at += 2
    prev += gap
    const emoji = PALETTE[(v & ~JEV) - 1]
    if (emoji) out.push([prev, emoji, (v & JEV) !== 0])
  }
  return out
}
