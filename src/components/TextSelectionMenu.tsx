import { BubbleMenu } from '@tiptap/react/menus'
import { Editor } from '@tiptap/react'
import { Divider } from '@heroui/react'
import EditorButton from './EditorButton'
import { icons } from 'lucide-react'
// import LinkButtonMenu from './LinkButtonMenu'
import ColorButtonMenu from './ColorButtonMenu'
import MoreOptionsButtonMenu from './MoreOptionsButtonMenu'
// import TransformIntoButtonMenu from './TransformIntoButtonMenu'
import { useCallback } from 'react'
import { hasTextNodeInSelection, isForbiddenNodeSelected, isTextSelected } from '../helpers'

const TextSelectionMenu = ({ editor, prepend, append }: { editor: Editor, prepend?: React.ReactNode, append?: React.ReactNode }) => {
  const formattingButtons = [
    {
      icon: 'Bold',
      buttonKey: 'bold',
      tooltipText: 'Bold',
      command: () => editor.chain().focus().toggleMark('bold').run()
    },
    {
      icon: 'Italic',
      buttonKey: 'italic',
      tooltipText: 'Italic',
      command: () => editor.chain().focus().toggleMark('italic').run()
    },
    {
      icon: 'Underline',
      buttonKey: 'underline',
      tooltipText: 'Underline',
      command: () => editor.chain().focus().toggleMark('underline').run()
    },
    {
      icon: 'Strikethrough',
      buttonKey: 'strike',
      tooltipText: 'Strikethrough',
      command: () => editor.chain().focus().toggleMark('strike').run()
    },
    {
      icon: 'CodeXml',
      buttonKey: 'code',
      tooltipText: 'Code',
      command: () => editor.chain().focus().toggleMark('code').run()
    },
  ]

  const shouldShow = useCallback(() => {
    if (isTextSelected(editor) && hasTextNodeInSelection(editor) && !isForbiddenNodeSelected(editor)) {
      return true;
    }

    return false;
  }, [editor])

  if (!editor) return

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top', offset: 5 }}
      className='bubble-menu'
      shouldShow={shouldShow}
    >
      {prepend != null &&
        <div className='flex items-center gap-1'>
          {prepend}

          <Divider orientation='vertical' className='h-6' />
        </div>
      }

      {/* I decided to comment this, because well transform into
      already exists in the DragHandleMenu */}
      {/* <TransformIntoButtonMenu editor={editor} />

      <Divider orientation='vertical' className='h-6' /> */}

      {formattingButtons.map((button) =>
        <div key={button.buttonKey} className='flex item-center gap-0.5'>
          <EditorButton
            isIconOnly
            withActive
            editor={editor}
            buttonKey={button.buttonKey}
            tooltipText={button.tooltipText}
            icon={button.icon as unknown as keyof typeof icons}
            onPressed={button.command}
          />
        </div>
      )}

      <Divider orientation='vertical' className='h-6' />

      {/* <LinkButtonMenu editor={editor} /> */}

      <ColorButtonMenu editor={editor} />

      <Divider orientation='vertical' className='h-6' />

      {append != null &&
        <div className='flex items-center gap-1'>
          {append}

          <Divider orientation='vertical' className='h-6' />
        </div>
      }

      <MoreOptionsButtonMenu editor={editor} />
    </BubbleMenu>
  )
}

export default TextSelectionMenu