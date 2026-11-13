/** A Tiptap / ProseMirror JSON node, as getJSON() returns it and as it is stored. */
export interface DocNode {
  type: string
  attrs?: Record<string, unknown>
  content?: DocNode[]
  marks?: DocMark[]
  text?: string
  [key: string]: unknown
}

export interface DocMark {
  type: string
  attrs?: Record<string, unknown>
  [key: string]: unknown
}

export type IssueCode =
  | 'not_a_node' // not an object with a string `type`
  | 'invalid_root' // the top node is not `doc`
  | 'unknown_node' // the web editor wipes the WHOLE document on load
  | 'unknown_mark' // the web editor wipes the WHOLE document on load
  | 'unknown_attr' // the web editor silently drops the attribute
  | 'invalid_attr_value' // loads, but the web renders it differently
  | 'invalid_content' // children break the node's content expression
  | 'mark_not_allowed' // a mark inside a node that allows none (codeBlock)
  | 'mark_excluded' // two marks that cannot share a node (code + anything, bold twice)
  | 'empty_text' // ProseMirror refuses empty text nodes: whole document wiped
  | 'text_without_string' // a text node without a string `text`

export interface ValidationIssue {
  code: IssueCode
  /** 'error': the web cannot load this as written. 'warning': it loads, but changes. */
  severity: 'error' | 'warning'
  /** Child indexes from the root: [2, 0] is doc.content[2].content[0]. */
  path: number[]
  /** The node type (or mark type, for mark issues). */
  type?: string
  attr?: string
  message: string
}

export interface ValidationResult {
  /** True when there is no issue at all, warnings included. */
  valid: boolean
  issues: ValidationIssue[]
}
