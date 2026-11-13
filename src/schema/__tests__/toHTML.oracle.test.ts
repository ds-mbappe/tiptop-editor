// @vitest-environment jsdom
// toHTML() must write what the web editor writes (getHTML()), so a note saved
// by another editor looks to TiptopEditor exactly like one it saved itself.
import { describe, expect, it } from 'vitest'
import { normalize, toHTML, validate, type DocNode } from '../index'
import { hasEmoji, jsonFixtures } from './support/fixtures'
import { STACK, canonicalHTML, webHTML, webLoad } from './support/tiptap'

const opts = { tiptap: STACK === 'next' ? '3.33' : '3.22' } as const

const synthetic = jsonFixtures('synthetic')

describe('toHTML against the web editor', () => {
  it.each(synthetic)('%s: is schema-valid', (_name, doc) => {
    expect(validate(doc).issues).toEqual([])
  })

  // Some JSON does not survive the web's own HTML round-trip (a plain
  // highlight comes back with color ""), so the reference is the web's HTML.
  it.each(synthetic)('%s: the web loads toHTML(doc) as it loads its own getHTML()', (_name, doc) => {
    expect(webLoad(canonicalHTML(toHTML(doc, opts)))).toEqual(webLoad(canonicalHTML(webHTML(doc))))
  })

  it.each(synthetic.filter(([, doc]) => !hasEmoji(doc)))('%s: toHTML(doc) is byte-equal to getHTML()', (_name, doc) => {
    // Input is the doc as the web holds it after load: the web also fixes tables
    // (column widths) on load, which is not toHTML's job.
    expect(canonicalHTML(toHTML(webLoad(doc), opts))).toEqual(canonicalHTML(webHTML(doc)))
  })

  it('accepts a normalized doc and a sparse one alike', () => {
    for (const [, doc] of synthetic) expect(toHTML(normalize(doc))).toEqual(toHTML(doc))
  })
})

describe('toHTML format (what a browser stores, not what jsdom rewrites)', () => {
  const one = (node: DocNode) => toHTML({ type: 'doc', content: [node] })

  it('writes styles as browsers keep them: no trailing semicolon, colours as given', () => {
    expect(one({ type: 'paragraph', attrs: { textAlign: 'center' }, content: [{ type: 'text', text: 'x' }] }))
      .toBe('<p style="text-align: center">x</p>')
    expect(one({ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'textStyle', attrs: { color: '#ff0000' } }] }] }))
      .toBe('<p><span style="color: #ff0000">x</span></p>')
    expect(one({ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'highlight', attrs: { color: '#F8E9E9' } }] }] }))
      .toBe('<p><mark data-color="#F8E9E9" style="background-color: #F8E9E9; color: inherit">x</mark></p>')
  })

  it('writes an empty doc as one empty paragraph, like the web', () => {
    expect(toHTML({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe('<p></p>')
  })

  it('escapes text and attributes', () => {
    expect(one({ type: 'paragraph', content: [{ type: 'text', text: 'a & <b> "q" \u00a0', marks: [{ type: 'link', attrs: { href: 'https://x.y/?a=1&b="2"' } }] }] }))
      .toBe('<p><a target="_blank" rel="noopener noreferrer nofollow" href="https://x.y/?a=1&amp;b=&quot;2&quot;">a &amp; &lt;b&gt; "q" &nbsp;</a></p>')
  })

  it('strips a javascript: href like the web does', () => {
    expect(one({ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }))
      .toBe('<p><a target="_blank" rel="noopener noreferrer nofollow" href="">x</a></p>')
  })
})
