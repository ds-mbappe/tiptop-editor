import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const COMMENTABLE_BLOCK_TYPES = [
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'taskList',
  'codeBlock',
]

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nodeComment: {
      /**
       * Set a comment on the block node at the given ProseMirror position.
       */
      setNodeComment: (commentId: string, nodePos: number) => ReturnType
      /**
       * Remove the comment from every block node that carries the given commentId.
       */
      unsetNodeComment: (commentId: string) => ReturnType
    }
  }
}

const NodeCommentExtension = Extension.create({
  name: 'nodeComment',

  addGlobalAttributes() {
    return [
      {
        types: COMMENTABLE_BLOCK_TYPES,
        attributes: {
          commentId: {
            default: null,
            parseHTML: element => element.getAttribute('data-node-comment-id') || null,
            renderHTML: attributes => {
              if (!attributes.commentId) return {}
              return { 'data-node-comment-id': attributes.commentId }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setNodeComment:
        (commentId, nodePos) =>
        ({ tr, dispatch, state }) => {
          const node = state.doc.nodeAt(nodePos)
          if (!node) return false
          if (dispatch) {
            tr.setNodeMarkup(nodePos, undefined, { ...node.attrs, commentId })
            dispatch(tr)
          }
          return true
        },

      unsetNodeComment:
        commentId =>
        ({ tr, dispatch, state }) => {
          if (dispatch) {
            state.doc.forEach((node, pos) => {
              if (node.attrs.commentId === commentId) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, commentId: null })
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
          decorations(state) {
            const decorations: Decoration[] = []

            state.doc.forEach((node, pos) => {
              if (node.attrs.commentId) {
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: 'tiptop-node-comment',
                    'data-node-comment-id': node.attrs.commentId,
                  })
                )
              }
            })

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})

export default NodeCommentExtension
