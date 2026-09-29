import houseStyle from '@cw/eslint-config'

// src/palette-names.ts and src/palette-keywords.ts are generated (scripts/palette-names.ts)
export default houseStyle().append({ ignores: ['src/palette-names.ts', 'src/palette-keywords.ts'] })
