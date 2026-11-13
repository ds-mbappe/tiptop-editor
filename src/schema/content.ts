// A tiny matcher for the ProseMirror content expressions this schema uses:
// sequences of terms, each a node name, a group name or a parenthesised
// `a | b` choice, optionally followed by `*`, `+` or `?`.
// It is not a general ProseMirror implementation; parity.test.ts keeps the
// expressions in step with Tiptap, and contentExpr.test.ts covers the grammar.

import type { NodeTypeSpec } from './spec'

interface Term {
  names: Set<string>
  min: number
  max: number
}

export type ContentMatcher = (childTypes: string[]) => boolean

export function compileContent(expr: string, nodes: NodeTypeSpec[]): ContentMatcher {
  const terms = parse(expr, nodes)
  return childTypes => {
    // Greedy matching is exact for these expressions: no term can be followed
    // by one that accepts the same node with a lower bound left to fill.
    let i = 0
    for (const term of terms) {
      let count = 0
      while (count < term.max && i < childTypes.length && term.names.has(childTypes[i])) {
        i++
        count++
      }
      if (count < term.min) return false
    }
    return i === childTypes.length
  }
}

function parse(expr: string, nodes: NodeTypeSpec[]): Term[] {
  const tokens = expr.match(/\(|\)|\||[*+?]|[A-Za-z_][\w]*/g) ?? []
  const terms: Term[] = []
  let pos = 0

  const resolve = (name: string): string[] => {
    const exact = nodes.filter(n => n.name === name)
    if (exact.length) return [name]
    const inGroup = nodes.filter(n => (n.group ?? '').split(' ').includes(name)).map(n => n.name)
    if (!inGroup.length) throw new Error(`Unknown node or group "${name}" in content expression "${expr}"`)
    return inGroup
  }

  while (pos < tokens.length) {
    const names = new Set<string>()
    if (tokens[pos] === '(') {
      pos++
      while (tokens[pos] !== ')') {
        if (pos >= tokens.length) throw new Error(`Unclosed "(" in "${expr}"`)
        if (tokens[pos] !== '|') resolve(tokens[pos]).forEach(n => names.add(n))
        pos++
      }
      pos++
    } else {
      resolve(tokens[pos]).forEach(n => names.add(n))
      pos++
    }
    let min = 1
    let max = 1
    if (tokens[pos] === '*') { min = 0; max = Infinity; pos++ }
    else if (tokens[pos] === '+') { min = 1; max = Infinity; pos++ }
    else if (tokens[pos] === '?') { min = 0; max = 1; pos++ }
    terms.push({ names, min, max })
  }
  return terms
}
