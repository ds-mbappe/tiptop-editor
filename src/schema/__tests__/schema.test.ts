// Pure tests: no DOM, no Tiptap. They run in the plain Node environment,
// which is the proof that the schema entry point works outside a browser.
import { describe, expect, it } from 'vitest'
import {
  MARK_NAMES,
  NODE_NAMES,
  getSchemaSpec,
  normalize,
  validate,
  type DocNode,
} from '../index'

const p = (text: string, extra: Partial<DocNode> = {}): DocNode => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
  ...extra,
})
const doc = (...content: DocNode[]): DocNode => ({ type: 'doc', content })

describe('schema spec', () => {
  it('lists every node type the default editor mounts', () => {
    expect([...NODE_NAMES].sort()).toEqual([
      'blockquote', 'bulletList', 'codeBlock', 'doc', 'emoji', 'hardBreak',
      'heading', 'horizontalRule', 'imageUploader', 'listItem', 'orderedList',
      'paragraph', 'table', 'tableCell', 'tableHeader', 'tableRow', 'taskItem',
      'taskList', 'text',
    ])
  })

  it('lists marks in ProseMirror rank order (the order getJSON emits them)', () => {
    expect(MARK_NAMES).toEqual([
      'link', 'textStyle', 'bold', 'code', 'italic', 'strike', 'underline',
      'highlight', 'subscript', 'superscript',
    ])
  })

  it('adds the comment mark and commentId attributes only in the comments profile', () => {
    const plain = getSchemaSpec()
    const withComments = getSchemaSpec({ comments: true })
    expect(plain.marks.map(m => m.name)).not.toContain('comment')
    expect(withComments.marks.at(-1)?.name).toBe('comment')
    expect(plain.nodes.find(n => n.name === 'paragraph')?.attrs).toEqual({ textAlign: { default: null, values: [null, 'left', 'center', 'right', 'justify'] } })
    expect(withComments.nodes.find(n => n.name === 'paragraph')?.attrs.commentId).toEqual({ default: null })
    expect(withComments.nodes.find(n => n.name === 'listItem')?.attrs.commentId).toBeUndefined()
  })
})

describe('validate', () => {
  it('accepts a minimal valid doc', () => {
    expect(validate(doc(p('hi')))).toEqual({ valid: true, issues: [] })
  })

  it('reports unknown nodes, marks and attributes without changing the doc', () => {
    const input = doc(
      { type: 'callout', attrs: { tone: 'info' }, content: [p('x')] },
      p('y', { attrs: { textAlign: null, mood: 'happy' } }),
      { type: 'paragraph', content: [{ type: 'text', text: 'z', marks: [{ type: 'sparkle' }] }] },
    )
    const before = JSON.stringify(input)
    const result = validate(input)
    expect(JSON.stringify(input)).toBe(before)
    expect(result.valid).toBe(false)
    expect(result.issues.map(i => [i.code, i.path.join('.'), i.severity])).toEqual([
      ['unknown_node', '0', 'error'],
      ['unknown_attr', '1', 'warning'],
      ['unknown_mark', '2.0', 'error'],
    ])
    expect(result.issues[1].attr).toBe('mood')
  })

  it('treats commentId as unknown unless the comments profile is on', () => {
    const input = doc(p('a', { attrs: { commentId: 'c1' } }))
    expect(validate(input).issues.map(i => i.code)).toEqual(['unknown_attr'])
    expect(validate(input, { comments: true }).valid).toBe(true)
  })

  it('reports content that breaks the content expressions', () => {
    const result = validate(doc(
      { type: 'bulletList', content: [{ type: 'paragraph' }] },
      { type: 'listItem', content: [{ type: 'heading', attrs: { level: 1 } }] },
      { type: 'codeBlock', content: [{ type: 'text', text: 'a', marks: [{ type: 'bold' }] }] },
      { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      { type: 'table' },
    ))
    // Pre-order: a node's own content is checked before its children.
    expect(result.issues.map(i => [i.code, i.path.join('.')])).toEqual([
      ['invalid_content', ''],
      ['invalid_content', '0'],
      ['invalid_content', '1'],
      ['mark_not_allowed', '2.0'],
      ['empty_text', '3.0'],
      ['invalid_content', '4'],
    ])
  })

  it('reports attribute values the web would render differently', () => {
    const result = validate(doc(
      { type: 'heading', attrs: { level: 4 }, content: [{ type: 'text', text: 'h' }] },
      p('x', { attrs: { textAlign: 'middle' } }),
    ))
    expect(result.issues.map(i => [i.code, i.attr, i.severity])).toEqual([
      ['invalid_attr_value', 'level', 'warning'],
      ['invalid_attr_value', 'textAlign', 'warning'],
    ])
  })

  it('reports a mark next to code, which excludes every other mark (lost on the web after HTML)', () => {
    const input = doc({ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'bold' }, { type: 'code' }] }] })
    const result = validate(input)
    expect(result.valid).toBe(false)
    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'mark_excluded', severity: 'error', path: [0, 0], type: 'code' }),
    ])
  })

  it('reports the same mark type twice on one text node', () => {
    const input = doc({ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'bold' }, { type: 'bold' }] }] })
    expect(validate(input).issues).toEqual([
      expect.objectContaining({ code: 'mark_excluded', path: [0, 0], type: 'bold' }),
    ])
  })

  it('reports a malformed root', () => {
    expect(validate(null).issues[0].code).toBe('not_a_node')
    expect(validate({ type: 'paragraph' }).issues[0].code).toBe('invalid_root')
  })
})

