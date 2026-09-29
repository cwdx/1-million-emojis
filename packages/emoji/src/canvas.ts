// No dependencies, so a page can import it.

export const SIZE = 1000
export const CELLS = SIZE * SIZE
export type Painter = 'human' | 'jev'
export type Cell = { cell: number; emoji: string; painter: Painter }

export const isCell = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < CELLS
export const xy = (cell: number) => ({ x: cell % SIZE, y: Math.floor(cell / SIZE) })
export const cellAt = (x: number, y: number) => (x >= 0 && y >= 0 && x < SIZE && y < SIZE ? y * SIZE + x : undefined)
export const cellLabel = (cell: number) => { const { x, y } = xy(cell); return `(${x}, ${y})` }

/** Each tile is one query, of one cell range per row. */
export const TILE = 32
export const TILES = Math.ceil(SIZE / TILE)
export const tileOf = (cell: number) => { const { x, y } = xy(cell); return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) } }
export const isTile = (tx: number, ty: number) => Number.isInteger(tx) && Number.isInteger(ty) && tx >= 0 && ty >= 0 && tx < TILES && ty < TILES
/** [first, last] per row. */
export function tileRanges(tx: number, ty: number): [number, number][] {
  const x0 = tx * TILE, x1 = Math.min(SIZE, x0 + TILE) - 1
  return Array.from({ length: Math.min(SIZE, (ty + 1) * TILE) - ty * TILE }, (_, i) => [cellAt(x0, ty * TILE + i)!, cellAt(x1, ty * TILE + i)!])
}

/** The minimap's blocks, numbered row by row. */
export const BLOCK = 10
export const BLOCKS = SIZE / BLOCK
export const blockOf = (cell: number) => { const { x, y } = xy(cell); return Math.floor(y / BLOCK) * BLOCKS + Math.floor(x / BLOCK) }

/** The largest empty rectangle of blocks, by area, from which blocks hold paint: its top-left block and size, in blocks.
 * The classic maximal-rectangle method: row by row, each column's run of empty blocks upwards is a histogram, and a
 * stack finds the largest rectangle under it in one pass, O(rows × columns). Ties go to the one nearest the middle. */
export function largestEmpty(filled: (block: number) => boolean): { bx: number; by: number; w: number; h: number } {
  const up = new Array<number>(BLOCKS).fill(0)
  let best = { bx: 0, by: 0, w: 0, h: 0 }, bestD = Infinity
  const consider = (bx: number, by: number, w: number, h: number) => {
    const area = w * h, d = Math.hypot(bx + w / 2 - BLOCKS / 2, by + h / 2 - BLOCKS / 2)
    if (area > best.w * best.h || (area === best.w * best.h && d < bestD)) { best = { bx, by, w, h }; bestD = d }
  }
  for (let by = 0; by < BLOCKS; by++) {
    for (let bx = 0; bx < BLOCKS; bx++) up[bx] = filled(by * BLOCKS + bx) ? 0 : up[bx]! + 1
    // columns with rising heights; at a drop, every taller bar left of it ends its rectangle here
    const stack: number[] = []
    for (let bx = 0; bx <= BLOCKS; bx++) {
      const height = bx < BLOCKS ? up[bx]! : 0
      while (stack.length && up[stack.at(-1)!]! >= height) {
        const top = stack.pop()!, h = up[top]!, left = stack.length ? stack.at(-1)! + 1 : 0
        if (h) consider(left, by - h + 1, bx - left, h)
      }
      stack.push(bx)
    }
  }
  return best
}

/** A painter's INK cells come back over INK_WINDOW (five a second): a stroke can be long, but nobody floods the canvas. */
export const INK = 300
export const INK_WINDOW = 60 * 1000
/** Ink back each second. */
export const INK_PER_SECOND = INK / (INK_WINDOW / 1000)
export const inkLeft = (placedInWindow: number) => Math.max(0, INK - placedInWindow)

/** Every cell from `a` to `b` (Bresenham), so a fast stroke leaves no gaps. */
export function line(a: number, b: number): number[] {
  let { x: x0, y: y0 } = xy(a)
  const { x: x1, y: y1 } = xy(b)
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  const out: number[] = []
  for (;;) {
    out.push(cellAt(x0, y0)!)
    if (x0 === x1 && y0 === y1) return out
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x0 += sx }
    if (e2 <= dx) { err += dx; y0 += sy }
  }
}

