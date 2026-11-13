// Test-only: fast-check generators of schema-valid documents.
import fc from 'fast-check'
import type { DocMark, DocNode } from '../../types'

const CHARS = ['a', 'b', 'Z', ' ', '  ', '&', '<', '>', '"', "'", '\u00a0', 'é', 'ش', '😀', '\t', 'x y']
const text = fc.array(fc.constantFrom(...CHARS), { minLength: 1, maxLength: 6 }).map(a => a.join(''))

const color = fc.constantFrom('#ff0000', '#00f', 'rgb(17, 85, 204)', 'red')
const markPool: fc.Arbitrary<DocMark>[] = [
  fc.constant({ type: 'bold' }),
  fc.constant({ type: 'italic' }),
  fc.constant({ type: 'strike' }),
  fc.constant({ type: 'underline' }),
  fc.constant({ type: 'subscript' }),
  fc.constant({ type: 'superscript' }),
  color.map(c => ({ type: 'textStyle', attrs: { color: c } })),
  color.map(c => ({ type: 'highlight', attrs: { color: c } })),
  fc.constantFrom('https://example.com/a?b=1&c=2', 'mailto:a@example.com', '/relative').map(href => ({ type: 'link', attrs: { href } })),
]
// code excludes every other mark: either code alone, or a set without it.
const marks: fc.Arbitrary<DocMark[]> = fc.oneof(
  { weight: 1, arbitrary: fc.constant<DocMark[]>([{ type: 'code' }]) },
  { weight: 4, arbitrary: fc.uniqueArray(fc.oneof(...markPool), { maxLength: 3, selector: m => m.type }) },
)

const inlineNode: fc.Arbitrary<DocNode> = fc.oneof(
  { weight: 6, arbitrary: fc.tuple(text, marks).map(([t, m]) => ({ type: 'text', text: t, ...(m.length ? { marks: m } : {}) })) },
  { weight: 1, arbitrary: fc.constant({ type: 'hardBreak' }) },
)
const inline = fc.array(inlineNode, { maxLength: 5 })
const align = fc.constantFrom(null, 'left', 'center', 'right', 'justify')

const paragraph = fc.tuple(inline, align).map(([content, textAlign]) => ({
  type: 'paragraph', ...(textAlign ? { attrs: { textAlign } } : {}), ...(content.length ? { content } : {}),
}))
const heading = fc.tuple(inline, align, fc.constantFrom(1, 2, 3)).map(([content, textAlign, level]) => ({
  type: 'heading', attrs: { level, ...(textAlign ? { textAlign } : {}) }, ...(content.length ? { content } : {}),
}))

const block = (depth: number): fc.Arbitrary<DocNode> => {
  const leaves: fc.Arbitrary<DocNode>[] = [
    paragraph, heading,
    fc.constant({ type: 'horizontalRule' }),
    fc.tuple(fc.array(fc.constantFrom('x', ' ', '\n', '<a>', '&', '  y'), { minLength: 1, maxLength: 5 }), fc.constantFrom(null, 'js', 'python'))
      .map(([parts, language]) => ({ type: 'codeBlock', attrs: { language }, content: [{ type: 'text', text: parts.join('') }] })),
    fc.webUrl().map(src => ({ type: 'imageUploader', attrs: { id: 'img', src, uploading: false, selectMedia: false, progress: 100 } })),
  ]
  if (depth >= 2) return fc.oneof(...leaves)
  const item = (type: string, extra: fc.Arbitrary<Record<string, unknown>>) =>
    fc.tuple(paragraph, fc.array(block(depth + 1), { maxLength: 2 }), extra).map(([p, rest, attrs]) => ({
      type, ...(Object.keys(attrs).length ? { attrs } : {}), content: [p, ...rest],
    }))
  const listItem = item('listItem', fc.constant({}))
  return fc.oneof(
    ...leaves,
    fc.array(listItem, { minLength: 1, maxLength: 3 }).map(content => ({ type: 'bulletList', content })),
    fc.tuple(fc.array(listItem, { minLength: 1, maxLength: 3 }), fc.constantFrom(1, 3, 10)).map(([content, start]) => ({ type: 'orderedList', attrs: { start }, content })),
    fc.array(fc.tuple(paragraph, fc.boolean()).map(([p, checked]) => ({ type: 'taskItem', attrs: { checked }, content: [p] })), { minLength: 1, maxLength: 3 })
      .map(content => ({ type: 'taskList', content })),
    fc.array(block(depth + 1), { minLength: 1, maxLength: 2 }).map(content => ({ type: 'blockquote', content })),
  )
}

export const docArbitrary: fc.Arbitrary<DocNode> = fc.array(block(0), { minLength: 1, maxLength: 6 }).map(content => ({ type: 'doc', content }))
