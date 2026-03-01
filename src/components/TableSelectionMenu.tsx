import React, { useCallback } from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import TableButtonMenu from './TableButtonMenu'
import { isTableCellSelection, isTextSelected } from '../helpers'
import type { TextSelectionMenuProps } from '../types'

const TableSelectionMenu = ({ editor }: TextSelectionMenuProps) => {
  const shouldShow = useCallback(() => {
    return editor.isActive('table') && (isTableCellSelection(editor) || !isTextSelected(editor))
  }, [editor])

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={200}
      options={{ offset: 3 }}
      shouldShow={shouldShow}
    >
      <div className="bubble-menu">
        <TableButtonMenu editor={editor} />
      </div>
    </BubbleMenu>
  )
}

export default React.memo(TableSelectionMenu)
