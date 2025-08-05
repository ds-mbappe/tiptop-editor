import { Tooltip, Button } from '@heroui/react'
import { useEffect, useReducer } from 'react'
import type { EditorButtonProps } from '../types'
import Icon from './Icon'

const EditorButton = (props: EditorButtonProps) => {
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  
  useEffect(() => {
    const handleUpdate = () => forceUpdate()
    
    props.editor.on('selectionUpdate', handleUpdate)
    props.editor.on('transaction', handleUpdate)
    
    return () => {
      props.editor.off('selectionUpdate', handleUpdate)
      props.editor.off('transaction', handleUpdate)
    }
  }, [props.editor])

  const tooltipDisabled = props.tooltipText == null
  const isActive = props.editor.isActive(props.buttonKey)

  return (
    <Tooltip
      delay={250}
      closeDelay={0}
      content={props.tooltipText}
      isDisabled={tooltipDisabled}
    >
      <Button
        size='sm'
        data-active={props.withActive ? isActive : false}
        color={props.color ?? 'default'}
        variant={props.variant ?? 'light'}
        isIconOnly={props.isIconOnly ?? false}
        isDisabled={props.isDisabled ?? false}
        className='text-foreground-500 hover:text-foreground data-[active=true]:bg-divider/45 data-[active=true]:text-primary data-[active=true]:hover:bg-divider/45 data-[active=true]:hover:text-foreground'
        onPress={() => {
          if (props.onPressed) props.onPressed()
        }}
      >
        {props.isIconOnly
          ? <Icon name={props.icon ?? 'AtSign'} className={props.iconClass ?? undefined} />
          : props.text ?? 'Button'
        }
      </Button>
    </Tooltip>
  )
}

export default EditorButton