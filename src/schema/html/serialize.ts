// toHTML(): the HTML the web editor's getHTML() writes for a document, built
// without a DOM. Each node and mark follows its Tiptap renderHTML (sources in
// node_modules/@tiptap/* and src/extensions); toHTML.test.ts compares the
// result with the real editor for every fixture.

import { EMOJI } from '../emoji'
import { normalize } from '../normalize'
import { RAW_BLOCK, RAW_INLINE } from '../raw'
import { getSchemaSpec } from '../spec'
import type { DocMark, DocNode } from '../types'
import { escapeAttr, escapeText } from './escape'
import { flavourRules, type HtmlOptions } from './flavour'
import type { SourceMap } from './parse'
import { isAllowedUri } from './uri'

type Attrs = [name: string, value: unknown][]

export class UnsupportedContentError extends Error {
  constructor(public readonly type: string) {
    super(`toHTML: "${type}" is not in the document schema; the web editor would blank the whole document.`)
    this.name = 'UnsupportedContentError'
  }
}

const HEADING_LEVELS = [1, 2, 3]
const ALIGNMENTS = ['left', 'center', 'right', 'justify']
const CELL_MIN_WIDTH = 25
const LINK_DEFAULTS: Attrs = [['target', '_blank'], ['rel', 'noopener noreferrer nofollow'], ['class', null]]

function attrString(attrs: Attrs): string {
  let out = ''
  for (const [name, value] of attrs) {
    if (value === null || value === undefined) continue
    out += ` ${name}="${escapeAttr(String(value))}"`
  }
  return out
}

/** Tiptap's mergeAttributes for the keys we use: later keys overwrite in place, styles merge. */
function merge(...lists: Attrs[]): Attrs {
  const out: Attrs = []
  for (const list of lists) {
    for (const [name, value] of list) {
      const at = out.findIndex(([n]) => n === name)
      if (at === -1 || !out[at][1]) {
        if (at === -1) out.push([name, value])
        else out[at] = [name, value]
      } else if (name === 'style') {
        const map = new Map<string, string>()
        for (const style of [out[at][1], value]) {
          for (const decl of String(style ?? '').split(';')) {
            const i = decl.indexOf(':')
            if (i === -1) continue
            const prop = decl.slice(0, i).trim()
            const val = decl.slice(i + 1).trim()
            if (prop && val) map.set(prop, val)
          }
        }
        out[at] = [name, [...map].map(([p, v]) => `${p}: ${v}`).join('; ')]
      } else {
        out[at] = [name, value]
      }
    }
  }
  return out
}

const validStyleValue = (v: unknown) => typeof v === 'string' && v !== '' && !/[;{}]/.test(v)

function textAlign(node: DocNode): Attrs {
  const value = node.attrs?.textAlign
  return validStyleValue(value) && ALIGNMENTS.includes(value as string) ? [['style', `text-align: ${value}`]] : []
}

function commentId(node: DocNode, comments: boolean): Attrs {
  const id = node.attrs?.commentId
  return comments && id ? [['data-node-comment-id', id]] : []
}

function markOpen(mark: DocMark): string {
  const a = mark.attrs ?? {}
  switch (mark.type) {
    case 'link': {
      const href = isAllowedUri(a.href as string | undefined) ? a.href : ''
      const own: Attrs = [['href', href], ['target', a.target], ['rel', a.rel], ['class', a.class], ['title', a.title]]
      return `<a${attrString(merge(LINK_DEFAULTS, own))}>`
    }
    case 'textStyle':
      // color "" is what the web parses from a styled span without a colour
      // (font-family, pasted text). getHTML writes a bare <span>, which loses
      // the mark; style="" keeps it, so the web reads the note as before.
      return `<span${a.color ? attrString([['style', `color: ${a.color}`]]) : a.color === '' ? ' style=""' : ''}>`
    case 'bold': return '<strong>'
    case 'code': return '<code>'
    case 'italic': return '<em>'
    case 'strike': return '<s>'
    case 'underline': return '<u>'
    case 'highlight':
      return a.color
        ? `<mark${attrString([['data-color', a.color], ['style', `background-color: ${a.color}; color: inherit`]])}>`
        : '<mark>'
    case 'subscript': return '<sub>'
    case 'superscript': return '<sup>'
    case 'comment':
      return `<span${attrString([['data-comment-id', a.commentId || null], ['class', 'tiptop-comment']])}>`
    default:
      throw new UnsupportedContentError(mark.type)
  }
}

