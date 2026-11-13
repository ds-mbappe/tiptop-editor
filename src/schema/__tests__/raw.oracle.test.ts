// @vitest-environment jsdom
// preserveUnknown: what the web would drop is kept, byte for byte, and the
// web still reads the result exactly as it read the original.
import { describe, expect, it } from 'vitest'
import { RAW_BLOCK, RAW_INLINE, fromHTML, toHTML, validate, type DocNode } from '../index'
import { htmlFixtures } from './support/fixtures'
import { STACK, webLoad, webParse } from './support/tiptap'

const tiptap = STACK === 'next' ? '3.33' : '3.22'
const raws = (doc: DocNode): DocNode[] =>
  [...(doc.type === RAW_BLOCK || doc.type === RAW_INLINE ? [doc] : []), ...(doc.content ?? []).flatMap(raws)]
const strip = (doc: DocNode): DocNode => ({
  ...doc,
  ...(doc.content ? { content: doc.content.filter(c => c.type !== RAW_BLOCK && c.type !== RAW_INLINE).map(strip) } : {}),
})

const LEGACY = '<p>before</p><img src="https://example.com/a.png" data-width="300" data-align="center"><p>text <img src="https://example.com/c.png"> more</p><iframe src="https://www.youtube.com/embed/abc123" allowfullscreen></iframe><div data-type="draggable-item"><img src="https://example.com/b.png" data-width="50%"></div><ul><li><img src="https://example.com/d.png"></li></ul><p>after</p>'

describe('preserveUnknown', () => {
  const doc = fromHTML(LEGACY, { preserveUnknown: true, tiptap })

  it('keeps every dropped element with its exact source', () => {
    expect(raws(doc).map(r => r.attrs?.html)).toEqual([
      '<img src="https://example.com/a.png" data-width="300" data-align="center">',
      '<img src="https://example.com/c.png">',
      '<iframe src="https://www.youtube.com/embed/abc123" allowfullscreen></iframe>',
      '<img src="https://example.com/b.png" data-width="50%">',
      '<img src="https://example.com/d.png">',
    ])
    expect(raws(doc).map(r => r.type)).toEqual([RAW_BLOCK, RAW_INLINE, RAW_BLOCK, RAW_BLOCK, RAW_BLOCK])
  })

  it('is valid with allowRaw and reports raw nodes otherwise', () => {
    expect(validate(doc, { allowRaw: true }).issues).toEqual([])
    expect(validate(doc).issues.map(i => i.code)).toContain('unknown_node')
  })

  it('writes the raw markup back, and the web reads it as it read the original', () => {
    const html = toHTML(doc, { tiptap })
    for (const r of raws(doc)) expect(html).toContain(r.attrs?.html as string)
    expect(webLoad(html)).toEqual(webLoad(LEGACY))
  })

  it('keeps the same text as the web parse, raw nodes aside', () => {
    const text = (d: DocNode): string => d.type === 'text' ? d.text ?? '' : (d.content ?? []).map(text).join(' ')
    const squash = (t: string) => t.replace(/\s+/g, ' ').trim()
    expect(squash(text(strip(doc)))).toBe(squash(text(webParse(LEGACY))))
  })

  it.each(htmlFixtures('html'))('%s: no edit, no change for the web', (_name, source) => {
    const html = toHTML(fromHTML(source, { preserveUnknown: true, tiptap }), { tiptap })
    expect(webLoad(html)).toEqual(webLoad(source))
  })
})
