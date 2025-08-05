import { Popover, PopoverTrigger, PopoverContent, Button, Tooltip, Divider } from '@heroui/react'
import { Editor } from '@tiptap/react'
import { useState } from 'react';
import Icon from './Icon';
import EditorButton from './EditorButton';

const LinkButtonMenu = ({ editor }: { editor: Editor }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [linkValue, setLinkValue] = useState<string>('');

  const addOrUpdateLink = () => {
    
  }

  const openInNewTab = () => {

  }

  const removeLink = () => {
    setLinkValue('')
  }

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
          onPress={() => {
            setIsActive(!isActive);
          }}
        >
          <Tooltip
            content="Link"
            delay={250}
            closeDelay={0}
            isDisabled={false}
          >
            <div className='w-full h-full flex items-center justify-center'>
              <Icon name={'Link'} />
            </div>
          </Tooltip>
        </Button>
      </PopoverTrigger>

      <PopoverContent className='p-1.5'>
        <div className='flex items-center gap-1'>
          <div className='relative flex flex-wrap items-stretch'>
            <input
              className='block w-full h-8 text-sm font-normal leading-1.5 px-2 py-1.5 bg-none appearance-none outline-none'
              placeholder='Enter a link...'
              autoComplete='off'
              autoCorrect='off'
              autoCapitalize='off'
              autoFocus={true}
              type='url'
              value={linkValue}
              onChange={(e) => setLinkValue(e?.target?.value)}
            />
          </div>

          <EditorButton
            isIconOnly
            isDisabled={!linkValue}
            editor={editor}
            buttonKey='validate'
            tooltipText='Validate'
            icon='CornerDownLeft'
            withActive={false}
            onPressed={addOrUpdateLink}
          />

          <Divider orientation='vertical' className='h-6' />

          <div className='flex items-center gap-1.5'>
            <EditorButton
              isIconOnly
              isDisabled={!linkValue}
              editor={editor}
              buttonKey='open_in_new_tab'
              tooltipText='Open in new tab'
              icon='ExternalLink'
              withActive={false}
              onPressed={openInNewTab}
            />

            <EditorButton
              isIconOnly
              isDisabled={!linkValue}
              color='danger'
              buttonKey='remove_link'
              iconClass='text-danger'
              editor={editor}
              tooltipText='Remove link'
              icon='Trash'
              withActive={false}
              onPressed={removeLink}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default LinkButtonMenu