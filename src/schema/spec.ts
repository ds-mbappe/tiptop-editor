// The document schema shared by the web editor (Tiptap) and any other editor
// that reads or writes the same JSON (for example a native mobile editor).
//
// Plain data only: no React, no DOM, no Tiptap runtime. This module must load
// in Node, the browser and Hermes.
//
// It is NOT hand-guessed: src/schema/__tests__/parity.test.ts builds the real
// Tiptap schema from createDefaultExtensions() and fails when anything here
// (names, attributes, defaults, content expressions, mark order) drifts.

/** Bump when the shape of documents changes in a way readers must know about. */
export const SCHEMA_VERSION = 1

export interface AttrSpec {
  /**
   * The value Tiptap fills in when the attribute is missing.
   * `undefined` means Tiptap stores no value (getJSON leaves the key out once
   * serialised).
   */
  default: unknown
  /**
   * Values the web renders as written. Anything else still loads, but the web
   * renders it differently (e.g. heading level 4 renders as <h1>), so
   * validate() warns about it.
   */
  values?: readonly unknown[]
}

export interface NodeTypeSpec {
  name: string
  /** ProseMirror content expression, exactly as Tiptap declares it. */
  content?: string
  /** Space-separated groups, exactly as Tiptap declares them. */
  group?: string
  inline?: boolean
  /** ProseMirror `marks`; '' means no marks are allowed inside. */
  marks?: string
  /** Code content: whitespace is kept as written (codeBlock). */
  code?: boolean
  attrs: Record<string, AttrSpec>
}

export interface MarkTypeSpec {
  name: string
  /**
   * ProseMirror `excludes`. Left out: the mark only excludes itself (no two
   * marks of one type on a node). '_' excludes every other mark (code).
   */
  excludes?: string
  attrs: Record<string, AttrSpec>
}

export interface SchemaSpec {
  version: number
  /** Node types, in schema order. */
  nodes: NodeTypeSpec[]
  /** Mark types, in rank order: the order getJSON() lists a text node's marks. */
  marks: MarkTypeSpec[]
}

export interface SchemaOptions {
  /**
   * Include the comment mark and the `commentId` block attribute. TiptopEditor
   * only mounts them with `editorOptions.showCommentMenu: true`; an app that
   * does not set it has neither, so the default is off.
   */
  comments?: boolean
}

const TEXT_ALIGN: AttrSpec = { default: null, values: [null, 'left', 'center', 'right', 'justify'] }
const HEADING_LEVEL: AttrSpec = { default: 1, values: [1, 2, 3] }
const CELL_ATTRS: Record<string, AttrSpec> = {
  colspan: { default: 1 },
  rowspan: { default: 1 },
  colwidth: { default: null },
  align: { default: null },
}

/** Block types that carry `commentId` when the comments profile is on (NodeCommentExtension). */
export const COMMENTABLE_NODE_TYPES = [
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'taskList',
  'codeBlock',
] as const

// Schema order matches the Tiptap schema built from createDefaultExtensions().
const BASE_NODES: NodeTypeSpec[] = [
  { name: 'paragraph', group: 'block', content: 'inline*', attrs: { textAlign: TEXT_ALIGN } },
  { name: 'blockquote', group: 'block', content: 'block+', attrs: {} },
  { name: 'doc', content: 'block+', attrs: {} },
  { name: 'hardBreak', group: 'inline', inline: true, attrs: {} },
  { name: 'heading', group: 'block', content: 'inline*', attrs: { textAlign: TEXT_ALIGN, level: HEADING_LEVEL } },
  { name: 'text', group: 'inline', attrs: {} },
  { name: 'bulletList', group: 'block list', content: 'listItem+', attrs: {} },
  { name: 'listItem', content: 'paragraph block*', attrs: {} },
  { name: 'orderedList', group: 'block list', content: 'listItem+', attrs: { start: { default: 1 }, type: { default: null } } },
  { name: 'taskItem', content: 'paragraph+', attrs: { checked: { default: false, values: [true, false] } } },
  { name: 'taskList', group: 'block list', content: 'taskItem+', attrs: {} },
  { name: 'horizontalRule', group: 'block', attrs: {} },
  { name: 'codeBlock', group: 'block', content: 'text*', marks: '', code: true, attrs: { language: { default: null } } },
  { name: 'emoji', group: 'inline', inline: true, attrs: { name: { default: null } } },
  { name: 'table', group: 'block', content: 'tableRow+', attrs: {} },
  { name: 'tableCell', content: 'block+', attrs: CELL_ATTRS },
  { name: 'tableHeader', content: 'block+', attrs: CELL_ATTRS },
  { name: 'tableRow', content: '(tableCell | tableHeader)*', attrs: {} },
  {
    // The only image node. There is no `image` node: an uploaded picture is an
    // imageUploader with `src` set and `uploading: false`.
    name: 'imageUploader',
    group: 'block',
    inline: false,
    attrs: {
      id: { default: undefined },
      src: { default: null },
      progress: { default: 0 },
      failed: { default: false },
      uploading: { default: true },
      selectMedia: { default: true },
      errorMessage: { default: null },
      name: { default: undefined },
      size: { default: undefined },
    },
  },
]

const BASE_MARKS: MarkTypeSpec[] = [
  {
    name: 'link',
    attrs: {
      href: { default: null },
      target: { default: '_blank' },
      rel: { default: 'noopener noreferrer nofollow' },
      class: { default: null },
      title: { default: null },
    },
  },
  { name: 'textStyle', attrs: { color: { default: null } } },
  { name: 'bold', attrs: {} },
  { name: 'code', excludes: '_', attrs: {} },
  { name: 'italic', attrs: {} },
  { name: 'strike', attrs: {} },
  { name: 'underline', attrs: {} },
  { name: 'highlight', attrs: { color: { default: null } } },
  { name: 'subscript', attrs: {} },
  { name: 'superscript', attrs: {} },
]

const COMMENT_MARK: MarkTypeSpec = { name: 'comment', attrs: { commentId: { default: null } } }

const cache = new Map<boolean, SchemaSpec>()

/** The schema the editor builds; `{ comments: true }` adds the comment extensions. */
export function getSchemaSpec(options: SchemaOptions = {}): SchemaSpec {
  const comments = Boolean(options.comments)
  const cached = cache.get(comments)
  if (cached) return cached

  const commentable = new Set<string>(COMMENTABLE_NODE_TYPES)
  const nodes = BASE_NODES.map(node => ({
    ...node,
    attrs: comments && commentable.has(node.name)
      ? { ...node.attrs, commentId: { default: null } }
      : { ...node.attrs },
  }))
  const marks = comments ? [...BASE_MARKS, COMMENT_MARK] : [...BASE_MARKS]
  const spec: SchemaSpec = { version: SCHEMA_VERSION, nodes, marks }
  cache.set(comments, spec)
  return spec
}

export const NODE_NAMES: readonly string[] = BASE_NODES.map(n => n.name)
/** Mark names of the default profile, in rank order. */
export const MARK_NAMES: readonly string[] = BASE_MARKS.map(m => m.name)

/** True when ProseMirror refuses marks `a` and `b` on the same node (either way round). */
export function marksExclude(a: MarkTypeSpec, b: MarkTypeSpec): boolean {
  const one = (x: MarkTypeSpec, y: MarkTypeSpec) =>
    x.excludes === undefined ? x.name === y.name : x.excludes === '_' || x.excludes.split(' ').includes(y.name)
  return one(a, b) || one(b, a)
}
