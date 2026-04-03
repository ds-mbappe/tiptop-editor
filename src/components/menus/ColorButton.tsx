import React, { useCallback } from 'react';
import { Button, Tooltip } from '@heroui/react';
import ColorIcon from '../ui/ColorIcon';
import { ColorButtonProps } from '../../types';

const ColorButton = ({
  editor,
  buttonType,
  hsl,
  color,
  bgColor,
  tooltipText,
  tooltipDisabled = false,
}: ColorButtonProps) => {
  const isActive = useCallback(() => {
    if (!hsl) return false
    if (buttonType === 'text') {
      return editor.getAttributes('textStyle')?.color === hsl
    } else if (buttonType === 'highlight') {
      return editor.getAttributes('highlight')?.color === hsl
    } else {
      return false
    }
  }, [buttonType, editor, hsl])

  const handlePress = useCallback(() => {
    if (buttonType === 'text') {
      if (!hsl || isActive()) {
        editor.commands.unsetColor()
      } else {
        editor.commands.setColor(hsl)
      }
    } else {
      if (!hsl) {
        editor.commands.unsetHighlight();
      } else {
        editor.commands.toggleHighlight({ color: hsl });
      }
    }
  }, [editor, buttonType, hsl, isActive]);

  const button = (
    <Button
      size="sm"
      isIconOnly
      variant="ghost"
      isDisabled={false}
      aria-label={tooltipText}
      data-active={isActive()}
      className="text-muted data-[active=true]:bg-default/45 data-[active=true]:hover:bg-default/45"
      onPress={handlePress}
    >
      <div className="w-full h-full flex items-center justify-center">
        <ColorIcon color={color} bgColor={bgColor} buttonType={buttonType} />
      </div>
    </Button>
  )

  if (tooltipDisabled) {
    return button
  }

  return (
    <Tooltip delay={250} closeDelay={0}>
      {button}
      <Tooltip.Content>
        <p>{tooltipText}</p>
      </Tooltip.Content>
    </Tooltip>
  );
};

export default React.memo(ColorButton);
