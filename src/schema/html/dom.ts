// A small HTML parser and the slice of the DOM API that ProseMirror's
// DOMParser and the editor's parse rules read. No browser, no jsdom: runs in
// Hermes. It follows the HTML spec's tree building for what notes contain
// (implied </p> and </li>, void and raw-text elements, table cells); dom.test.ts
// compares its trees with a real HTML parser.

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'param', 'keygen'])
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes'])
// Start tags that close an open <p> (HTML spec, "in body").
const CLOSES_P = new Set([
  'address', 'article', 'aside', 'blockquote', 'center', 'details', 'dialog', 'dir', 'div', 'dl',
  'fieldset', 'figcaption', 'figure', 'footer', 'header', 'hgroup', 'main', 'menu', 'nav', 'ol', 'p',
  'search', 'section', 'summary', 'ul', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'listing', 'form',
  'li', 'dd', 'dt', 'plaintext', 'table', 'hr', 'xmp',
])
const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
// Elements that bound "button scope" / "list item scope" lookups.
const SCOPE = new Set(['applet', 'caption', 'html', 'table', 'td', 'th', 'marquee', 'object', 'template', 'button'])
const IMPLIED_END = new Set(['dd', 'dt', 'li', 'optgroup', 'option', 'p', 'rb', 'rp', 'rt', 'rtc'])
const IGNORED_IN_BODY = new Set(['html', 'body', 'head'])

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
  copy: '\u00a9', reg: '\u00ae', trade: '\u2122', hellip: '\u2026', mdash: '\u2014', ndash: '\u2013',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d', laquo: '\u00ab', raquo: '\u00bb',
  bull: '\u2022', middot: '\u00b7', euro: '\u20ac', deg: '\u00b0', times: '\u00d7', divide: '\u00f7',
  agrave: '\u00e0', aacute: '\u00e1', acirc: '\u00e2', auml: '\u00e4', ccedil: '\u00e7', egrave: '\u00e8',
  eacute: '\u00e9', ecirc: '\u00ea', euml: '\u00eb', icirc: '\u00ee', iuml: '\u00ef', ocirc: '\u00f4',
  ouml: '\u00f6', ugrave: '\u00f9', ucirc: '\u00fb', uuml: '\u00fc', Agrave: '\u00c0', Eacute: '\u00c9',
  Egrave: '\u00c8', Ccedil: '\u00c7', oelig: '\u0153', zwj: '\u200d', zwnj: '\u200c', shy: '\u00ad',
}

export function decodeEntities(text: string): string {
  if (!text.includes('&')) return text
  return text.replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);?/g, (all, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      if (!code || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '\ufffd'
      return String.fromCodePoint(code)
    }
    const value = ENTITIES[body]
    return value !== undefined && (all.endsWith(';') || ['amp', 'lt', 'gt', 'quot', 'nbsp'].includes(body)) ? value : all
  })
}

// ---------------------------------------------------------------- nodes

export class DomNode {
  parentNode: DomElement | null = null
  constructor(public readonly nodeType: number) {}

  get nextSibling(): DomNode | null {
    const siblings = this.parentNode?.childNodes
    if (!siblings) return null
    return siblings[siblings.indexOf(this) + 1] ?? null
  }

  get previousSibling(): DomNode | null {
    const siblings = this.parentNode?.childNodes
    if (!siblings) return null
    return siblings[siblings.indexOf(this) - 1] ?? null
  }

  get parentElement(): DomElement | null {
    return this.parentNode
  }

  get ownerDocument() {
    return OWNER
  }

  contains(other: DomNode | null): boolean {
    for (let n: DomNode | null = other; n; n = n.parentNode) if (n === this) return true
    return false
  }
}

export class DomText extends DomNode {
  readonly nodeName = '#text'
  constructor(public nodeValue: string) {
    super(3)
  }
  get textContent() {
    return this.nodeValue
  }
}

const OWNER = { createTextNode: (text: string) => new DomText(text) }

export class DomStyle {
  [prop: string]: unknown
  private readonly decls: [string, string][]

