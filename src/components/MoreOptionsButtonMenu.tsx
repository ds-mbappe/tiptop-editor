import { Popover, PopoverTrigger, Button, Tooltip, PopoverContent, Divider } from '@heroui/react';
import { Editor } from '@tiptap/react'
import EditorButton from './EditorButton';
import Icon from './Icon';
import type { icons } from 'lucide-react';
import { useReducer, useEffect } from 'react';

const MoreOptionsButtonMenu = ({ editor }: { editor: Editor }) => {
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  useEffect(() => {
    const handleUpdate = () => forceUpdate()
    
    editor.on('selectionUpdate', handleUpdate)
    editor.on('transaction', handleUpdate)
    
    return () => {
      editor.off('selectionUpdate', handleUpdate)
      editor.off('transaction', handleUpdate)
    }
  }, [editor])

  const isActive =
    editor.isActive('subscript') ||
    editor.isActive('superscript') ||
    editor.isActive({ textAlign: 'left' }) ||
    editor.isActive({ textAlign: 'center' }) ||
    editor.isActive({ textAlign: 'right' }) ||
    editor.isActive({ textAlign: 'justify' })

  const scriptButtons = [
    {
      key: 'superscript',
      icon: 'Superscript',
      tooltipText: 'Superscript',
      command: () => editor.chain().focus().toggleSuperscript().run()
    },
    {
      key: 'subscript',
      icon: 'Subscript',
      tooltipText: 'Subscript',
      command: () => editor.chain().focus().toggleSubscript().run()
    },
  ]

  const alignButtons = [
    {
      key: 'left',
      icon: 'AlignLeft',
      tooltipText: 'Align left',
      command: () => editor.chain().focus().setTextAlign('left').run()
    },
    {
      key: 'center',
      icon: 'AlignCenter',
      tooltipText: 'Align center',
      command: () => editor.chain().focus().setTextAlign('center').run()
    },
    {
      key: 'right',
      icon: 'AlignRight',
      tooltipText: 'Align right',
      command: () => editor.chain().focus().setTextAlign('right').run()
    },
    {
      key: 'justify',
      icon: 'AlignJustify',
      tooltipText: 'Align justify',
      command: () => editor.chain().focus().setTextAlign('justify').run()
    },
  ]
  
  return (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button
          size='sm'
          data-active={isActive}
          color={'default'}
          variant={'light'}
          isIconOnly
          isDisabled={false}
          className='text-foreground-500 hover:text-foreground data-[active=true]:bg-divider/45 data-[active=true]:text-primary data-[active=true]:hover:bg-divider/45 data-[active=true]:hover:text-foreground'
          onPress={() => {}}
        >
          <Tooltip
            content="More options"
            delay={250}
            closeDelay={0}
            isDisabled={false}
          >
            <div className='w-full h-full flex items-center justify-center'>
              <Icon name={'EllipsisVertical'} />
            </div>
          </Tooltip>
        </Button>
      </PopoverTrigger>

      <PopoverContent className='p-1.5'>
        <div className='flex h-8 items-center gap-1.5'>
          {scriptButtons.map((element) =>
            <EditorButton
              key={element.key}
              editor={editor}
              isIconOnly
              withActive
              buttonKey={element.key}
              tooltipText={element.tooltipText}
              icon={element.icon as unknown as keyof typeof icons}
              onPressed={element.command}
            />
          )}

          <Divider orientation='vertical' className='h-6' />

          {alignButtons.map((element) => {
            const key = { textAlign: `${element.key}` }

            return (
              <EditorButton
                key={element.key}
                editor={editor}
                isIconOnly
                withActive
                buttonKey={key}
                tooltipText={element.tooltipText}
                icon={element.icon as unknown as keyof typeof icons}
                onPressed={element.command}
              />
            )}
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default MoreOptionsButtonMenu