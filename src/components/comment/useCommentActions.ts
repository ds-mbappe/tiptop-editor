import { useCallback } from 'react'
import { useTiptopEditor } from '../editor/TiptopEditorContext'
import { useComments } from './useComments'
import type { PendingComment } from '../../types'

/**
 * Returns coordinated comment actions that keep the editor marks and the
 * CommentsContext in sync. Use this when building a custom comment UI instead
 * of reimplementing the editor↔context coordination yourself.
 *
 * Must be called inside both a `CommentsProvider` and a `TiptopEditor` tree.
 */
export const useCommentActions = () => {
  const editor = useTiptopEditor()
  const ctx = useComments()

  /** Apply a pending comment to the editor and register it in the context. */
  const submit = useCallback(
    (pending: PendingComment, content: string, author?: string) => {
      if (!editor || !ctx || !content.trim()) return
      if (pending.type === 'inline') {
        editor.commands.setComment(pending.id, { from: pending.from, to: pending.to })
      } else {
        editor.commands.setNodeComment(pending.id, pending.nodePos)
      }
      ctx.addComment(pending.id, pending.type, content.trim(), author)
    },
    [editor, ctx]
  )

  /** Remove a comment's mark/attribute from the editor and resolve it in the context. */
  const resolve = useCallback(
    (commentId: string) => {
      if (!editor || !ctx) return
      const comment = ctx.getComment(commentId)
      if (!comment) return
      if (comment.type === 'inline') editor.commands.unsetComment(commentId)
      else editor.commands.unsetNodeComment(commentId)
      ctx.resolveComment(commentId)
    },
    [editor, ctx]
  )

  /** Remove a comment's mark/attribute from the editor and delete it from the context. */
  const remove = useCallback(
    (commentId: string) => {
      if (!editor || !ctx) return
      const comment = ctx.getComment(commentId)
      if (!comment) return
      if (comment.type === 'inline') editor.commands.unsetComment(commentId)
      else editor.commands.unsetNodeComment(commentId)
      ctx.removeComment(commentId)
    },
    [editor, ctx]
  )

  return { submit, resolve, remove }
}