describe('normalize', () => {
  it('fills node attribute defaults the way Tiptap does on load', () => {
    expect(normalize(doc(p('a'), { type: 'heading', content: [{ type: 'text', text: 'h' }] }))).toEqual(doc(
      p('a', { attrs: { textAlign: null } }),
      { type: 'heading', attrs: { textAlign: null, level: 1 }, content: [{ type: 'text', text: 'h' }] },
    ))
  })

  it('fills mark defaults, sorts marks by rank and merges equal neighbours', () => {
    const input = doc({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'a', marks: [{ type: 'bold' }, { type: 'link', attrs: { href: 'https://x.test' } }] },
        { type: 'text', text: 'b', marks: [{ type: 'link', attrs: { href: 'https://x.test' } }, { type: 'bold', attrs: {} }] },
        { type: 'text', text: 'c', marks: [] },
      ],
    })
    expect(normalize(input).content![0].content).toEqual([
      {
        type: 'text',
        text: 'ab',
        marks: [
          { type: 'link', attrs: { href: 'https://x.test', target: '_blank', rel: 'noopener noreferrer nofollow', class: null, title: null } },
          { type: 'bold' },
        ],
      },
      { type: 'text', text: 'c' },
    ])
  })

  it('drops empty content arrays and empty attrs on attr-less nodes', () => {
    expect(normalize(doc({ type: 'blockquote', attrs: {}, content: [{ type: 'paragraph', content: [] }] }))).toEqual(
      doc({ type: 'blockquote', content: [{ type: 'paragraph', attrs: { textAlign: null } }] }),
    )
  })

  it('never strips unknown nodes, marks or attributes', () => {
    const input = doc(
      { type: 'callout', attrs: { tone: 'info' }, content: [p('x')] },
      p('y', { attrs: { mood: 'happy' } }),
    )
    expect(normalize(input)).toEqual(doc(
      { type: 'callout', attrs: { tone: 'info' }, content: [p('x', { attrs: { textAlign: null } })] },
      p('y', { attrs: { textAlign: null, mood: 'happy' } }),
    ))
  })

  it('does not mutate its input and is idempotent', () => {
    const input = doc(p('a'))
    const before = JSON.stringify(input)
    const once = normalize(input)
    expect(JSON.stringify(input)).toBe(before)
    expect(normalize(once)).toEqual(once)
  })

  it('leaves attributes without a default out instead of writing undefined', () => {
    const out = normalize(doc({ type: 'imageUploader', attrs: { src: 'https://x.test/a.png' } }))
    expect(out.content![0].attrs).toEqual({
      src: 'https://x.test/a.png', progress: 0, failed: false, uploading: true,
      selectMedia: true, errorMessage: null,
    })
    expect(Object.keys(out.content![0].attrs!)).not.toContain('id')
  })
})