const MARK_TAG: Record<string, string> = {
  link: 'a', textStyle: 'span', bold: 'strong', code: 'code', italic: 'em', strike: 's',
  underline: 'u', highlight: 'mark', subscript: 'sub', superscript: 'sup', comment: 'span',
}

const sameMark = (a: DocMark, b: DocMark) => a.type === b.type && JSON.stringify(a.attrs ?? {}) === JSON.stringify(b.attrs ?? {})

export interface ToHTMLOptions extends HtmlOptions {
  /** From fromHTMLWithSource: unchanged top-level blocks are written as their original markup. */
  source?: SourceMap | null
}

/**
 * The HTML the web editor stores for `doc` (getHTML()). Throws
 * UnsupportedContentError for any node or mark outside the schema, apart from
 * the non-web raw nodes, whose original markup is written back as is.
 */
export function toHTML(doc: DocNode, options: ToHTMLOptions = {}): string {
  const comments = Boolean(options.comments)
  const omitSpans = flavourRules(options).omitDefaultCellSpans
  const spec = getSchemaSpec(options)
  const known = new Set(spec.nodes.map(n => n.name))
  const knownMarks = new Set(spec.marks.map(m => m.name))
  const root = normalize(doc, options)

  // ProseMirror's DOMSerializer.serializeFragment: marks shared with the
  // previous inline node stay open.
  function inline(children: DocNode[]): string {
    let out = ''
    const active: DocMark[] = []
    for (const child of children) {
      const marks = child.marks ?? []
      for (const m of marks) if (!knownMarks.has(m.type)) throw new UnsupportedContentError(m.type)
      let keep = 0
      while (keep < active.length && keep < marks.length && sameMark(marks[keep], active[keep])) keep++
      while (active.length > keep) out += `</${MARK_TAG[active.pop()!.type]}>`
      for (let i = keep; i < marks.length; i++) {
        out += markOpen(marks[i])
        active.push(marks[i])
      }
      out += node(child)
    }
    while (active.length) out += `</${MARK_TAG[active.pop()!.type]}>`
    return out
  }

  const kids = (n: DocNode) => n.content ?? []
  const blocks = (n: DocNode) => kids(n).map(node).join('')

  function cellAttrs(n: DocNode): Attrs {
    const a = n.attrs ?? {}
    const colwidth = Array.isArray(a.colwidth) ? a.colwidth.join(',') : a.colwidth
    const align = ['left', 'right', 'center'].includes(a.align as string) ? a.align : null
    const isOne = (v: unknown) => v === 1 || v === '1'
    const attrs: Attrs = [
      ['colspan', omitSpans && isOne(a.colspan) ? null : a.colspan],
      ['rowspan', omitSpans && isOne(a.rowspan) ? null : a.rowspan],
      ['colwidth', colwidth],
    ]
    if (align) attrs.push(['style', `text-align: ${align}`])
    return attrs
  }

  function tableOpen(n: DocNode): string {
    const row = kids(n)[0]
    if (!row) return '<table>'
    let total = 0
    let fixed = true
    let cols = ''
    for (const cell of kids(row)) {
      const colspan = Number(cell.attrs?.colspan ?? 1)
      const colwidth = cell.attrs?.colwidth as number[] | null | undefined
      for (let j = 0; j < colspan; j++) {
        const width = colwidth ? colwidth[j] : undefined
        total += width || CELL_MIN_WIDTH
        if (!width) fixed = false
        cols += width
          ? `<col style="width: ${Math.max(width, CELL_MIN_WIDTH)}px">`
          : `<col style="min-width: ${CELL_MIN_WIDTH}px">`
      }
    }
    const style = fixed ? `width: ${total}px` : `min-width: ${total}px`
    return `<table${attrString([['style', style]])}><colgroup>${cols}</colgroup>`
  }

  function node(n: DocNode): string {
    const a = n.attrs ?? {}
    switch (n.type) {
      case 'doc': return blocks(n)
      case 'text': return escapeText(n.text ?? '')
      case 'paragraph':
        return `<p${attrString(merge(textAlign(n), commentId(n, comments)))}>${inline(kids(n))}</p>`
      case 'heading': {
        const level = HEADING_LEVELS.includes(a.level as number) ? a.level : HEADING_LEVELS[0]
        return `<h${level}${attrString(merge(textAlign(n), commentId(n, comments)))}>${inline(kids(n))}</h${level}>`
      }
      case 'blockquote': return `<blockquote${attrString(commentId(n, comments))}>${blocks(n)}</blockquote>`
      case 'bulletList': return `<ul${attrString(commentId(n, comments))}>${blocks(n)}</ul>`
      case 'orderedList': {
        const attrs: Attrs = [...commentId(n, comments)]
        if (a.start !== 1) attrs.push(['start', a.start])
        if (a.type && a.type !== '1') attrs.push(['type', a.type])
        return `<ol${attrString(attrs)}>${blocks(n)}</ol>`
      }
      case 'listItem': return `<li>${blocks(n)}</li>`
      case 'taskList':
        return `<ul${attrString([...commentId(n, comments), ['data-type', 'taskList']])}>${blocks(n)}</ul>`
      case 'taskItem':
        return `<li${attrString([['data-checked', a.checked], ['data-type', 'taskItem']])}>`
          + `<label><input type="checkbox"${a.checked ? ' checked="checked"' : ''}><span></span></label>`
          + `<div>${blocks(n)}</div></li>`
      case 'horizontalRule': return '<div data-type="horizontalRule"><hr></div>'
      case 'codeBlock': {
        const lang = a.language ? ` class="language-${escapeAttr(String(a.language))}"` : ''
        return `<pre${attrString(commentId(n, comments))}><code${lang}>${kids(n).map(node).join('')}</code></pre>`
      }
      case 'hardBreak': return '<br>'
      case 'emoji': {
        const name = a.name as string | null | undefined
        const char = name ? EMOJI[name] : undefined
        return `<span${attrString([['data-name', name], ['data-type', 'emoji']])}>${char ?? escapeText(`:${name}:`)}</span>`
      }
      case 'table': return `${tableOpen(n)}<tbody>${blocks(n)}</tbody></table>`
      case 'tableRow': return `<tr>${blocks(n)}</tr>`
      case 'tableHeader': return `<th${attrString(cellAttrs(n))}>${blocks(n)}</th>`
      case 'tableCell': return `<td${attrString(cellAttrs(n))}>${blocks(n)}</td>`
      case 'imageUploader': {
        const order = ['id', 'src', 'progress', 'failed', 'uploading', 'selectMedia', 'errorMessage', 'name', 'size']
        const attrs: Attrs = order.map(k => [k.toLowerCase(), a[k]])
        attrs.push(['data-type', 'image-uploader'], ['data-uploading', String(a.uploading ?? undefined)])
        return `<div${attrString(attrs)}></div>`
      }
      case RAW_BLOCK:
      case RAW_INLINE:
        return typeof a.html === 'string' ? a.html : ''
      default:
        if (!known.has(n.type)) throw new UnsupportedContentError(n.type)
        throw new Error(`toHTML: no renderer for "${n.type}"`)
    }
  }

  if (options.source && root.type === 'doc') return withSource(root, options.source, node)
  return node(root)
}

