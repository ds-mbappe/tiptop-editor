import { getSchemaSpec, type AttrSpec, type SchemaOptions } from './spec'
import type { DocMark, DocNode } from './types'

const withDefaults = (specAttrs: Record<string, AttrSpec>, given: Record<string, unknown> | undefined) => {
  const out: Record<string, unknown> = {}
  for (const [name, spec] of Object.entries(specAttrs)) {
    if (spec.default !== undefined) out[name] = spec.default
  }
  for (const [name, value] of Object.entries(given ?? {})) {
    if (value !== undefined) out[name] = value
  }
  return out
}

const sameMarks = (a: DocMark[] | undefined, b: DocMark[] | undefined) =>
  JSON.stringify(a ?? []) === JSON.stringify(b ?? [])

/**
 * Applies what Tiptap does when it loads a JSON document, so that
 * normalize(doc) deep-equals editor.getJSON() after a load:
 * fills attribute defaults, sorts marks by rank, merges neighbouring text
 * nodes with equal marks, drops empty `content` / `marks` / `attrs`.
 * Unknown nodes, marks and attributes are kept as they are, never stripped.
 * Returns a new document; the input is not mutated.
 */
export function normalize(doc: DocNode, options: SchemaOptions = {}): DocNode {
  const spec = getSchemaSpec(options)
  const nodes = new Map(spec.nodes.map(n => [n.name, n]))
  const marks = new Map(spec.marks.map(m => [m.name, m]))
  const rank = new Map(spec.marks.map((m, i) => [m.name, i]))

  const normMark = (mark: DocMark): DocMark => {
    const { attrs, ...rest } = mark
    const out: DocMark = { ...rest }
    const markSpec = marks.get(mark.type)
    const filled = markSpec ? withDefaults(markSpec.attrs, attrs) : { ...(attrs ?? {}) }
    if (Object.keys(filled).length) out.attrs = filled
    return out
  }

  const normNode = (node: DocNode): DocNode => {
    const { attrs, content, marks: nodeMarks, ...rest } = node
    const out: DocNode = { ...rest }
    const nodeSpec = nodes.get(node.type)
    const filled = nodeSpec ? withDefaults(nodeSpec.attrs, attrs) : attrs ? { ...attrs } : undefined
    if (filled && Object.keys(filled).length) out.attrs = filled

    if (Array.isArray(content) && content.length) {
      const children: DocNode[] = []
      for (const child of content.map(normNode)) {
        const last = children[children.length - 1]
        if (last && last.type === 'text' && child.type === 'text' && typeof last.text === 'string'
          && typeof child.text === 'string' && sameMarks(last.marks, child.marks)) {
          children[children.length - 1] = { ...last, text: last.text + child.text }
        } else {
          children.push(child)
        }
      }
      out.content = children
    }

    if (Array.isArray(nodeMarks) && nodeMarks.length) {
      // Stable sort: unknown marks keep their order, after the known ones.
      out.marks = nodeMarks.map(normMark)
        .map((m, i) => ({ m, i, r: rank.get(m.type) ?? Number.MAX_SAFE_INTEGER }))
        .sort((a, b) => a.r - b.r || a.i - b.i)
        .map(x => x.m)
    }
    return out
  }

  return normNode(doc)
}
