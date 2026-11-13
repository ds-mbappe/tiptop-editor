// @vitest-environment jsdom
// With a SourceMap, an unedited document is written back byte for byte, and
// an edit rewrites only the blocks it touched.
import { describe, expect, it } from 'vitest'
import { fromHTMLWithSource, toHTML, type DocNode } from '../index'
import { htmlFixtures, jsonFixtures } from './support/fixtures'
import { STACK, webHTML, webLoad } from './support/tiptap'

const tiptap = STACK === 'next' ? '3.33' : '3.22'
const opts = { tiptap, preserveUnknown: true } as const

describe('source map', () => {
  it.each(htmlFixtures('html'))('%s: no edit, same bytes', (_name, html) => {
    const { doc, source } = fromHTMLWithSource(html, opts)
    expect(source).not.toBeNull()
    expect(toHTML(doc, { ...opts, source })).toBe(html)
  })

  it.each(jsonFixtures('synthetic'))('%s: the web\'s getHTML, no edit, same bytes', (_name, json) => {
    const html = webHTML(json)
    const { doc, source } = fromHTMLWithSource(html, opts)
    expect(toHTML(doc, { ...opts, source })).toBe(html)
  })

  it('an edit rewrites only the edited block, and the web reads the edit', () => {
    const html = '<p>keep <span style="font-family: Roboto">me</span></p>\n<div data-type="draggable-item"><p>legacy</p></div><img src="https://example.com/a.png" data-width="3"><p>edit me</p><p>tail</p>'
    const { doc, source } = fromHTMLWithSource(html, opts)
    const edited: DocNode = JSON.parse(JSON.stringify(doc))
    const target = edited.content!.find(n => n.content?.[0]?.text === 'edit me')!
    target.content![0].text = 'edited'
    const out = toHTML(edited, { ...opts, source })
    expect(out).toBe('<p>keep <span style="font-family: Roboto">me</span></p>\n<div data-type="draggable-item"><p>legacy</p></div><img src="https://example.com/a.png" data-width="3"><p>edited</p><p>tail</p>')
    expect(webLoad(out)).toEqual(webLoad(html.replace('edit me', 'edited')))
  })

  it('keeps Windows line ends (\\r\\n) byte for byte, raw nodes included', () => {
    const html = '<p>a\r\nb</p>\r\n<pre><code>x\r\n  y</code></pre>\r\n<iframe src="https://example.com/v"\r\n></iframe><p>c</p>'
    const { doc, source } = fromHTMLWithSource(html, opts)
    expect(source).not.toBeNull()
    expect(toHTML(doc, { ...opts, source })).toBe(html)
    const raw = doc.content!.find(n => n.type === 'rawBlock')
    expect(raw?.attrs?.html).toBe('<iframe src="https://example.com/v"\r\n></iframe>')
  })

  it('deleted, added and moved blocks', () => {
    const html = '<p>a</p><p>b</p><p>c</p>'
    const { doc, source } = fromHTMLWithSource(html, opts)
    const [a, b, c] = doc.content!
    const added: DocNode = { type: 'paragraph', content: [{ type: 'text', text: 'new' }] }
    expect(toHTML({ type: 'doc', content: [a, c] }, { ...opts, source })).toBe('<p>a</p><p>c</p>')
    expect(toHTML({ type: 'doc', content: [a, added, b, c] }, { ...opts, source })).toBe('<p>a</p><p>new</p><p>b</p><p>c</p>')
    expect(toHTML({ type: 'doc', content: [c, a, b] }, { ...opts, source })).toBe('<p>c</p><p>a</p><p>b</p>')
  })
})
