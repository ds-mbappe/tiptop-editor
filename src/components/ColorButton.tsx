import { Button, Tooltip } from '@heroui/react'
import type { Editor } from '@tiptap/react';
import ColorIcon from './ColorIcon';

const ColorButton = ({ editor, buttonType, hsl, color, bgColor, tooltipText, tooltipDisabled }: {
  editor: Editor,
  buttonType: string,
  hsl: string,
  color: string,
  bgColor: string,
  tooltipText?: string,
  tooltipDisabled?: boolean,
}) => {
  const isActiveColor = editor.getAttributes('textStyle')?.color === hsl
  const isActiveHighlight = editor.getAttributes('highlight')?.color === hsl

  const setColorOrHighlight = () => {
    switch (buttonType) {
      case 'text':
        if (isActiveColor) {
          editor.commands.unsetColor();
        } else {
          editor.commands.setColor(hsl);
        }
        break;
      case 'highlight':
        editor.commands.toggleHighlight({ color: hsl });
        break;
      default:
        return;
    }
  }

  return (
    <Button
      size='sm'
      isIconOnly
      color={'default'}
      variant={'light'}
      isDisabled={false}
      data-active={buttonType === 'text' ? isActiveColor : isActiveHighlight}
      className='text-foreground-500 data-[active=true]:bg-divider/45 data-[active=true]:hover:bg-divider/45'
      onPress={setColorOrHighlight}
    >
      <Tooltip
        delay={250}
        closeDelay={0}
        isDisabled={tooltipDisabled ?? false}
        content={tooltipText}
      >
        <div className='w-full h-full flex items-center justify-center'>
          <ColorIcon
            color={color}
            bgColor={bgColor}
            buttonType={buttonType}
          />
        </div>
      </Tooltip>
    </Button>
  )
}

export default ColorButton