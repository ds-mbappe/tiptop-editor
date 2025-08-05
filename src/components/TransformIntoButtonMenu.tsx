import { Popover, PopoverTrigger, Button, Tooltip, PopoverContent } from '@heroui/react';
import Icon from './Icon';
import { useEffect, useReducer, useState } from 'react';
import { icons } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { commandGroups } from '../constants';

const TransformIntoButtonMenu = ({ editor }: { editor: Editor }) => {
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  
  const [menuOpened, setMenuOpened] = useState<boolean>(false);

  const formattedTransformOptions = commandGroups.flatMap(group => group.commands);
  const activeNodeName = editor.state.selection.$head.parent.type.name

  useEffect(() => {
    const handleUpdate = () => forceUpdate()
    
    editor.on('selectionUpdate', handleUpdate)
    editor.on('transaction', handleUpdate)
    
    return () => {
      editor.off('selectionUpdate', handleUpdate)
      editor.off('transaction', handleUpdate)
    }
  }, [editor])

  return (
    <Popover
      placement="bottom"
      isOpen={menuOpened}
      onOpenChange={setMenuOpened}
    >
      <PopoverTrigger>
        <Button
          size='sm'
          color={'default'}
          variant={'light'}
          isIconOnly
          isDisabled={false}
          className='w-full text-foreground-500 hover:text-foreground px-2.5'
        >
          <Tooltip
            content="Transform into"
            delay={250}
            closeDelay={0}
            isDisabled={false}
          >
            <p className='w-full capitalize text-sm'>
              {activeNodeName}
            </p>
          </Tooltip>
        </Button>
      </PopoverTrigger>

      <PopoverContent className='px-1.5 py-2'>
        <div className='flex flex-col gap-1'>
          <p className='text-xs font-semibold leading-normal capitalize text-foreground px-2'>
            {'Turn into'}
          </p>

          <div className='flex flex-col gap-0.5'>
            {formattedTransformOptions.map((node) =>
              <Button
                key={node.key}
                size='sm'
                color={'default'}
                variant={'light'}
                isIconOnly={false}
                isDisabled={false}
                className='text-foreground-500 hover:text-foreground data-[active=true]:font-medium data-[active=true]:bg-divider/45 data-[active=true]:text-primary data-[active=true]:hover:bg-divider/45 data-[active=true]:hover:text-foreground'
                onPress={() => node.command({ editor, range: { from: editor.state.selection.from, to: editor.state.selection.to } })}
              >
                <div className='w-full h-full flex items-center gap-1'>
                  <Icon name={node.icon as unknown as keyof typeof icons} />

                  <p className='text-sm font-normal leading-normal capitalize'>
                    {node.title}
                  </p>
                </div>
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default TransformIntoButtonMenu