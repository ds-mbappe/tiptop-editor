import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  PendingComment,
  TiptopComment,
  TiptopCommentReply,
} from '../../types'
import { CommentsContext } from './context'

interface CommentsProviderProps {
  children: ReactNode
  /** Pre-populate the comment list (e.g. data fetched from your API on mount). */
  initialComments?: TiptopComment[]
  /** Called whenever the comments array changes. Use this to persist or sync externally. */
  onCommentsChange?: (comments: TiptopComment[]) => void
}

export const CommentsProvider = ({ children, initialComments, onCommentsChange }: CommentsProviderProps) => {
  const [comments, setComments] = useState<TiptopComment[]>(initialComments ?? [])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [pendingComment, setPendingComment] = useState<PendingComment | null>(null)

  // Persist callback kept in a ref so it never triggers re-renders
  const onChangeRef = useRef(onCommentsChange)
  onChangeRef.current = onCommentsChange

  const updateComments = useCallback(
    (updater: (prev: TiptopComment[]) => TiptopComment[]) => {
      setComments(prev => {
        const next = updater(prev)
        onChangeRef.current?.(next)
        return next
      })
    },
    []
  )

  const addComment = useCallback(
    (id: string, type: 'inline' | 'node', content: string, author?: string) => {
      updateComments(prev => [
        ...prev,
        {
          id,
          type,
          content,
          author,
          createdAt: new Date(),
          replies: [] as TiptopCommentReply[],
          resolved: false,
        },
      ])
      setActiveCommentId(id)
      setPendingComment(null)
    },
    [updateComments]
  )

  const removeComment = useCallback(
    (id: string) => {
      updateComments(prev => prev.filter(c => c.id !== id))
      setActiveCommentId(prev => (prev === id ? null : prev))
    },
    [updateComments]
  )

  const resolveComment = useCallback(
    (id: string) => {
      updateComments(prev => prev.map(c => (c.id === id ? { ...c, resolved: true } : c)))
      setActiveCommentId(prev => (prev === id ? null : prev))
    },
    [updateComments]
  )

  const replyToComment = useCallback(
    (commentId: string, content: string, author?: string) => {
      updateComments(prev =>
        prev.map(c => {
          if (c.id !== commentId) return c
          return {
            ...c,
            replies: [
              ...c.replies,
              {
                id: crypto.randomUUID(),
                content,
                author,
                createdAt: new Date(),
              },
            ],
          }
        })
      )
    },
    [updateComments]
  )

  const getComment = useCallback(
    (id: string) => comments.find(c => c.id === id),
    [comments]
  )

  // ── Listen for comment-click events that bubble up from ProseMirror ──────────
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handle = (e: Event) => {
      const commentId = (e as CustomEvent<{ commentId: string }>).detail.commentId
      setActiveCommentId(commentId)
      setPendingComment(null)
    }
    el.addEventListener('tiptop:comment-click', handle)
    return () => el.removeEventListener('tiptop:comment-click', handle)
  }, [])

  return (
    <CommentsContext.Provider
      value={{
        comments,
        activeCommentId,
        pendingComment,
        addComment,
        removeComment,
        resolveComment,
        replyToComment,
        setActiveCommentId,
        setPendingComment,
        getComment,
      }}
    >
      <div ref={containerRef} style={{ display: 'contents' }}>
        {children}
      </div>
    </CommentsContext.Provider>
  )
}
