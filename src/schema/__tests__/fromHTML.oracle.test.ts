// @vitest-environment jsdom
// fromHTML() must build the document the web editor builds from the same
// stored HTML: same nodes, marks and attributes.
import { describe, expect, it } from 'vitest'
import { fromHTML, toHTML } from '../index'
import { htmlFixtures, jsonFixtures } from './support/fixtures'
import { STACK, webHTML, webParse } from './support/tiptap'

const tiptap = STACK === 'next' ? '3.33' : '3.22'

const html = htmlFixtures('html')

describe('fromHTML against the web editor', () => {
  it.each(html)('%s', (name, source) => {
    const comments = name.includes('comments')
    expect(fromHTML(source, { comments, tiptap })).toEqual(webParse(source, comments))
  })

  it.each(jsonFixtures('synthetic'))('%s: the web\'s own getHTML()', (_name, doc) => {
    const stored = webHTML(doc)
    expect(fromHTML(stored, { tiptap })).toEqual(webParse(stored))
  })

  it.each(jsonFixtures('synthetic'))('%s: toHTML() output', (_name, doc) => {
    const stored = toHTML(doc, { tiptap })
    expect(fromHTML(stored, { tiptap })).toEqual(webParse(stored))
  })
})
