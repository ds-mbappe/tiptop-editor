// fromHTML(): the document the web editor builds from stored HTML, without a
// DOM. Same steps as Tiptap's createDocument(): parse the HTML as a <body>,
// drop the newline-only text nodes between tags, then run ProseMirror's
// DOMParser with the web's parse rules (rules.ts).

import { DOMParser } from 'prosemirror-model'
import type { DocNode } from '../types'
import { DomElement, DomText, normalizeSource, parseHTMLFragment, sourceOffsets } from './dom'
import { RAW_TAGS } from '../raw'
import type { HtmlOptions } from './flavour'
import { webSchema } from './rules'

/** Tiptap's elementFromString removeWhitespaces. */
function removeWhitespaces(el: DomElement): void {
  for (let i = el.childNodes.length - 1; i >= 0; i--) {
    const child = el.childNodes[i]
    if (child instanceof DomText && child.nodeValue && /^(\n\s\s|\n)$/.test(child.nodeValue)) el.removeChild(child)
    else if (child instanceof DomElement) removeWhitespaces(child)
  }
}

export type FromHTMLOptions = HtmlOptions

function prepare(html: string, options: FromHTMLOptions): DomElement {
  const body = parseHTMLFragment(html)
  if (options.preserveUnknown) markRawSources(body, html, sourceOffsets(html))
  removeWhitespaces(body)
  return body
}

/** The JSON the web editor's getJSON() gives right after loading `html` (before any plugin runs). */
export function fromHTML(html: string, options: FromHTMLOptions = {}): DocNode {
  const doc = DOMParser.fromSchema(webSchema(options)).parse(prepare(html, options) as unknown as Node)
  return doc.toJSON() as DocNode
}

/**
 * Where each top-level block of a document came from in the stored HTML.
 * toHTML({ source }) writes an unchanged block's original markup back as is,
 * so a document opened and saved by another editor without edits keeps its exact bytes,
 * and an edit rewrites only the blocks it touched.
 */
export interface SourceMap {
  /** Consecutive slices of the stored HTML (their concatenation is the whole input) and the top-level nodes each produced. */
  chunks: { html: string; nodes: DocNode[] }[]
}

// Top-level elements that stand as blocks of their own (ProseMirror's blockTags
// plus the elements our rules turn into blocks). Text and inline elements in
// between are grouped: the web wraps such a run in one paragraph.
const BLOCKISH = new Set([
  'address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div', 'dl', 'fieldset', 'figcaption', 'figure',
  'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li', 'noscript', 'ol', 'output',
  'p', 'pre', 'section', 'table', 'tfoot', 'ul', 'iframe', 'img', 'video', 'audio', 'embed', 'object', 'svg', 'picture',
])

/**
 * fromHTML plus a SourceMap. The map is null when the per-block parse does not
 * add up to the whole-document parse; toHTML then serialises everything.
 */
export function fromHTMLWithSource(html: string, options: FromHTMLOptions = {}): { doc: DocNode; source: SourceMap | null } {
  const doc = fromHTML(html, options)
  // Offsets below are in the normalised text ("\r\n" → "\n"); slices are taken from the original.
  const source = normalizeSource(html)
  const offsets = sourceOffsets(html)

  const top = parseHTMLFragment(html)
  // Chunk boundaries: the start of every top-level block element, and the end of
  // the run of inline content before it.
  const cuts = new Set<number>([0, source.length])
  let inInline = false
  for (const child of top.childNodes) {
    if (child instanceof DomElement && BLOCKISH.has(child.localName)) {
      if (child.start < 0) return { doc, source: null }
      cuts.add(child.start)
      if (child.end > 0) cuts.add(child.end)
      inInline = false
    } else if (!inInline) {
      inInline = true
    }
  }
  const sorted = [...cuts].sort((a, b) => a - b)
  const schema = webSchema(options)
  const parser = DOMParser.fromSchema(schema)
  const chunks: SourceMap['chunks'] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const slice = html.slice(offsets[sorted[i]], offsets[sorted[i + 1]])
    const body = prepare(slice, options)
    const empty = body.childNodes.every(n => n instanceof DomText && !/[^ \t\r\n\u000c]/.test(n.nodeValue))
    const nodes = empty ? [] : (parser.parse(body as unknown as Node).toJSON().content as DocNode[])
    chunks.push({ html: slice, nodes })
  }
  // Inline runs that ended up as separate chunks would each become a paragraph:
  // the check below catches that, and any other way the parts do not add up.
  if (!chunks.length) chunks.push({ html, nodes: [] })
  // A document with nothing in it loads as one empty paragraph (the doc's
  // required content): it belongs to the source as a whole.
  const filler = doc.content?.length === 1 && doc.content[0].type === 'paragraph' && !doc.content[0].content
  if (filler && chunks.every(c => !c.nodes.length)) chunks[chunks.length - 1].nodes = doc.content!
  const whole = JSON.stringify(doc.content ?? [])
  const parts = JSON.stringify(chunks.flatMap(c => c.nodes))
  return { doc, source: whole === parts ? { chunks } : null }
}

const RAW = new Set<string>(RAW_TAGS)

/** Records the exact markup of every raw element (outermost only) for the raw parse rules. */
function markRawSources(el: DomElement, html: string, offsets: number[]): void {
  for (const child of el.children) {
    if (RAW.has(child.localName) && child.start >= 0 && child.end > child.start) {
      child.rawSource = html.slice(offsets[child.start], offsets[child.end])
    } else {
      markRawSources(child, html, offsets)
    }
  }
}
