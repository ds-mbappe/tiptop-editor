export { default as TiptopEditor } from './components/editor/TiptopEditor'
export { TiptopEditorContext, useTiptopEditor } from './components/editor/TiptopEditorContext'
export { getDocumentMap, applyTargetedUpdate, applyTargetedUpdates } from './helpers'
export * from './types'

// Comments
export { CommentsProvider } from './components/comment/CommentsContext'
export { useComments } from './components/comment/useComments'
export { useCommentActions } from './components/comment/useCommentActions'
export { default as CommentSelectionMenu } from './components/comment/CommentSelectionMenu'
export { default as CommentMark } from './extensions/comment/CommentMark'
export { default as NodeCommentExtension } from './extensions/comment/NodeCommentExtension'

import './index.css'
