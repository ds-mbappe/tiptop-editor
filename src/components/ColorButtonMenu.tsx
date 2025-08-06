import React, { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverTrigger, Button, Tooltip, PopoverContent } from '@heroui/react';
import type { Editor } from '@tiptap/react';
import ColorButton from './ColorButton';
import { colorSections } from '../constants';

interface ColorButtonMenuProps {
  editor: Editor;
}

const ColorButtonMenu = ({ editor }: ColorButtonMenuProps) => {
  const getTextColor = useCallback(
    () => editor.getAttributes('textStyle')?.color || '',
    [editor]
  );
  const getBgColor = useCallback(
    () => editor.getAttributes('highlight')?.color || '',
    [editor]
  );

  const [textAndBorderColor, setTextAndBorderColor] = useState(getTextColor);
  const [backgroundColor, setBackgroundColor] = useState(getBgColor);

  useEffect(() => {
    const updateColors = () => {
      setTextAndBorderColor(getTextColor());
      setBackgroundColor(getBgColor());
    };

    editor.on('selectionUpdate', updateColors);
    editor.on('transaction', updateColors);
    return () => {
      editor.off('selectionUpdate', updateColors);
      editor.off('transaction', updateColors);
    };
  }, [editor, getTextColor, getBgColor]);

  return (
    <Popover placement="bottom">
      <PopoverTrigger>
        <Button
          size="sm"
          color="default"
          variant="light"
          isIconOnly
          isDisabled={false}
          aria-label="Color menu"
          className="text-foreground-500"
        >
          <Tooltip content="Color" delay={250} closeDelay={0}>
            <div className="w-full h-full flex items-center justify-center">
              <span
                className="relative w-5 h-5 flex items-center justify-center border border-divider rounded-full transition-transform duration-200 ease-in-out"
                style={{
                  borderColor: textAndBorderColor || 'hsla(var(--heroui-foreground), 0.5)',
                  backgroundColor: backgroundColor   || 'hsla(var(--heroui-foreground), 0.5)',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ color: textAndBorderColor || 'hsla(var(--heroui-foreground), 0.5)' }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.8944 5.55279C12.725 5.214 12.3787 5 12 5C11.6212 5 11.2749 5.214 11.1055 5.55279L5.10555 17.5528C4.85856 18.0468 5.05878 18.6474 5.55276 18.8944C6.04674 19.1414 6.64741 18.9412 6.8944 18.4472L8.64957 14.9369C8.75862 14.9777 8.87671 15 9 15H15C15.1233 15 15.2413 14.9777 15.3504 14.9369L17.1055 18.4472C17.3525 18.9412 17.9532 19.1414 18.4472 18.8944C18.9412 18.6474 19.1414 18.0468 18.8944 17.5528L12.8944 5.55279ZM14.3819 13L12 8.23607L9.61801 13H14.3819Z"
                  />
                </svg>
              </span>
            </div>
          </Tooltip>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="px-1.5 py-2">
        <div className="flex flex-col gap-2">
          {colorSections.map(section => (
            <div key={section.key} className="flex flex-col gap-1">
              <p className="text-xs font-semibold leading-normal capitalize text-foreground px-1">
                {section.title}
              </p>
              <div className="grid grid-cols-5 grid-rows-2 gap-0.5">
                {section.colors.map(c => (
                  <ColorButton
                    key={c.color}
                    hsl={c.hsl}
                    editor={editor}
                    color={c.color}
                    bgColor={c.bgColor}
                    tooltipText={c.tooltipText}
                    buttonType={section.buttonType}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default React.memo(ColorButtonMenu);