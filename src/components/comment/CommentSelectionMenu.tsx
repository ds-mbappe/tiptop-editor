import { BubbleMenu } from '@tiptap/react/menus'
import { Button, Tooltip } from '@heroui/react'
import { MessageSquarePlus } from 'lucide-react'
import { useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { useComments } from './useComments'
import { hasTextNodeInSelection, isForbiddenNodeSelected, isTextSelected } from '../../helpers'

/**
 * Bubble menu that appears on text selection only when the editor is in
 * view / review mode (`editable: false`). Rendered automatically by
 * `TiptopEditor` when `showCommentMenu: true` is set.
 */
const CommentSelectionMenu = ({ editor }: { editor: Editor }) => {
  const comments = useComments()

  const shouldShow = useCallback(() => {
    if (editor.isEditable) return false
    return isTextSelected(editor) && hasTextNodeInSelection(editor) && !isForbiddenNodeSelected(editor)
  }, [editor])

  const handleAddComment = useCallback(() => {
    if (!comments) return
    const { from, to } = editor.state.selection
    if (from === to) return
    comments.setPendingComment({ id: crypto.randomUUID(), type: 'inline', from, to })
  }, [editor, comments])

  if (!comments) return null

  return (
    <BubbleMenu editor={editor} updateDelay={200} shouldShow={shouldShow} options={{
      offset: {
        alignmentAxis: 10
      },
    }}>
      <div className="bubble-menu">
        <Tooltip delay={0} closeDelay={0}>
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            className="text-muted hover:text-foreground"
            onPress={handleAddComment}
          >
            <MessageSquarePlus size={16} />
          </Button>
          <Tooltip.Content>
            <p>Add comment</p>
          </Tooltip.Content>
        </Tooltip>
      </div>
    </BubbleMenu>
  )
}

export default CommentSelectionMenu