/**
 * Walks the top-level blocks: a run of blocks equal to the nodes a source
 * chunk produced is written as that chunk's original markup; anything else
 * (edited, added) is serialised. Chunks are only reused in order.
 */
function withSource(doc: DocNode, source: SourceMap, render: (n: DocNode) => string): string {
  const blocks = doc.content ?? []
  const key = (nodes: DocNode[]) => JSON.stringify(nodes)
  const chunkKeys = source.chunks.map(c => key(c.nodes.map(n => normalize(n))))
  let out = ''
  let next = 0 // first chunk not yet used
  let pendingEmpty = '' // node-less chunks (whitespace, comments) since the last used chunk
  let j = 0
  while (j < blocks.length) {
    let used = -1
    for (let k = next; k < source.chunks.length; k++) {
      const len = source.chunks[k].nodes.length
      if (len && j + len <= blocks.length && chunkKeys[k] === key(blocks.slice(j, j + len))) {
        used = k
        break
      }
    }
    if (used === -1) {
      out += render(blocks[j])
      j++
      continue
    }
    for (let k = next; k < used; k++) if (!source.chunks[k].nodes.length) pendingEmpty += source.chunks[k].html
    out += pendingEmpty + source.chunks[used].html
    pendingEmpty = ''
    j += source.chunks[used].nodes.length
    next = used + 1
  }
  for (let k = next; k < source.chunks.length; k++) if (!source.chunks[k].nodes.length) out += source.chunks[k].html
  return out
}
