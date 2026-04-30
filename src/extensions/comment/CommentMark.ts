import { Mark } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      /**
       * Apply a comment mark to a specific text range.
       * The range must be provided explicitly so the mark can be applied
       * even after the editor selection has moved (e.g. after the user
       * has focused a sidebar input).
       */
      setComment: (commentId: string, range: { from: number; to: number }) => ReturnType
      /**
       * Remove a comment mark by its commentId, searching the whole document.
       */
      unsetComment: (commentId: string) => ReturnType
    }
  }
}

const CommentMark = Mark.create({
  name: 'comment',

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment-id'),
        renderHTML: attributes => {
          if (!attributes.commentId) return {}
          return { 'data-comment-id': attributes.commentId }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-comment-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, class: 'tiptop-comment' }, 0]
  },

  addCommands() {
    return {
      setComment:
        (commentId, range) =>
        ({ tr, dispatch, state }) => {
          const markType = state.schema.marks[this.name]
          if (!markType) return false
          if (dispatch) {
            tr.addMark(range.from, range.to, markType.create({ commentId }))
            dispatch(tr)
          }
          return true
        },

      unsetComment:
        commentId =>
        ({ tr, dispatch, state }) => {
          const markType = state.schema.marks[this.name]
          if (!markType) return false
          if (dispatch) {
            state.doc.descendants((node, pos) => {
              if (!node.isInline) return
              const mark = node.marks.find(
                m => m.type === markType && m.attrs.commentId === commentId
              )
              if (mark) {
                tr.removeMark(pos, pos + node.nodeSize, mark)
              }
            })
            dispatch(tr)
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleClick(view, _pos, event) {
            const target = event.target as HTMLElement
            const commentSpan = target.closest('[data-comment-id]') as HTMLElement | null
            if (!commentSpan) return false
            const commentId = commentSpan.getAttribute('data-comment-id')
            if (!commentId) return false
            view.dom.dispatchEvent(
              new CustomEvent('tiptop:comment-click', {
                bubbles: true,
                detail: { commentId },
              })
            )
            return false
          },
        },
      }),
    ]
  },
})

export default CommentMark
