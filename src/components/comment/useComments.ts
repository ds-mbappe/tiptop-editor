import { useContext } from 'react'
import { CommentsContext } from './context'
import type { CommentsContextValue } from '../../types'

/**
 * Returns the comments context value, or `null` if no `CommentsProvider`
 * is present in the tree. Components that depend on comments should
 * guard against `null` and render nothing when it's absent.
 */
export const useComments = (): CommentsContextValue | null => {
  return useContext(CommentsContext)
}
