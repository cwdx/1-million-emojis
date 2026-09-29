import { cellAt } from './canvas'

// A stamp is ASCII art: rows of characters, each character an emoji. Capitals are the coloured squares, lower case the
// circles, and a stamp's own legend can add any other emoji; `.` and spaces are left empty. Each stays within one
// load of ink (60 cells), and none is anyone's character.
export const COLOURS: Readonly<Record<string, string>> = {
  R: '🟥', O: '🟧', Y: '🟨', G: '🟩', B: '🟦', P: '🟪', N: '🟫', K: '⬛', W: '⬜',
  r: '🔴', o: '🟠', y: '🟡', g: '🟢', b: '🔵', p: '🟣', n: '🟤', k: '⚫', w: '⚪',
}
export type Stamp = { id: string; name: string; rows: readonly string[]; legend?: Readonly<Record<string, string>> }

export const STAMPS: readonly Stamp[] = [
  { id: 'heart', name: 'Heart', rows: ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'] },
  { id: 'smiley', name: 'Smiley', rows: ['.YYYYY.', 'YYYYYYY', 'YKYYYKY', 'YYYYYYY', 'YKYYYKY', 'YYKKKYY', '.YYYYY.'] },
  { id: 'sun', name: 'Sun', rows: ['y..y..y', '.YYYYY.', '.YYYYY.', 'yYYYYYy', '.YYYYY.', '.YYYYY.', 'y..y..y'] },
  { id: 'rainbow', name: 'Rainbow', rows: ['...RRRRR...', '..ROOOOOR..', '.ROYYYYYOR.', 'ROYGGGGGYOR', 'ROYG...GYOR', 'ROYG...GYOR'] },
  { id: 'cloud', name: 'Rain cloud', rows: ['..WWW...', '.WWWWWW.', 'WWWWWWWW', '.WWWWWW.', '.b.b.b..', 'b.b.b...'] },
  { id: 'star', name: 'Star', rows: ['...Y...', '...Y...', 'YYYYYYY', '.YYYYY.', '..YYY..', '.YY.YY.', 'YY...YY'] },
  { id: 'house', name: 'House', rows: ['...R...', '..RRR..', '.RRRRR.', 'RRRRRRR', '.WWWWW.', '.WBWNW.', '.WWWNW.'] },
  { id: 'tree', name: 'Tree', rows: ['..GGG..', '.GGGGG.', 'GGGGGGG', '.GGGGG.', '..GGG..', '...N...', '...N...'] },
  { id: 'flower', name: 'Flower', rows: ['.P.P.', 'PPyPP', '.PPP.', '..G..', '.GG..', '..G..'] },
  { id: 'mushroom', name: 'Mushroom', rows: ['..RRRR..', '.RWRRWR.', 'RRRRRRRR', 'RWRRRRWR', '..WWWW..', '..WKKW..', '..WWWW..'] },
  { id: 'fish', name: 'Fish', rows: ['..BBB...', '.BBBBB.B', 'BBKBBBBB', '.BBBBB.B', '..BBB...'] },
  { id: 'cat', name: 'Cat', rows: ['K.....K', 'KK...KK', 'KKKKKKK', 'KGKKKGK', 'KKKWKKK', '.KKKKK.'] },
  { id: 'ghost', name: 'Ghost', rows: ['..WWW..', '.WWWWW.', 'WWKWKWW', 'WWWWWWW', 'WWWWWWW', 'W.W.W.W'] },
  { id: 'rocket', name: 'Rocket', rows: ['...R...', '..WWW..', '..WBW..', '..WWW..', '..WWW..', '.RWWWR.', 'RR.O.RR', '...*...'], legend: { '*': '🔥' } },
  { id: 'crown', name: 'Crown', rows: ['Y..Y..Y', 'YY.Y.YY', 'YYYYYYY', 'YrYbYrY', 'YYYYYYY'] },
  { id: 'globe', name: 'Globe', rows: ['.BBGB.', 'BGGBBB', 'BBGGGB', 'BBBGBB', '.BBBB.'] },
  { id: 'night', name: 'Moon and stars', rows: ['*....YY', '....YY.', '..*YY..', '...YY..', '*...YY.', '.....YY'], legend: { '*': '⭐' } },
]

const emojiOf = (stamp: Stamp, ch: string) => stamp.legend?.[ch] ?? COLOURS[ch]

/** The stamp's [dx, dy, emoji] from its middle, so it lands centred on the cell pointed at. */
export function stampOffsets(stamp: Stamp): [number, number, string][] {
  const h = stamp.rows.length, w = Math.max(...stamp.rows.map((r) => r.length))
  const x0 = Math.floor(w / 2), y0 = Math.floor(h / 2)
  return stamp.rows.flatMap((row, y) => [...row].flatMap((ch, x) => {
    const e = emojiOf(stamp, ch)
    return e ? [[x - x0, y - y0, e] as [number, number, string]] : []
  }))
}

/** The stamp centred at (x, y): [cell, emoji] pairs, without the cells that fall off the canvas. */
export function stampAt(stamp: Stamp, x: number, y: number): [number, string][] {
  return stampOffsets(stamp).flatMap(([dx, dy, e]) => { const c = cellAt(x + dx, y + dy); return c === undefined ? [] : [[c, e] as [number, string]] })
}
