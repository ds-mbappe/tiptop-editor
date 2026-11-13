// The ProseMirror schema the web editor builds, with the parse rules of each
// tiptop / Tiptap extension (as in tiptop-editor 2.3.x on Tiptap 3.22.5, and
// in this version). ProseMirror's own DOMParser runs them on the pure DOM of dom.ts,
// so fromHTML() follows the web's parse algorithm exactly; parse.oracle.test.ts
// checks the result against the real editor on both Tiptap stacks.

import { Schema, type AttributeSpec, type MarkSpec, type NodeSpec, type TagParseRule, type ParseRule } from 'prosemirror-model'
import { getSchemaSpec } from '../spec'
import { flavourRules, DEFAULT_FLAVOUR, type HtmlOptions } from './flavour'
import { RAW_BLOCK, RAW_INLINE, RAW_TAGS } from '../raw'
import type { DomElement } from './dom'
import { isAllowedUri } from './uri'

type El = DomElement
type AttrParser = (el: El) => unknown

// Tiptap's fromString: "12" → 12, "true" → true, other strings unchanged.
function fromString(value: unknown): unknown {
  if (typeof value !== 'string') return value
  if (/^[+-]?(?:\d*\.)?\d+$/.test(value)) return Number(value)
  if (value === 'true') return true
  if (value === 'false') return false
  return value
}

const ALIGNMENTS = ['left', 'center', 'right', 'justify']

const textAlign: AttrParser = el => {
  const value = String(el.style.textAlign ?? '')
  return ALIGNMENTS.includes(value) ? value : null
}

const cellAlign: AttrParser = el => {
  const value = (String(el.style.textAlign || '').trim() || (el.getAttribute('align') || '').trim()).toLowerCase()
  return ['left', 'right', 'center'].includes(value) ? value : null
}

const parseColwidth = (el: El): number[] | null => {
  const colwidth = el.getAttribute('colwidth')
  return colwidth ? colwidth.split(',').map(w => parseInt(w, 10)) : null
}

const cellColwidth: AttrParser = el => {
  const value = parseColwidth(el)
  if (!value) {
    const cols = el.closest('table')?.querySelectorAll('colgroup > col')
    const cellIndex = (el.parentElement?.children ?? []).indexOf(el)
    if (cellIndex && cellIndex > -1 && cols && cols[cellIndex]) {
      const width = cols[cellIndex].getAttribute('width')
      return width ? [parseInt(width, 10)] : null
    }
  }
  return value
}