// Split by grapheme, so zero-width-joiner sequences stay one emoji.
const PALETTE_TEXT = '😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗☺️😚😙🥲😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😶‍🌫️😏😒🙄😬😮‍💨🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵😵‍💫🤯🤠🥳🥸😎🤓🧐😕😟🙁☹️😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀☠️💩🤡👹👺👻👽👾🤖😺😸😹😻😼😽🙀😿😾🙈🙉🙊💋💌💘💝💖💗💓💞💕💟❣️💔❤️🧡💛💚💙💜🤎🖤🤍💯💢💥💫💦💨🕳️💣💬🗨️🗯️💭💤👋🤚🖐️✋🖖👌🤌🤏✌️🤞🤟🤘🤙👈👉👆🖕👇☝️👍👎✊👊🤛🤜👏🙌👐🤲🤝🙏✍️💅🤳💪🦾🦿🦵🦶👂🦻👃🧠🫀🫁🦷🦴👀👁️👅👄👶🧒👦👧🧑👱👨🧔👨‍🦰👨‍🦱👨‍🦳👨‍🦲👩👩‍🦰🧑‍🦰👩‍🦱🧑‍🦱👩‍🦳🧑‍🦳👩‍🦲🧑‍🦲👱‍♀️👱‍♂️🧓👴👵🙍🙍‍♂️🙍‍♀️🙎🙎‍♂️🙎‍♀️🙅🙅‍♂️🙅‍♀️🙆🙆‍♂️🙆‍♀️💁💁‍♂️💁‍♀️🙋🙋‍♂️🙋‍♀️🧏🧏‍♂️🧏‍♀️🙇🙇‍♂️🙇‍♀️🤦🤦‍♂️🤦‍♀️🤷🤷‍♂️🤷‍♀️🧑‍⚕️👨‍⚕️👩‍⚕️🧑‍🎓👨‍🎓👩‍🎓🧑‍🏫👨‍🏫👩‍🏫🧑‍⚖️👨‍⚖️👩‍⚖️🧑‍🌾👨‍🌾👩‍🌾🧑‍🍳👨‍🍳👩‍🍳🧑‍🔧👨‍🔧👩‍🔧🧑‍🏭👨‍🏭👩‍🏭🧑‍💼👨‍💼👩‍💼🧑‍🔬👨‍🔬👩‍🔬🧑‍💻👨‍💻👩‍💻🧑‍🎤👨‍🎤👩‍🎤🧑‍🎨👨‍🎨👩‍🎨🧑‍✈️👨‍✈️👩‍✈️🧑‍🚀👨‍🚀👩‍🚀🧑‍🚒👨‍🚒👩‍🚒👮👮‍♂️👮‍♀️🕵️🕵️‍♂️🕵️‍♀️💂💂‍♂️💂‍♀️🥷👷👷‍♂️👷‍♀️🤴👸👳👳‍♂️👳‍♀️👲🧕🤵🤵‍♂️🤵‍♀️👰👰‍♂️👰‍♀️🤰🤱👩‍🍼👨‍🍼🧑‍🍼👼🎅🤶🧑‍🎄🦸🦸‍♂️🦸‍♀️🦹🦹‍♂️🦹‍♀️🧙🧙‍♂️🧙‍♀️🧚🧚‍♂️🧚‍♀️🧛🧛‍♂️🧛‍♀️🧜🧜‍♂️🧜‍♀️🧝🧝‍♂️🧝‍♀️🧞🧞‍♂️🧞‍♀️🧟🧟‍♂️🧟‍♀️💆💆‍♂️💆‍♀️💇💇‍♂️💇‍♀️🚶🚶‍♂️🚶‍♀️🧍🧍‍♂️🧍‍♀️🧎🧎‍♂️🧎‍♀️🧑‍🦯👨‍🦯👩‍🦯🧑‍🦼👨‍🦼👩‍🦼🧑‍🦽👨‍🦽👩‍🦽🏃🏃‍♂️🏃‍♀️💃🕺🕴️👯👯‍♂️👯‍♀️🧖🧖‍♂️🧖‍♀️🧗🧗‍♂️🧗‍♀️🤺🏇⛷️🏂🏌️🏌️‍♂️🏌️‍♀️🏄🏄‍♂️🏄‍♀️🚣🚣‍♂️🚣‍♀️🏊🏊‍♂️🏊‍♀️⛹️⛹️‍♂️⛹️‍♀️🏋️🏋️‍♂️🏋️‍♀️🚴🚴‍♂️🚴‍♀️🚵🚵‍♂️🚵‍♀️🤸🤸‍♂️🤸‍♀️🤼🤼‍♂️🤼‍♀️🤽🤽‍♂️🤽‍♀️🤾🤾‍♂️🤾‍♀️🤹🤹‍♂️🤹‍♀️🧘🧘‍♂️🧘‍♀️🛀🛌🧑‍🤝‍🧑👭👫👬💏👩‍❤️‍💋‍👨👨‍❤️‍💋‍👨👩‍❤️‍💋‍👩💑👩‍❤️‍👨👨‍❤️‍👨👩‍❤️‍👩👪👨‍👩‍👦👨‍👩‍👧👨‍👩‍👧‍👦👨‍👩‍👦‍👦👨‍👩‍👧‍👧👨‍👨‍👦👨‍👨‍👧👨‍👨‍👧‍👦👨‍👨‍👦‍👦👨‍👨‍👧‍👧👩‍👩‍👦👩‍👩‍👧👩‍👩‍👧‍👦👩‍👩‍👦‍👦👩‍👩‍👧‍👧👨‍👦👨‍👦‍👦👨‍👧👨‍👧‍👦👨‍👧‍👧👩‍👦👩‍👦‍👦👩‍👧👩‍👧‍👦👩‍👧‍👧🗣️👤👥🫂👣🦰🦱🦳🦲🐵🐒🦍🦧🐶🐕🦮🐕‍🦺🐩🐺🦊🦝🐱🐈🐈‍⬛🦁🐯🐅🐆🐴🐎🦄🦓🦌🦬🐮🐂🐃🐄🐷🐖🐗🐽🐏🐑🐐🐪🐫🦙🦒🐘🦣🦏🦛🐭🐁🐀🐹🐰🐇🐿️🦫🦔🦇🐻🐻‍❄️🐨🐼🦥🦦🦨🦘🦡🐾🦃🐔🐓🐣🐤🐥🐦🐧🕊️🦅🦆🦢🦉🦤🪶🦩🦚🦜🐸🐊🐢🦎🐍🐲🐉🦕🦖🐳🐋🐬🦭🐟🐠🐡🦈🐙🐚🐌🦋🐛🐜🐝🪲🐞🦗🕷️🕸️🦂🦟🪳🪰🪱🦠💐🌸💮🏵️🌹🥀🌺🌻🌼🌷🌱🪴🌲🌳🌴🌵🌾🌿☘️🍀🍁🍂🍃🍇🍈🍉🍊🍋🍌🍍🥭🍎🍏🍐🍑🍒🍓🫐🥝🍅🫒🥥🥑🍆🥔🥕🌽🌶️🫑🥒🥬🥦🧄🧅🍄🥜🌰🍞🥐🥖🫓🥨🥯🥞🧇🧀🍖🍗🥩🥓🍔🍟🍕🌭🥪🌮🌯🫔🥙🧆🥚🍳🥘🍲🫕🥣🥗🍿🧈🧂🥫🍱🍘🍙🍚🍛🍜🍝🍠🍢🍣🍤🍥🥮🍡🥟🥠🥡🦀🦞🦐🦑🦪🍦🍧🍨🍩🍪🎂🍰🧁🥧🍫🍬🍭🍮🍯🍼🥛☕🫖🍵🍶🍾🍷🍸🍹🍺🍻🥂🥃🥤🧋🧃🧉🧊🥢🍽️🍴🥄🔪🏺🌍🌎🌏🌐🗺️🗾🧭🏔️⛰️🌋🗻🏕️🏖️🏜️🏝️🏞️🏟️🏛️🏗️🧱🪨🪵🛖🏘️🏚️🏠🏡🏢🏣🏤🏥🏦🏨🏩🏪🏫🏬🏭🏯🏰💒🗼🗽⛪🕌🛕🕍⛩️🕋⛲⛺🌁🌃🏙️🌄🌅🌆🌇🌉♨️🎠🎡🎢💈🎪🚂🚃🚄🚅🚆🚇🚈🚉🚊🚝🚞🚋🚌🚍🚎🚐🚑🚒🚓🚔🚕🚖🚗🚘🚙🛻🚚🚛🚜🏎️🏍️🛵🦽🦼🛺🚲🛴🛹🛼🚏🛣️🛤️🛢️⛽🚨🚥🚦🛑🚧⚓⛵🛶🚤🛳️⛴️🛥️🚢✈️🛩️🛫🛬🪂💺🚁🚟🚠🚡🛰️🚀🛸🛎️🧳⌛⏳⌚⏰⏱️⏲️🕰️🕛🕧🕐🕜🕑🕝🕒🕞🕓🕟🕔🕠🕕🕡🕖🕢🕗🕣🕘🕤🕙🕥🕚🕦🌑🌒🌓🌔🌕🌖🌗🌘🌙🌚🌛🌜🌡️☀️🌝🌞🪐⭐🌟🌠🌌☁️⛅⛈️🌤️🌥️🌦️🌧️🌨️🌩️🌪️🌫️🌬️🌀🌈🌂☂️☔⛱️⚡❄️☃️⛄☄️🔥💧🌊🎃🎄🎆🎇🧨✨🎈🎉🎊🎋🎍🎎🎏🎐🎑🧧🎀🎁🎗️🎟️🎫🎖️🏆🏅🥇🥈🥉🏐🏀🏈🏉🎾🥎🎳🏏🏑🏒🥍🏓🏸🥊🥋🥅⛳⛸️🎣🤿🎽🎿🛷🥌🎯🪀🪁🎱🔮🪄🧿🎮🕹️🎰🎲🧩🧸🪅🪆♠️♥️♦️♣️♟️🃏🀄🎴🎭🖼️🎨🧵🪡🧶🪢👓🕶️🥽🥼🦺👔👕👖🧣🧤🧥🧦👗👘🥻🩱🩲🩳👙👚👛👜👝🛍️🎒🩴👞👟🥾🥿👠👡🩰👢👑👒🎩🎓🧢🪖⛑️📿💄💍💎🔇🔈🔉🔊📢📣📯🔔🔕🎼🎵🎶🎙️🎚️🎛️🎤🎧📻🎷🪗🎸🎹🎺🎻🪕🥁🪘📱📲☎️📞📟📠🔋🔌💻🖥️🖨️⌨️🖱️🖲️💽💾💿📀🧮🎥🎞️📽️🎬📺📷📸📹📼🔍🔎🕯️💡🔦🏮🪔📔📕📖📗📘📙📚📓📒📃📜📄📰🗞️📑🔖🏷️💰🪙💴💵💶💷💸💳🧾💹✉️📧📨📩📤📥📦📫📪📬📭📮🗳️✏️✒️🖋️🖊️🖌️🖍️📝💼📁📂🗂️📅📆🗒️🗓️📇📈📉📊📋📌📍📎🖇️📏📐✂️🗃️🗄️🗑️🔒🔓🔏🔐🔑🗝️🔨🪓⛏️⚒️🛠️🗡️⚔️🔫🪃🏹🛡️🪚🔧🪛🔩⚙️🗜️⚖️🦯🔗⛓️🪝🧰🧲🪜⚗️🧪🧫🧬🔬🔭📡💉🩸💊🩹🩺🚪🛗🪞🪟🛏️🛋️🪑🚽🪠🚿🛁🪤🪒🧴🧷🧹🧺🧻🪣🧼🪥🧽🧯🛒🚬⚰️🪦⚱️🗿🪧🏧🚮🚰♿🚹🚺🚻🚼🚾🛂🛃🛄🛅⚠️🚸⛔🚫🚳🚭🚯🚱🚷📵🔞☢️☣️⬆️↗️➡️↘️⬇️↙️⬅️↖️↕️↔️↩️↪️⤴️⤵️🔃🔄🔙🔚🔛🔜🔝🛐⚛️🕉️✡️☸️☯️✝️☦️☪️☮️🕎🔯♈♉♊♋♌♍♎♏♐♑♒♓⛎🔀🔁🔂▶️⏩⏭️⏯️◀️⏪⏮️🔼⏫🔽⏬⏸️⏹️⏺️⏏️🎦🔅🔆📶📳📴♀️♂️⚧️✖️➕➖➗♾️‼️⁉️❓❔❕❗〰️💱💲⚕️♻️⚜️🔱📛🔰⭕✅☑️✔️❌❎➰➿〽️✳️✴️❇️©️®️™️🔟🔠🔡🔢🔣🔤🅰️🆎🅱️🆑🆒🆓ℹ️🆔Ⓜ️🆕🆖🅾️🆗🅿️🆘🆙🆚🈁🈂️🈷️🈶🈯🉐🈹🈚🈲🉑🈸🈴🈳㊗️㊙️🈺🈵🔴🟠🟡🟢🔵🟣🟤⚫⚪🟥🟧🟨🟩🟦🟪🟫⬛⬜◼️◻️◾◽▪️▫️🔶🔷🔸🔹🔺🔻💠🔘🔳🔲🏁🚩🎌🏴🏳️🏳️‍🌈🏳️‍⚧️🏴‍☠️🇦🇨🇦🇩🇦🇪🇦🇫🇦🇬🇦🇮🇦🇱🇦🇲🇦🇴🇦🇶🇦🇷🇦🇸🇦🇹🇦🇺🇦🇼🇦🇽🇦🇿🇧🇦🇧🇧🇧🇩🇧🇪🇧🇫🇧🇬🇧🇭🇧🇮🇧🇯🇧🇱🇧🇲🇧🇳🇧🇴🇧🇶🇧🇷🇧🇸🇧🇹🇧🇻🇧🇼🇧🇾🇧🇿🇨🇦🇨🇨🇨🇩🇨🇫🇨🇬🇨🇭🇨🇮🇨🇰🇨🇱🇨🇲🇨🇳🇨🇴🇨🇵🇨🇷🇨🇺🇨🇻🇨🇼🇨🇽🇨🇾🇨🇿🇩🇪🇩🇬🇩🇯🇩🇰🇩🇲🇩🇴🇩🇿🇪🇦🇪🇨🇪🇪🇪🇬🇪🇭🇪🇷🇪🇸🇪🇹🇪🇺🇫🇮🇫🇯🇫🇰🇫🇲🇫🇴🇫🇷🇬🇦🇬🇧🇬🇩🇬🇪🇬🇫🇬🇬🇬🇭🇬🇮🇬🇱🇬🇲🇬🇳🇬🇵🇬🇶🇬🇷🇬🇸🇬🇹🇬🇺🇬🇼🇬🇾🇭🇰🇭🇲🇭🇳🇭🇷🇭🇹🇭🇺🇮🇨🇮🇩🇮🇪🇮🇱🇮🇲🇮🇳🇮🇴🇮🇶🇮🇷🇮🇸🇮🇹🇯🇪🇯🇲🇯🇴🇯🇵🇰🇪🇰🇬🇰🇭🇰🇮🇰🇲🇰🇳🇰🇵🇰🇷🇰🇼🇰🇾🇰🇿🇱🇦🇱🇧🇱🇨🇱🇮🇱🇰🇱🇷🇱🇸🇱🇹🇱🇺🇱🇻🇱🇾🇲🇦🇲🇨🇲🇩🇲🇪🇲🇫🇲🇬🇲🇭🇲🇰🇲🇱🇲🇲🇲🇳🇲🇴🇲🇵🇲🇶🇲🇷🇲🇸🇲🇹🇲🇺🇲🇻🇲🇼🇲🇽🇲🇾🇲🇿🇳🇦🇳🇨🇳🇪🇳🇫🇳🇬🇳🇮🇳🇱🇳🇴🇳🇵🇳🇷🇳🇺🇳🇿🇴🇲🇵🇦🇵🇪🇵🇫🇵🇬🇵🇭🇵🇰🇵🇱🇵🇲🇵🇳🇵🇷🇵🇸🇵🇹🇵🇼🇵🇾🇶🇦🇷🇪🇷🇴🇷🇸🇷🇺🇷🇼🇸🇦🇸🇧🇸🇨🇸🇩🇸🇪🇸🇬🇸🇭🇸🇮🇸🇯🇸🇰🇸🇱🇸🇲🇸🇳🇸🇴🇸🇷🇸🇸🇸🇹🇸🇻🇸🇽🇸🇾🇸🇿🇹🇦🇹🇨🇹🇩🇹🇫🇹🇬🇹🇭🇹🇯🇹🇰🇹🇱🇹🇲🇹🇳🇹🇴🇹🇷🇹🇹🇹🇻🇹🇼🇹🇿🇺🇦🇺🇬🇺🇲🇺🇳🇺🇸🇺🇾🇺🇿🇻🇦🇻🇨🇻🇪🇻🇬🇻🇮🇻🇳🇻🇺🇼🇫🇼🇸🇽🇰🇾🇪🇾🇹🇿🇦🇿🇲🇿🇼🏴󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁳󠁣󠁴󠁿🏴󠁧󠁢󠁷󠁬󠁳󠁿'
// the hair components (🦰 🦱 🦳 🦲) only modify a person, so they are left out
const COMPONENTS = new Set(['🦰', '🦱', '🦳', '🦲'])
export const PALETTE: readonly string[] = [...new Set([...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(PALETTE_TEXT)].map((s) => s.segment))].filter((e) => !COMPONENTS.has(e))
const IN_PALETTE = new Set(PALETTE)
export const isPaletteEmoji = (v: unknown): v is string => typeof v === 'string' && IN_PALETTE.has(v)
