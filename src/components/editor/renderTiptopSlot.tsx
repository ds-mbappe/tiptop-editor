import type { Editor } from '@tiptap/react'
import type { ReactNode } from 'react'
import type { TiptopEditorSlot } from '../../types'

export const renderTiptopSlot = (
  slot: TiptopEditorSlot | undefined,
  editor: Editor | null,
): ReactNode => {
  if (slot == null) {
    return null
  }

  if (typeof slot !== 'function') {
    return slot
  }

  if (!editor) {
    return null
  }

  return slot({ editor })
}