const color: AttrParser = el => {
  const style = el.getAttribute('style')
  if (style) {
    const decls = style.split(';').map(s => s.trim()).filter(Boolean)
    for (let i = decls.length - 1; i >= 0; i--) {
      const parts = decls[i].split(':')
      if (parts.length >= 2 && parts[0].trim().toLowerCase() === 'color') {
        return parts.slice(1).join(':').trim().replace(/['"]+/g, '')
      }
    }
  }
  return String(el.style.color ?? '').replace(/['"]+/g, '')
}

/** Per type: attribute name → parser. Missing parser = Tiptap's default fromString(getAttribute(name)). */
const ATTR_PARSERS: Record<string, Record<string, AttrParser>> = {
  paragraph: { textAlign },
  heading: { textAlign },
  orderedList: {
    start: el => (el.hasAttribute('start') ? parseInt(el.getAttribute('start') || '', 10) : 1),
    type: el => el.getAttribute('type'),
  },
  taskItem: { checked: el => { const v = el.getAttribute('data-checked'); return v === '' || v === 'true' } },
  codeBlock: {
    language: el => {
      const lang = (el.firstElementChild?.classList ?? [])
        .filter(c => c.startsWith('language-'))
        .map(c => c.replace('language-', ''))[0]
      return lang || null
    },
  },
  emoji: { name: el => el.dataset.name },
  tableCell: { colwidth: cellColwidth, align: cellAlign },
  tableHeader: { colwidth: parseColwidth, align: cellAlign },
  link: { href: el => el.getAttribute('href') },
  textStyle: { color },
  highlight: { color: el => el.getAttribute('data-color') || el.style.backgroundColor },
  // Tiptap 3.33 reads the style as written before falling back to the normalised value.
  highlightRaw: { color: el => el.getAttribute('data-color') || styleProperty(el, 'background-color') || el.style.backgroundColor },
  comment: { commentId: el => el.getAttribute('data-comment-id') },
}
function styleProperty(el: El, name: string): string | null {
  const decls = (el.getAttribute('style') ?? '').split(';').map(d => d.trim()).filter(Boolean)
  for (let i = decls.length - 1; i >= 0; i--) {
    const at = decls[i].indexOf(':')
    if (at !== -1 && decls[i].slice(0, at).trim().toLowerCase() === name) return decls[i].slice(at + 1).trim()
  }
  return null
}

const COMMENT_ID: AttrParser = el => el.getAttribute('data-node-comment-id') || null

const findChildSpans = (el: El, depth = 0): El[] => {
  const out: El[] = []
  if (!el.children.length || depth > 20) return out
  for (const child of el.children) {
    if (child.tagName === 'SPAN') out.push(child)
    else if (child.children.length) out.push(...findChildSpans(child, depth + 1))
  }
  return out
}

// TextStyle's mergeNestedSpanStyles (on by default): child spans inherit the
// style of the closest parent span. It mutates the DOM, as on the web.
const mergeNestedSpanStyles = (el: El) => {
  if (!el.children.length) return
  for (const span of findChildSpans(el)) {
    const own = span.getAttribute('style')
    const parent = span.parentElement?.closest('span')?.getAttribute('style')
    span.setAttribute('style', `${parent};${own}`)
  }
}

type Rule = TagParseRule | ParseRule

const NODE_RULES: Record<string, Rule[]> = {
  paragraph: [{ tag: 'p' }],
  blockquote: [{ tag: 'blockquote' }],
  hardBreak: [{ tag: 'br' }],
  heading: [1, 2, 3].map(level => ({ tag: `h${level}`, attrs: { level } })),
  bulletList: [{ tag: 'ul' }],
  listItem: [{ tag: 'li' }],
  orderedList: [{ tag: 'ol' }],
  taskItem: [{ tag: 'li[data-type="taskItem"]', priority: 51, contentElement: (el: HTMLElement) => (el as unknown as El).querySelector('div') as never ?? el }],
  taskList: [{ tag: 'ul[data-type="taskList"]', priority: 51 }],
  horizontalRule: [{ tag: 'hr' }],
  codeBlock: [{ tag: 'pre', preserveWhitespace: 'full' }],
  emoji: [{ tag: 'span[data-type="emoji"]' }],
  table: [{ tag: 'table' }],
  tableCell: [{ tag: 'td' }],
  tableHeader: [{ tag: 'th' }],
  tableRow: [{ tag: 'tr' }],
  imageUploader: [{ tag: 'div[data-type="image-uploader"]' }],
}

const MARK_RULES: Record<string, Rule[]> = {
  link: [{
    tag: 'a[href]',
    getAttrs: dom => {
      const href = (dom as HTMLElement).getAttribute('href')
      return !href || !isAllowedUri(href) ? false : null
    },
  }],
  textStyle: [{
    tag: 'span',
    consuming: false,
    getAttrs: dom => {
      const el = dom as unknown as El
      if (!el.hasAttribute('style')) return false
      mergeNestedSpanStyles(el)
      return {}
    },
  }],
  bold: [
    { tag: 'strong' },
    { tag: 'b', getAttrs: dom => (dom as HTMLElement).style.fontWeight !== 'normal' && null },
    { style: 'font-weight=400', clearMark: m => m.type.name === 'bold' },
    { style: 'font-weight', getAttrs: v => /^(bold(er)?|[5-9]\d{2,})$/.test(v as string) && null },
  ],
  code: [{ tag: 'code' }],
  italic: [
    { tag: 'em' },
    { tag: 'i', getAttrs: dom => (dom as HTMLElement).style.fontStyle !== 'normal' && null },
    { style: 'font-style=normal', clearMark: m => m.type.name === 'italic' },
    { style: 'font-style=italic' },
  ],
  strike: [
    { tag: 's' }, { tag: 'del' }, { tag: 'strike' },
    { style: 'text-decoration', consuming: false, getAttrs: s => ((s as string).includes('line-through') ? {} : false) },
  ],
  underline: [
    { tag: 'u' },
    { style: 'text-decoration', consuming: false, getAttrs: s => ((s as string).includes('underline') ? {} : false) },
  ],
  highlight: [{ tag: 'mark' }],
  subscript: [{ tag: 'sub' }, { style: 'vertical-align', getAttrs: v => (v !== 'sub' ? false : null) }],
  superscript: [{ tag: 'sup' }, { style: 'vertical-align', getAttrs: v => (v !== 'super' ? false : null) }],
  comment: [{ tag: 'span[data-comment-id]' }],
}

/** Tiptap's injectExtensionAttributesToParseRule. */
function withAttrs(rule: Rule, attrs: [string, AttrParser | null][]): Rule {
  if ('style' in rule && rule.style) return rule
  const tagRule = rule as TagParseRule
  return {
    ...tagRule,
    getAttrs: (dom: HTMLElement) => {
      const old = tagRule.getAttrs ? tagRule.getAttrs(dom) : tagRule.attrs
      if (old === false) return false
      const out: Record<string, unknown> = {}
      for (const [name, parse] of attrs) {
        const el = dom as unknown as El
        const value = parse ? parse(el) : fromString(el.getAttribute(name))
        if (value !== null && value !== undefined) out[name] = value
      }
      return { ...(old ?? {}), ...out }
    },
  } as TagParseRule
}

const NODE_FLAGS: Record<string, Partial<NodeSpec>> = {
  codeBlock: { code: true, defining: true },
  hardBreak: { linebreakReplacement: true, selectable: false },
  text: {},
}

const cache = new Map<string, Schema>()

/** The web editor's ProseMirror schema, parse rules included. */
export function webSchema(options: HtmlOptions = {}): Schema {
  const key = `${options.comments ? 'c' : 'p'}:${options.tiptap ?? DEFAULT_FLAVOUR}:${options.preserveUnknown ? 'raw' : ''}`
  const flavour = flavourRules(options)
  const hit = cache.get(key)
  if (hit) return hit
  const spec = getSchemaSpec(options)

  const nodes: Record<string, NodeSpec> = {}
  for (const n of spec.nodes) {
    const attrs: Record<string, AttributeSpec> = {}
    // Global attributes (textAlign, commentId) come first, as in Tiptap.
    const names = Object.keys(n.attrs).sort((a, b) => rank(a) - rank(b))
    for (const name of names) attrs[name] = n.attrs[name].default === undefined ? { default: undefined } as AttributeSpec : { default: n.attrs[name].default }
    const parsers: [string, AttrParser | null][] = names.map(name =>
      [name, name === 'commentId' ? COMMENT_ID : ATTR_PARSERS[n.name]?.[name] ?? null])
    const node: NodeSpec = {
      ...NODE_FLAGS[n.name],
      attrs,
      ...(n.content !== undefined ? { content: n.content } : {}),
      ...(n.group !== undefined ? { group: n.group } : {}),
      ...(n.inline ? { inline: true } : {}),
      ...(n.marks !== undefined ? { marks: n.marks } : {}),
    }
    const rules = NODE_RULES[n.name]
    if (rules) node.parseDOM = rules.map(r => withAttrs(r, parsers)) as TagParseRule[]
    nodes[n.name] = node
  }

  const marks: Record<string, MarkSpec> = {}
  for (const m of spec.marks) {
    const attrs: Record<string, AttributeSpec> = {}
    for (const [name, a] of Object.entries(m.attrs)) attrs[name] = { default: a.default }
    const parserKey = m.name === 'highlight' && flavour.rawHighlightStyle ? 'highlightRaw' : m.name
    const parsers: [string, AttrParser | null][] = Object.keys(m.attrs).map(name => [name, ATTR_PARSERS[parserKey]?.[name] ?? null])
    marks[m.name] = {
      attrs,
      ...(m.excludes !== undefined ? { excludes: m.excludes } : {}),
      ...(m.name === 'link' ? { inclusive: true } : {}),
      parseDOM: (MARK_RULES[m.name] ?? []).map(r => withAttrs(r, parsers)),
    }
  }

  if (options.preserveUnknown) {
    const rawAttrs = { html: { default: '' }, tag: { default: '' } }
    const rawRule = (priority: number, context?: string): TagParseRule[] => RAW_TAGS.map(tag => ({
      tag,
      priority,
      ...(context ? { context } : {}),
      getAttrs: (dom: HTMLElement) => {
        const el = dom as unknown as El
        return { html: el.rawSource ?? '', tag: el.localName }
      },
    }))
    // Inside a text block the element stays inline, at its place in the text;
    // anywhere else it is a block of its own.
    nodes[RAW_INLINE] = { inline: true, group: 'inline', atom: true, attrs: rawAttrs, parseDOM: rawRule(61, 'paragraph/|heading/') }
    nodes[RAW_BLOCK] = { group: 'block', atom: true, attrs: rawAttrs, parseDOM: rawRule(60) }
  }

  const schema = new Schema({ topNode: 'doc', nodes, marks })
  cache.set(key, schema)
  return schema
}

// textAlign then commentId before a type's own attributes.
const rank = (name: string) => (name === 'textAlign' ? 0 : name === 'commentId' ? 1 : 2)