  constructor(source: string | null) {
    this.decls = []
    for (const decl of splitDeclarations(source ?? '')) {
      const i = decl.indexOf(':')
      if (i === -1) continue
      const name = decl.slice(0, i).trim().toLowerCase()
      let value = decl.slice(i + 1).trim().replace(/\s*!important$/i, '')
      if (!name || !value) continue
      if (name === 'color' || name === 'background-color') value = normalizeColor(value)
      const at = this.decls.findIndex(([n]) => n === name)
      if (at === -1) this.decls.push([name, value])
      else this.decls[at] = [name, value]
    }
    for (const [name, value] of this.decls) {
      this[name.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase())] = value
    }
  }

  get length(): number {
    return this.decls.length
  }

  getPropertyValue(name: string): string {
    return this.decls.find(([n]) => n === name)?.[1] ?? ''
  }
}

// Unset camel-cased properties read as '' like CSSStyleDeclaration.
const styleProxy = (style: DomStyle) => new Proxy(style, {
  get: (target, prop) => (prop in target ? (target as never)[prop] : typeof prop === 'string' ? '' : undefined),
})

export class DomElement extends DomNode {
  readonly childNodes: DomNode[] = []
  /** Attribute names lowercased, in source order. */
  readonly attrs: [string, string][]
  private styleCache: DomStyle | null = null
  /** The element's exact markup in the input, set by fromHTML for raw elements. */
  rawSource?: string
  /** Source offsets of the whole element in the input, end exclusive (-1 when implied). */
  start = -1
  end = -1

  constructor(public readonly localName: string, attrs: [string, string][] = []) {
    super(1)
    this.attrs = attrs
  }

  get nodeName() {
    return this.localName.toUpperCase()
  }
  get tagName() {
    return this.nodeName
  }
  get namespaceURI() {
    return 'http://www.w3.org/1999/xhtml'
  }
  get firstChild() {
    return this.childNodes[0] ?? null
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] ?? null
  }
  get children(): DomElement[] {
    return this.childNodes.filter((n): n is DomElement => n instanceof DomElement)
  }
  get firstElementChild(): DomElement | null {
    return this.children[0] ?? null
  }
  get classList(): string[] {
    return (this.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
  }
  get dataset(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [name, value] of this.attrs) {
      if (name.startsWith('data-')) out[name.slice(5).replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase())] = value
    }
    return out
  }
  get style(): DomStyle {
    return (this.styleCache ??= styleProxy(new DomStyle(this.getAttribute('style'))))
  }
  get textContent(): string {
    return this.childNodes.map(n => (n as DomText | DomElement).textContent).join('')
  }

  getAttribute(name: string): string | null {
    const lower = name.toLowerCase()
    return this.attrs.find(([n]) => n === lower)?.[1] ?? null
  }
  hasAttribute(name: string): boolean {
    return this.getAttribute(name) !== null
  }
  setAttribute(name: string, value: string): void {
    const lower = name.toLowerCase()
    const at = this.attrs.findIndex(([n]) => n === lower)
    if (at === -1) this.attrs.push([lower, String(value)])
    else this.attrs[at] = [lower, String(value)]
    if (lower === 'style') this.styleCache = null
  }

  appendChild<T extends DomNode>(child: T): T {
    child.parentNode?.removeChild(child)
    child.parentNode = this
    this.childNodes.push(child)
    return child
  }
  removeChild<T extends DomNode>(child: T): T {
    const at = this.childNodes.indexOf(child)
    if (at !== -1) this.childNodes.splice(at, 1)
    child.parentNode = null
    return child
  }

  matches(selector: string): boolean {
    return selector.split(',').some(s => matchCompound(this, s.trim()))
  }
  closest(selector: string): DomElement | null {
    for (let n: DomElement | null = this; n; n = n.parentNode) if (n.matches(selector)) return n
    return null
  }
  querySelector(selector: string): DomElement | null {
    return this.querySelectorAll(selector)[0] ?? null
  }
  querySelectorAll(selector: string): DomElement[] {
    const out: DomElement[] = []
    const walk = (el: DomElement) => {
      for (const child of el.children) {
        if (matchesComplex(child, selector, this)) out.push(child)
        walk(child)
      }
    }
    walk(this)
    return out
  }
}

// ------------------------------------------------------------- selectors
// Enough for the parse rules: `tag`, `*`, `[attr]`, `[attr="v"]`, `.class`,
// compounds of those, and the `a > b` child combinator.

