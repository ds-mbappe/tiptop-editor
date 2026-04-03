import React, { useCallback, useRef } from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import { Separator } from '@heroui/react'
import TableButtonMenu from '../menus/TableButtonMenu'
import { isTableCellSelection, isTextSelected } from '../../helpers'
import type { TextSelectionMenuProps } from '../../types'

const TableSelectionMenu = ({ editor, prepend, append }: TextSelectionMenuProps) => {
  const isHoveringRef = useRef(false)

  const shouldShow = useCallback(() => {
    if (isHoveringRef.current) return true
    return editor.isEditable && editor.isActive('table') && (isTableCellSelection(editor) || !isTextSelected(editor))
  }, [editor])

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={200}
      options={{ offset: 3 }}
      shouldShow={shouldShow}
    >
      <div
        onMouseEnter={() => { isHoveringRef.current = true }}
        onMouseLeave={() => { isHoveringRef.current = false }}
        className="bubble-menu"
      >
        {prepend && (
          <>
            <div className="flex items-center gap-1">
              {prepend}
            </div>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}
        <TableButtonMenu editor={editor} />
        {append && (
          <>
            <Separator orientation="vertical" className="h-6" />
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
