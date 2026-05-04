import { useCallback, useEffect, useState } from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import { Button, Separator, Tooltip } from '@heroui/react'
import { ExternalLink, Unlink } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { isTextSelected, unsetLink } from '../../helpers'

const LinkPreviewMenu = ({ editor }: { editor: Editor }) => {
  const [href, setHref] = useState('')

  useEffect(() => {
    const update = () => setHref(editor.getAttributes('link').href ?? '')
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  const shouldShow = useCallback(() => {
    return editor.isEditable && editor.isActive('link') && !isTextSelected(editor)
  }, [editor])

  const openLink = useCallback(() => {
    if (href) window.open(href, '_blank', 'noopener,noreferrer')
  }, [href])

  const removeLink = useCallback(() => {
    unsetLink(editor)
  }, [editor])

  return (
    <BubbleMenu
      ref={(el) => { if (el) el.style.zIndex = '9999' }}
      editor={editor}
      updateDelay={0}
      shouldShow={shouldShow}
    >
      <div className="bubble-menu">
        <span className="text-sm text-muted truncate max-w-[200px] px-1 select-none">
          {href}
        </span>

        <Separator orientation="vertical" className="h-6" />

        <Tooltip delay={0} closeDelay={0}>
          <Button size="sm" variant="ghost" isIconOnly className="text-muted hover:text-foreground" onPress={openLink}>
            <ExternalLink size={16} />
          </Button>
          <Tooltip.Content><p>Open link</p></Tooltip.Content>
        </Tooltip>

        <Tooltip delay={0} closeDelay={0}>
          <Button size="sm" variant="ghost" isIconOnly className="text-danger hover:text-danger" onPress={removeLink}>
            <Unlink size={16} />
          </Button>
          <Tooltip.Content><p>Remove link</p></Tooltip.Content>
        </Tooltip>
      </div>
    </BubbleMenu>
  )
}

export default LinkPreviewMenu
