import React, { useCallback } from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import { Divider } from '@heroui/react'
import TableButtonMenu from '../menus/TableButtonMenu'
import { isTableCellSelection, isTextSelected } from '../../helpers'
import type { TextSelectionMenuProps } from '../../types'

const TableSelectionMenu = ({ editor, prepend, append }: TextSelectionMenuProps) => {
  const shouldShow = useCallback(() => {
    return editor.isEditable && editor.isActive('table') && (isTableCellSelection(editor) || !isTextSelected(editor))
  }, [editor])

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={200}
      options={{ offset: 3 }}
      shouldShow={shouldShow}
    >
      <div className="bubble-menu">
        {prepend && (
          <>
            <div className="flex items-center gap-1">
              {prepend}
            </div>
            <Divider orientation="vertical" className="h-6" />
          </>
        )}
        <TableButtonMenu editor={editor} />
        {append && (
          <>
            <Divider orientation="vertical" className="h-6" />
            <div className="flex items-center gap-1">
              {append}
            </div>
          </>
        )}
      </div>
    </BubbleMenu>
  )
}

export default React.memo(TableSelectionMenu)
