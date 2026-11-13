// Proves which Tiptap each project really loads, so a green "web-prod" run
// cannot silently be this repo's Tiptap.
import { describe, expect, it } from 'vitest'
// @ts-expect-error not in the package's exports; vitest.config.ts aliases the file
import core from '@tiptap/core/package.json'
// @ts-expect-error not in the package's exports; vitest.config.ts aliases the file
import pm from 'prosemirror-model/package.json'
import { STACK } from './support/tiptap'

// The version the pinned stack must report (see vitest.config.ts).
const PINNED = process.env.TIPTAP_ORACLE_VERSION ?? '3.22.5'

describe('oracle stack', () => {
  it(`runs on the ${STACK} Tiptap`, () => {
    console.log(`[oracle] ${STACK}: @tiptap/core ${core.version}, prosemirror-model ${pm.version}`)
    if (STACK === 'web-prod') expect(core.version).toBe(PINNED)
    else expect(core.version).not.toBe(PINNED)
  })
})
