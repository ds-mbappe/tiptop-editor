// Test-only harness: a headless Tiptap editor with the exact extensions the
// web mounts. Needs the jsdom environment.
import { Editor, createDocument, type Extensions } from '@tiptap/core'
import { createDefaultExtensions } from '../../../components/editor/createDefaultExtensions'
import CommentMark from '../../../extensions/comment/CommentMark'
import NodeCommentExtension from '../../../extensions/comment/NodeCommentExtension'
import type { DocNode } from '../../types'

// jsdom has no layout: Range has no getClientRects. The slash-command menu
// measures the caret when a loaded text contains "/", which then rejects
// outside any test. Empty rects are enough for a headless editor.
if (typeof Range !== 'undefined' && !Range.prototype.getClientRects) {
  const rect = () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => ({}) })
  Range.prototype.getClientRects = (() => Object.assign([], { item: () => null })) as never
  Range.prototype.getBoundingClientRect = rect as never
}

let plain: Editor | null = null
let withComments: Editor | null = null

function extensions(comments: boolean): Extensions {
  const base = createDefaultExtensions({})
  return comments ? [...base, CommentMark, NodeCommentExtension] : base
}

/** One shared editor per profile: building one per test is slow. */
export function webEditor(comments = false): Editor {
  if (comments) return (withComments ??= new Editor({ extensions: extensions(true) }))
  return (plain ??= new Editor({ extensions: extensions(false) }))
}

/** What the web gets after loading `content` (JSON or HTML) and calling getJSON(). */
export function webLoad(content: DocNode | string, comments = false): DocNode {
  const editor = webEditor(comments)
  editor.commands.setContent(content as never, { emitUpdate: false })
  return editor.getJSON() as DocNode
}

/** What the web stores: getHTML() after loading `content`. */
export function webHTML(content: DocNode | string, comments = false): string {
  const editor = webEditor(comments)
  editor.commands.setContent(content as never, { emitUpdate: false })
  return editor.getHTML()
}

/**
 * jsdom rewrites style attributes as it serialises (`#f00` → `rgb(255, 0, 0)`,
 * adds a trailing `;`); browsers keep them as written. Pass both sides of a
 * byte comparison through this so only real differences remain.
 */
export function canonicalHTML(html: string): string {
  const template = document.createElement('template')
  template.innerHTML = html
  template.content.querySelectorAll<HTMLElement>('[style]').forEach(el => {
    el.setAttribute('style', el.style.cssText)
  })
  return template.innerHTML
}

/** Which Tiptap the oracle runs on: "web-prod" (a pinned, deployed stack, see vitest.config.ts) or "next" (this repo's). */
export const STACK = process.env.TIPTAP_STACK ?? 'next'

/**
 * The web's parse of `html` alone: Tiptap's createDocument, as the editor does
 * on load, before plugins (trailing node, table fixing) touch the document.
 */
export function webParse(html: string, comments = false): DocNode {
  return createDocument(html, webEditor(comments).schema, {}).toJSON() as DocNode
}