function matchCompound(el: DomElement, compound: string): boolean {
  const re = /^([a-zA-Z][\w-]*|\*)?((?:\[[^\]]+\]|\.[\w-]+)*)$/
  const m = re.exec(compound)
  if (!m) throw new Error(`Unsupported selector "${compound}"`)
  if (m[1] && m[1] !== '*' && m[1].toLowerCase() !== el.localName) return false
  for (const part of m[2].match(/\[[^\]]+\]|\.[\w-]+/g) ?? []) {
    if (part[0] === '.') {
      if (!el.classList.includes(part.slice(1))) return false
      continue
    }
    const am = /^\[\s*([\w-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]*)))?\s*\]$/.exec(part)
    if (!am) throw new Error(`Unsupported selector "${compound}"`)
    const value = el.getAttribute(am[1])
    if (value === null) return false
    const want = am[2] ?? am[3] ?? am[4]
    if (want !== undefined && value !== want) return false
  }
  return true
}

function matchesComplex(el: DomElement, selector: string, scope: DomElement): boolean {
  return selector.split(',').some(s => {
    const parts = s.trim().split(/\s*>\s*/)
    let node: DomElement | null = el
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!node || node === scope || !matchCompound(node, parts[i])) return false
      node = node.parentNode
    }
    return true
  })
}

// ----------------------------------------------------------------- CSS

