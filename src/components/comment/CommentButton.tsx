import { Tooltip, Button } from '@heroui/react'
import { MessageSquarePlus } from 'lucide-react'
import { useTiptopEditor } from '../editor/TiptopEditorContext'
import { useComments } from './useComments'

/**
 * A button meant to be placed in the `selectionMenuAppend` slot.
 * When pressed it snapshots the current text selection and opens
 * the comment sidebar so the user can type a new inline comment.
 */
const CommentButton = () => {
  const editor = useTiptopEditor()
  const comments = useComments()

  if (!editor || !comments) return null

  const { setPendingComment } = comments

  const handlePress = () => {
    const { from, to } = editor.state.selection
    if (from === to) return // nothing selected

    setPendingComment({
      id: crypto.randomUUID(),
      type: 'inline',
      from,
      to,
    })
  }

  return (
    <Tooltip delay={250} closeDelay={0}>
      <Button
        size="sm"
        variant="ghost"
        isIconOnly
        className="text-muted hover:text-foreground"
        onPress={handlePress}
      >
        <MessageSquarePlus size={16} />
      </Button>
      <Tooltip.Content>
        <p>Add comment</p>
      </Tooltip.Content>
    </Tooltip>
  )
}

export default CommentButton
