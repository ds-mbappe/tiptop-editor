// @vitest-environment jsdom
// The pure schema must equal the schema Tiptap builds from the real editor
// extensions. Adding or changing an extension without updating
// src/schema/spec.ts turns this red.
import { describe, expect, it } from 'vitest'
import { getSchema, type Extensions } from '@tiptap/core'
import { createDefaultExtensions } from '../../components/editor/createDefaultExtensions'
import CommentMark from '../../extensions/comment/CommentMark'
import NodeCommentExtension from '../../extensions/comment/NodeCommentExtension'
import { getSchemaSpec, type SchemaSpec } from '../index'

type AttrMap = Record<string, { default: unknown }>

function describeTiptap(extensions: Extensions) {
  const schema = getSchema(extensions)
  const attrs = (spec: { attrs?: AttrMap }) =>
    Object.fromEntries(Object.entries(spec.attrs ?? {}).map(([k, v]) => [k, { default: v.default }]))
  const nodes: unknown[] = []
  schema.spec.nodes.forEach((name, spec) => {
    nodes.push({ name, content: spec.content, group: spec.group, marks: spec.marks, code: spec.code, attrs: attrs(spec as { attrs?: AttrMap }) })
  })
  const marks: unknown[] = []
  schema.spec.marks.forEach((name, spec) => {
    marks.push({ name, excludes: spec.excludes, attrs: attrs(spec as { attrs?: AttrMap }) })
  })
  return { nodes, marks }
}

function describePure(spec: SchemaSpec) {
  const attrs = (a: Record<string, { default: unknown }>) =>
    Object.fromEntries(Object.entries(a).map(([k, v]) => [k, { default: v.default }]))
  return {
    nodes: spec.nodes.map(n => ({ name: n.name, content: n.content, group: n.group, marks: n.marks, code: n.code, attrs: attrs(n.attrs) })),
    marks: spec.marks.map(m => ({ name: m.name, excludes: m.excludes, attrs: attrs(m.attrs) })),
  }
}

describe('schema parity with Tiptap', () => {
  it('default profile equals createDefaultExtensions()', () => {
    expect(describePure(getSchemaSpec())).toEqual(describeTiptap(createDefaultExtensions({})))
  })

  it('comments profile equals createDefaultExtensions() + CommentMark + NodeCommentExtension', () => {
    expect(describePure(getSchemaSpec({ comments: true }))).toEqual(
      describeTiptap([...createDefaultExtensions({}), CommentMark, NodeCommentExtension]),
    )
  })
})