function splitDeclarations(style: string): string[] {
  const out: string[] = []
  let current = ''
  let quote = ''
  let depth = 0
  for (const ch of style) {
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') depth++
    else if (ch === ')' && depth > 0) depth--
    else if (ch === ';' && depth === 0) {
      out.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) out.push(current)
  return out
}

/** What a browser's CSSStyleDeclaration returns for a colour: hex becomes rgb()/rgba(). */
export function normalizeColor(value: string): string {
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value.trim())
  if (!hex) return value.replace(/\s+/g, ' ').trim()
  let h = hex[1]
  if (h.length <= 4) h = h.split('').map(c => c + c).join('')
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  if (h.length === 8) {
    // CSS colour serialisation: 2 decimals when they map back to the same byte, else 3.
    const byte = parseInt(h.slice(6, 8), 16)
    const two = Math.round((byte / 255) * 100) / 100
    const a = Math.round(two * 255) === byte ? two : Math.round((byte / 255) * 1000) / 1000
    return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`
  }
  return `rgb(${r}, ${g}, ${b})`
}

// ------------------------------------------------------------ tokenizer

type Token =
  | { kind: 'text'; text: string; start: number; end: number }
  | { kind: 'start'; name: string; attrs: [string, string][]; selfClosing: boolean; start: number; end: number }
  | { kind: 'end'; name: string; start: number; end: number }

function* tokenize(html: string): Generator<Token> {
  let i = 0
  const n = html.length
  let textStart = 0
  const flushText = function* (upTo: number): Generator<Token> {
    if (upTo > textStart) yield { kind: 'text', text: decodeEntities(html.slice(textStart, upTo)), start: textStart, end: upTo }
  }

  while (i < n) {
    const lt = html.indexOf('<', i)
    if (lt === -1) break
    const next = html[lt + 1]
    if (html.startsWith('<!--', lt)) {
      yield* flushText(lt)
      const close = html.indexOf('-->', lt + 4)
      i = close === -1 ? n : close + 3
      textStart = i
      continue
    }
    if (next === '!' || next === '?') {
      yield* flushText(lt)
      const close = html.indexOf('>', lt + 2)
      i = close === -1 ? n : close + 1
      textStart = i
      continue
    }
    const isEnd = next === '/'
    const nameStart = lt + (isEnd ? 2 : 1)
    if (!/[a-zA-Z]/.test(html[nameStart] ?? '')) {
      if (isEnd && html[nameStart] === '>') {
        yield* flushText(lt)
        i = nameStart + 1
        textStart = i
        continue
      }
      i = lt + 1
      continue
    }
    yield* flushText(lt)
    let j = nameStart
    while (j < n && !/[\s/>]/.test(html[j])) j++
    const name = html.slice(nameStart, j).toLowerCase()
    const attrs: [string, string][] = []
    let selfClosing = false
    // Attributes.
    while (j < n) {
      while (j < n && /\s/.test(html[j])) j++
      if (html[j] === '>') { j++; break }
      if (html[j] === '/') {
        if (html[j + 1] === '>') { selfClosing = true; j += 2; break }
        j++
        continue
      }
      const aStart = j
      j++
      while (j < n && !/[\s/>=]/.test(html[j])) j++
      const aName = html.slice(aStart, j).toLowerCase()
      while (j < n && /\s/.test(html[j])) j++
      let value = ''
      if (html[j] === '=') {
        j++
        while (j < n && /\s/.test(html[j])) j++
        const q = html[j]
        if (q === '"' || q === "'") {
          const close = html.indexOf(q, j + 1)
          value = html.slice(j + 1, close === -1 ? n : close)
          j = close === -1 ? n : close + 1
        } else {
          const vStart = j
          while (j < n && !/[\s>]/.test(html[j])) j++
          value = html.slice(vStart, j)
        }
      }
      if (!isEnd && !attrs.some(([a]) => a === aName)) attrs.push([aName, decodeEntities(value)])
    }
    i = j
    textStart = i
    if (isEnd) {
      yield { kind: 'end', name, start: lt, end: j }
      continue
    }
    yield { kind: 'start', name, attrs, selfClosing, start: lt, end: j }
    if (RAW_TEXT.has(name)) {
      const closeRe = new RegExp(`</${name}[\\s/>]`, 'ig')
      closeRe.lastIndex = j
      const m = closeRe.exec(html)
      const close = m ? m.index : n
      if (close > j) {
        const raw = html.slice(j, close)
        yield { kind: 'text', text: name === 'textarea' || name === 'title' ? decodeEntities(raw) : raw, start: j, end: close }
      }
      const gt = m ? html.indexOf('>', close) : n
      yield { kind: 'end', name, start: close, end: gt === -1 ? n : gt + 1 }
      i = gt === -1 ? n : gt + 1
      textStart = i
    }
  }
  yield* flushText(n)
}

// --------------------------------------------------------- tree builder

/**
 * Parses an HTML fragment the way a browser fills `<body>`. Element offsets
 * (start / end) index `normalizeSource(html)`.
 */
export function normalizeSource(html: string): string {
  return html.replace(/\r\n?/g, '\n').replace(/\0/g, '\ufffd')
}

/**
 * For each offset in normalizeSource(html) (and its end), the matching offset
 * in `html`. Only "\r\n" shrinks, so slices of the original can be taken from
 * offsets of the normalised text.
 */
export function sourceOffsets(html: string): number[] {
  const map: number[] = []
  for (let i = 0; i < html.length; i++) {
    if (html[i] === '\r' && html[i + 1] === '\n') continue
    map.push(i)
  }
  map.push(html.length)
  return map
}

export function parseHTMLFragment(html: string): DomElement {
  const source = normalizeSource(html)
  const body = new DomElement('body')
  body.start = 0
  body.end = source.length
  const stack: DomElement[] = [body]
  const current = () => stack[stack.length - 1]

  const inScope = (name: string, extra: Set<string> = new Set()) => {
    for (let i = stack.length - 1; i > 0; i--) {
      const el = stack[i]
      if (el.localName === name) return i
      if (SCOPE.has(el.localName) || extra.has(el.localName)) return -1
    }
    return -1
  }
  const popTo = (index: number, end: number) => {
    while (stack.length > index) {
      const el = stack.pop()!
      if (el.end === -1) el.end = end
    }
  }
  // The nearest open element named in `names` inside the current table,
  // not looking past `stop` elements or the table itself.
  const findInTable = (names: string[], stop: string[]) => {
    for (let i = stack.length - 1; i > 0; i--) {
      const el = stack[i].localName
      if (names.includes(el)) return i
      if (el === 'table' || stop.includes(el)) return -1
    }
    return -1
  }
  const closeP = (at: number) => {
    const i = inScope('p')
    if (i !== -1) popTo(i, at)
  }
  const insert = (el: DomElement) => current().appendChild(el)
  const appendText = (text: string) => {
    const last = current().lastChild
    if (last instanceof DomText) last.nodeValue += text
    else insert(new DomText(text) as never)
  }

  for (const token of tokenize(source)) {
    if (token.kind === 'text') {
      appendText(token.text)
      continue
    }
    const name = token.name
    if (token.kind === 'start') {
      if (IGNORED_IN_BODY.has(name)) continue
      if (CLOSES_P.has(name)) closeP(token.start)
      if (HEADINGS.has(name) && HEADINGS.has(current().localName)) popTo(stack.length - 1, token.start)
      if (name === 'li' || name === 'dd' || name === 'dt') {
        const names = name === 'li' ? ['li'] : ['dd', 'dt']
        for (let i = stack.length - 1; i > 0; i--) {
          const el = stack[i]
          if (names.includes(el.localName)) { popTo(i, token.start); break }
          if (SCOPE.has(el.localName) || (!['address', 'div', 'p'].includes(el.localName) && isSpecial(el.localName))) break
        }
      }
      if (name === 'td' || name === 'th') {
        const i = findInTable(['td', 'th'], ['tr'])
        if (i !== -1) popTo(i, token.start)
      }
      if (name === 'tr') {
        const i = findInTable(['tr'], [])
        if (i !== -1) popTo(i, token.start)
      }
      if (['tbody', 'thead', 'tfoot'].includes(name)) {
        const i = findInTable(['tbody', 'thead', 'tfoot'], [])
        if (i !== -1) popTo(i, token.start)
      }
      if (name === 'a') {
        const i = inScope('a')
        if (i !== -1) popTo(i, token.start)
      }
      // Implied table sections, as a browser inserts them.
      if (name === 'tr' && current().localName === 'table') {
        const tbody = new DomElement('tbody')
        insert(tbody)
        stack.push(tbody)
      }
      if ((name === 'td' || name === 'th') && ['table', 'tbody', 'thead', 'tfoot'].includes(current().localName)) {
        if (current().localName === 'table') {
          const tbody = new DomElement('tbody')
          insert(tbody)
          stack.push(tbody)
        }
        const tr = new DomElement('tr')
        insert(tr)
        stack.push(tr)
      }
      const el = new DomElement(name, token.attrs)
      el.start = token.start
      insert(el)
      if (VOID.has(name)) {
        el.end = token.end
      } else {
        stack.push(el)
      }
      continue
    }
    // End tags.
    if (name === 'br') {
      const el = new DomElement('br')
      el.start = token.start
      el.end = token.end
      insert(el)
      continue
    }
    if (IGNORED_IN_BODY.has(name)) continue
    if (name === 'p' && inScope('p') === -1) {
      const p = new DomElement('p')
      p.start = token.start
      p.end = token.end
      insert(p)
      continue
    }
    if (HEADINGS.has(name)) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (HEADINGS.has(stack[i].localName)) { popTo(i, token.end); break }
        if (SCOPE.has(stack[i].localName)) break
      }
      continue
    }
    if (['tr', 'tbody', 'thead', 'tfoot', 'table', 'td', 'th'].includes(name)) {
      // In a table, these end tags also close the open cells and rows inside.
      const stop = name === 'td' || name === 'th' ? ['tr'] : name === 'tr' ? [] : []
      const i = name === 'table' ? stack.map(e => e.localName).lastIndexOf('table') : findInTable([name], stop)
      if (i > 0) popTo(i, token.end)
      continue
    }
    for (let i = stack.length - 1; i > 0; i--) {
      const el = stack[i]
      if (el.localName === name) {
        popTo(i, token.end)
        break
      }
      if (isSpecial(el.localName) && !IMPLIED_END.has(el.localName)) break
    }
  }
  popTo(1, source.length)
  return body
}

const SPECIAL = new Set([
  'address', 'applet', 'area', 'article', 'aside', 'base', 'basefont', 'bgsound', 'blockquote', 'body', 'br',
  'button', 'caption', 'center', 'col', 'colgroup', 'dd', 'details', 'dir', 'div', 'dl', 'dt', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5',
  'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'iframe', 'img', 'input', 'keygen', 'li', 'link',
  'listing', 'main', 'marquee', 'menu', 'meta', 'nav', 'noembed', 'noframes', 'noscript', 'object', 'ol',
  'p', 'param', 'plaintext', 'pre', 'script', 'search', 'section', 'select', 'source', 'style', 'summary',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'title', 'tr', 'track', 'ul',
  'wbr', 'xmp',
])
const isSpecial = (name: string) => SPECIAL.has(name)

/** innerHTML of a parsed element, as a browser serialises it. For tests and raw nodes. */
export function serializeChildren(el: DomElement): string {
  return el.childNodes.map(serializeNode).join('')
}

export function serializeNode(node: DomNode): string {
  if (node instanceof DomText) {
    const parent = node.parentNode?.localName
    if (parent && RAW_TEXT.has(parent) && parent !== 'textarea' && parent !== 'title') return node.nodeValue
    return node.nodeValue.replace(/[&<>\u00a0]/g, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&nbsp;'))
  }
  const el = node as DomElement
  const attrs = el.attrs.map(([n, v]) => ` ${n}="${v.replace(/[&"\u00a0]/g, c => (c === '&' ? '&amp;' : c === '"' ? '&quot;' : '&nbsp;'))}"`).join('')
  if (VOID.has(el.localName)) return `<${el.localName}${attrs}>`
  return `<${el.localName}${attrs}>${serializeChildren(el)}</${el.localName}>`
}
