// tiptop-editor/schema: the document contract, with no React, DOM or Tiptap
// runtime. Safe to import from Node, the browser and React Native (Hermes).
export {
  SCHEMA_VERSION,
  COMMENTABLE_NODE_TYPES,
  NODE_NAMES,
  MARK_NAMES,
  getSchemaSpec,
  marksExclude,
} from './spec'
export type { AttrSpec, NodeTypeSpec, MarkTypeSpec, SchemaSpec, SchemaOptions } from './spec'
export { validate } from './validate'
export { normalize } from './normalize'
export type { DocNode, DocMark, IssueCode, ValidationIssue, ValidationResult } from './types'
export { toHTML, UnsupportedContentError } from './html/serialize'
export type { ToHTMLOptions } from './html/serialize'
export { RAW_BLOCK, RAW_INLINE, RAW_TAGS, isRawType } from './raw'
export type { ValidateOptions } from './validate'
export { EMOJI } from './emoji'
export { fromHTML, fromHTMLWithSource } from './html/parse'
export type { FromHTMLOptions, SourceMap } from './html/parse'
export { DEFAULT_FLAVOUR } from './html/flavour'
export type { HtmlOptions, TiptapFlavour } from './html/flavour'
