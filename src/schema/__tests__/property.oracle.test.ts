// @vitest-environment jsdom
// Random schema-valid documents (fast-check): the codec agrees with the web.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { fromHTML, fromHTMLWithSource, toHTML, validate } from '../index'
import { docArbitrary } from './support/arbitrary'
import { STACK, canonicalHTML, webHTML, webLoad, webParse } from './support/tiptap'

const tiptap = STACK === 'next' ? '3.33' : '3.22'
const RUNS = Number(process.env.SCHEMA_PROPERTY_RUNS ?? 150)

describe('property: random documents', () => {
  it('are schema-valid (the generator is right)', () => {
    fc.assert(fc.property(docArbitrary, doc => { expect(validate(doc).issues).toEqual([]) }), { numRuns: RUNS })
  })

  it('toHTML loads on the web as the web\'s own getHTML does', { timeout: 120_000 }, () => {
    fc.assert(fc.property(docArbitrary, doc => {
      expect(webLoad(canonicalHTML(toHTML(doc, { tiptap })))).toEqual(webLoad(canonicalHTML(webHTML(doc))))
    }), { numRuns: RUNS })
  })

  it('fromHTML(toHTML(doc)) equals the web parse of that HTML', { timeout: 120_000 }, () => {
    fc.assert(fc.property(docArbitrary, doc => {
      const html = toHTML(doc, { tiptap })
      expect(fromHTML(html, { tiptap })).toEqual(webParse(html))
    }), { numRuns: RUNS })
  })

  it('a stored doc read and written back without an edit keeps its bytes', { timeout: 120_000 }, () => {
    fc.assert(fc.property(docArbitrary, doc => {
      const stored = webHTML(doc)
      const { doc: read, source } = fromHTMLWithSource(stored, { tiptap, preserveUnknown: true })
      expect(toHTML(read, { tiptap, source })).toBe(stored)
    }), { numRuns: RUNS })
  })

  it('toHTML is a fixpoint after one cycle', { timeout: 120_000 }, () => {
    fc.assert(fc.property(docArbitrary, doc => {
      const once = toHTML(fromHTML(toHTML(doc, { tiptap }), { tiptap }), { tiptap })
      expect(toHTML(fromHTML(once, { tiptap }), { tiptap })).toBe(once)
    }), { numRuns: RUNS })
  })
})
