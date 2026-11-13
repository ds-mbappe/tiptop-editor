// @vitest-environment jsdom
// Real stored documents (local only, SCHEMA_CORPUS_DIR; see support/corpus.ts).
import { describe, expect, it } from 'vitest'
import { fromHTML, fromHTMLWithSource, toHTML, type DocNode } from '../index'
import { parseHTMLFragment, serializeChildren } from '../html/dom'
import { corpus, corpusDir } from './support/corpus'
import { STACK, webLoad, webParse } from './support/tiptap'

const tiptap = STACK === 'next' ? '3.33' : '3.22'
const browser = (html: string) =>
  new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body.innerHTML.replace(/<!--[\s\S]*?-->/g, '')

function compare(label: string, pairs: Iterable<[string, string, string]>) {
  const failures: string[] = []
  let count = 0
  for (const [id, mine, theirs] of pairs) {
    count++
    if (mine === theirs) continue
    let i = 0
    while (mine[i] === theirs[i]) i++
    failures.push(`${id} @${i}\n  mine: ${mine.slice(Math.max(0, i - 100), i + 100)}\n  web:  ${theirs.slice(Math.max(0, i - 100), i + 100)}`)
  }
  console.log(`[corpus:${STACK}] ${label}: ${count} documents, ${failures.length} differ`)
  return failures
}

describe.skipIf(!corpusDir)(`real corpus (${STACK})`, () => {
  const docs = corpus()

  const LONG = 60 * 60 * 1000

  it('the pure DOM equals the browser DOM', { timeout: LONG }, () => {
    const failures = compare('dom', docs.map(d => [d.id, serializeChildren(parseHTMLFragment(d.html)), browser(d.html)] as [string, string, string]))
    expect(failures.slice(0, 3)).toEqual([])
  })

  it('fromHTML equals the web parse', { timeout: LONG }, () => {
    const failures = compare('fromHTML', docs.map(d => [d.id, JSON.stringify(fromHTML(d.html, { tiptap })), JSON.stringify(webParse(d.html))] as [string, string, string]))
    expect(failures.slice(0, 3)).toEqual([])
  })

  it('with a source map, no edit gives the same bytes', { timeout: LONG }, () => {
    let mapped = 0
    const failures = compare('same-bytes', docs.map(d => {
      const { doc, source } = fromHTMLWithSource(d.html, { tiptap, preserveUnknown: true })
      if (source) mapped++
      return [d.id, toHTML(doc, { tiptap, source }), d.html] as [string, string, string]
    }))
    console.log(`[corpus:${STACK}] source map built for ${mapped} of ${docs.length}`)
    expect(failures.slice(0, 3)).toEqual([])
  })

  // One test per document for the slow checks: a long synchronous loop keeps
  // the worker from answering vitest and fails the run with an RPC timeout.
  const appendX = (n: DocNode): boolean => {
    if (n.type === 'text' && n.text) { n.text += ' x'; return true }
    return (n.content ?? []).some(appendX)
  }

  describe('an edit: the web reads exactly the edited document', () => {
    it.each(docs.map(d => [d.id, d.html]))('%s', (_id, html) => {
      const { doc, source } = fromHTMLWithSource(html, { tiptap, preserveUnknown: true })
      const edited: DocNode = JSON.parse(JSON.stringify(doc))
      if (!appendX(edited)) return
      expect(webLoad(toHTML(edited, { tiptap, source }))).toEqual(webLoad(toHTML(edited, { tiptap })))
    })
  })

  describe('no edit, no change: the web loads toHTML(fromHTML(html)) as it loads html', () => {
    it.each(docs.map(d => [d.id, d.html]))('%s', (_id, html) => {
      expect(webLoad(toHTML(fromHTML(html, { tiptap, preserveUnknown: true }), { tiptap }))).toEqual(webLoad(html))
    })
  })
})
