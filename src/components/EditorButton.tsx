import { Tooltip, Button } from '@heroui/react'
import { useEffect, useState, useCallback } from 'react'
import type { EditorButtonProps } from '../types'
import Icon from './Icon'
import React from 'react'

const EditorButton = ({
  editor,
  buttonKey,
  tooltipText,
  isIconOnly = false,
  color = 'default',
  variant = 'light',
  isDisabled = false,
  icon = 'AtSign',
  iconClass,
  text = 'Button',
  withActive = false,
  onPressed,
}: EditorButtonProps) => {
  const [isActive, setIsActive] = useState(() => editor.isActive(buttonKey))

  useEffect(() => {
    const update = () => setIsActive(editor.isActive(buttonKey))
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor, buttonKey])

  const handlePress = useCallback(() => {
    onPressed?.()
  }, [onPressed])

  return (
    <Tooltip
      delay={250}
      closeDelay={0}
      content={tooltipText}
      isDisabled={tooltipText == null}
    >
      <Button
        size='sm'
        data-active={withActive ? isActive : false}
        color={color}
        variant={variant}
        isIconOnly={isIconOnly}
        isDisabled={isDisabled}
        className='text-foreground-500 hover:text-foreground data-[active=true]:bg-divider/45 data-[active=true]:text-primary data-[active=true]:hover:bg-divider/45 data-[active=true]:hover:text-foreground'
        onPress={handlePress}
      >
        {isIconOnly
          ? <Icon name={icon} className={iconClass} />
          : text
        }
      </Button>
    </Tooltip>
  )
}

export default React.memo(EditorButton)
