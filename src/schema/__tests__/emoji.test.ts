import { describe, expect, it } from 'vitest'
import { gitHubEmojis } from '@tiptap/extension-emoji'
import { EMOJI } from '../emoji'

describe('emoji table', () => {
  it('equals the web editor emoji list (run scripts/gen-schema-emoji.mjs when it drifts)', () => {
    const expected: Record<string, string> = {}
    for (const item of gitHubEmojis) {
      if (!item.emoji) continue
      for (const code of item.shortcodes) if (!(code in expected)) expected[code] = item.emoji
    }
    expect(EMOJI).toEqual(expected)
  })
})
