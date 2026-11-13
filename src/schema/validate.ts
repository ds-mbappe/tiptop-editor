import { isRawType } from './raw'
import { compileContent, type ContentMatcher } from './content'
import { getSchemaSpec, marksExclude, type MarkTypeSpec, type NodeTypeSpec, type SchemaOptions } from './spec'
import type { DocNode, ValidationIssue, ValidationResult } from './types'

const matchers = new Map<string, ContentMatcher>()

function matcherFor(node: NodeTypeSpec, nodes: NodeTypeSpec[], key: string): ContentMatcher | null {
  if (node.content === undefined) return null
  const id = `${key}:${node.name}`
  let m = matchers.get(id)
  if (!m) {
    m = compileContent(node.content, nodes)
    matchers.set(id, m)
  }
  return m
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Reports what the web editor could not load as written. It never changes or
 * strips anything: unknown content must survive any editor that does not
 * understand it.
 */
export interface ValidateOptions extends SchemaOptions {
  /** Accept the non-web rawBlock / rawInline nodes (a doc from fromHTML with preserveUnknown). */
  allowRaw?: boolean
}

export function validate(doc: unknown, options: ValidateOptions = {}): ValidationResult {
  const spec = getSchemaSpec(options)
  const key = options.comments ? 'c' : 'p'
  const nodesByName = new Map(spec.nodes.map(n => [n.name, n]))
  const marksByName = new Map(spec.marks.map(m => [m.name, m]))
  const issues: ValidationIssue[] = []

  const visit = (node: unknown, path: number[]) => {
    if (!isObject(node) || typeof node.type !== 'string') {
      issues.push({ code: 'not_a_node', severity: 'error', path, message: 'Not a node: expected an object with a string "type".' })
      return
    }
    const n = node as DocNode
    const nodeSpec = nodesByName.get(n.type)
    if (!nodeSpec && options.allowRaw && isRawType(n.type)) {
      if (typeof n.attrs?.html !== 'string') {
        issues.push({ code: 'invalid_attr_value', severity: 'error', path, type: n.type, attr: 'html', message: `"${n.type}" needs a string "html".` })
      }
    } else if (!nodeSpec) {
      issues.push({ code: 'unknown_node', severity: 'error', path, type: n.type, message: `Unknown node type "${n.type}".` })
    } else {
      for (const [attr, value] of Object.entries(n.attrs ?? {})) {
        const attrSpec = nodeSpec.attrs[attr]
        if (!attrSpec) {
          issues.push({ code: 'unknown_attr', severity: 'warning', path, type: n.type, attr, message: `Unknown attribute "${attr}" on "${n.type}".` })
        } else if (attrSpec.values && !attrSpec.values.includes(value)) {
          issues.push({ code: 'invalid_attr_value', severity: 'warning', path, type: n.type, attr, message: `"${attr}" on "${n.type}" is ${JSON.stringify(value)}; expected one of ${JSON.stringify(attrSpec.values)}.` })
        }
      }
      if (n.type === 'text') {
        if (typeof n.text !== 'string') {
          issues.push({ code: 'text_without_string', severity: 'error', path, type: n.type, message: 'A text node needs a string "text".' })
        } else if (n.text === '') {
          issues.push({ code: 'empty_text', severity: 'error', path, type: n.type, message: 'Empty text nodes are not allowed.' })
        }
      }
      const children = Array.isArray(n.content) ? n.content : []
      const matcher = matcherFor(nodeSpec, spec.nodes, key)
      const known = children.filter(c => isObject(c) && typeof c.type === 'string' && nodesByName.has(c.type as string)).map(c => (c as DocNode).type)
      const ok = matcher ? matcher(known) : children.length === 0
      if (!ok) {
        issues.push({ code: 'invalid_content', severity: 'error', path, type: n.type, message: `Children [${known.join(', ')}] do not match "${nodeSpec.content ?? '(leaf)'}" of "${n.type}".` })
      }
    }

    const seen: MarkTypeSpec[] = []
    for (const mark of Array.isArray(n.marks) ? n.marks : []) {
      if (!isObject(mark) || typeof mark.type !== 'string') continue
      const markSpec = marksByName.get(mark.type)
      if (!markSpec) {
        issues.push({ code: 'unknown_mark', severity: 'error', path, type: mark.type, message: `Unknown mark type "${mark.type}".` })
        continue
      }
      const clash = seen.find(other => marksExclude(other, markSpec))
      if (clash) {
        issues.push({ code: 'mark_excluded', severity: 'error', path, type: markSpec.excludes === '_' || clash.excludes !== '_' ? markSpec.name : clash.name, message: `Marks "${clash.name}" and "${markSpec.name}" cannot share a node; the web keeps only one after HTML.` })
      }
      seen.push(markSpec)
      for (const attr of Object.keys(isObject(mark.attrs) ? mark.attrs : {})) {
        if (!markSpec.attrs[attr]) {
          issues.push({ code: 'unknown_attr', severity: 'warning', path, type: mark.type, attr, message: `Unknown attribute "${attr}" on mark "${mark.type}".` })
        }
      }
    }

    if (Array.isArray(n.content)) {
      const parentSpec = nodesByName.get(n.type)
      n.content.forEach((child, i) => {
        if (parentSpec?.marks === '' && isObject(child) && Array.isArray(child.marks) && child.marks.length) {
          issues.push({ code: 'mark_not_allowed', severity: 'error', path: [...path, i], type: n.type, message: `"${n.type}" allows no marks.` })
        }
        visit(child, [...path, i])
      })
    }
  }

  if (isObject(doc) && typeof doc.type === 'string' && doc.type !== 'doc') {
    issues.push({ code: 'invalid_root', severity: 'error', path: [], type: doc.type, message: 'The root node must be "doc".' })
  } else {
    visit(doc, [])
  }

  return { valid: issues.length === 0, issues }
}
