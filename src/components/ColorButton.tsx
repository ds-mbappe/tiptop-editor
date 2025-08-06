import React, { useCallback } from 'react';
import { Button, Tooltip } from '@heroui/react';
import ColorIcon from './ColorIcon';
import { ColorButtonProps } from '../types';

const ColorButton = ({
  editor,
  buttonType,
  hsl,
  color,
  bgColor,
  tooltipText,
  tooltipDisabled = false,
}: ColorButtonProps) => {
  const isActive = buttonType === 'text'
    ? editor.getAttributes('textStyle')?.color === hsl
    : editor.getAttributes('highlight')?.color === hsl;

  const handlePress = useCallback(() => {
    if (buttonType === 'text') {
      if (isActive) {
        editor.commands.unsetColor()
      } else {
        editor.commands.setColor(hsl)
      }
    } else {
      editor.commands.toggleHighlight({ color: hsl });
    }
  }, [editor, buttonType, hsl, isActive]);

  return (
    <Tooltip content={tooltipText} delay={250} closeDelay={0} isDisabled={tooltipDisabled}>
      <Button
        size="sm"
        isIconOnly
        color="default"
        variant="light"
        isDisabled={false}
        aria-label={tooltipText}
        data-active={isActive}
        className="text-foreground-500 data-[active=true]:bg-divider/45 data-[active=true]:hover:bg-divider/45"
        onPress={handlePress}
      >
        <div className="w-full h-full flex items-center justify-center">
          <ColorIcon color={color} bgColor={bgColor} buttonType={buttonType} />
        </div>
      </Button>
    </Tooltip>
  );
};

export default React.memo(ColorButton);
