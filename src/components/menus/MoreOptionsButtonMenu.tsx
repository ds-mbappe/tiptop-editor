import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Popover, Button, Separator, Tooltip } from '@heroui/react';
import type { Editor } from '@tiptap/react';
import EditorButton from '../ui/EditorButton';
import Icon from '../ui/Icon';
import type { icons } from 'lucide-react';

interface MoreOptionsButtonMenuProps {
  editor: Editor;
}

const MoreOptionsButtonMenu = ({ editor }: MoreOptionsButtonMenuProps) => {
  const computeIsActive = useCallback(() => {
    return (
      editor.isActive('subscript') ||
      editor.isActive('superscript') ||
      editor.isActive({ textAlign: 'left' }) ||
      editor.isActive({ textAlign: 'center' }) ||
      editor.isActive({ textAlign: 'right' }) ||
      editor.isActive({ textAlign: 'justify' })
    );
  }, [editor]);

  const [isActive, setIsActive] = useState(computeIsActive);

  useEffect(() => {
    const update = () => setIsActive(computeIsActive());
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor, computeIsActive]);

  const scriptButtons = useMemo(
    () => [
      {
        key: 'superscript',
        icon: 'Superscript' as keyof typeof icons,
        tooltipText: 'Superscript',
        command: () => editor.chain().focus().toggleSuperscript().run(),
      },
      {
        key: 'subscript',
        icon: 'Subscript' as keyof typeof icons,
        tooltipText: 'Subscript',
        command: () => editor.chain().focus().toggleSubscript().run(),
      },
    ],
    [editor]
  );

  const alignButtons = useMemo(
    () => [
      {
        key: 'left',
        icon: 'AlignLeft' as keyof typeof icons,
        tooltipText: 'Align left',
        command: () => editor.chain().focus().setTextAlign('left').run(),
      },
      {
        key: 'center',
        icon: 'AlignCenter' as keyof typeof icons,
        tooltipText: 'Align center',
        command: () => editor.chain().focus().setTextAlign('center').run(),
      },
      {
        key: 'right',
        icon: 'AlignRight' as keyof typeof icons,
        tooltipText: 'Align right',
        command: () => editor.chain().focus().setTextAlign('right').run(),
      },
      {
        key: 'justify',
        icon: 'AlignJustify' as keyof typeof icons,
        tooltipText: 'Align justify',
        command: () => editor.chain().focus().setTextAlign('justify').run(),
      },
    ],
    [editor]
  );

  return (
    <Tooltip delay={250} closeDelay={0}>
      <Popover>
        <Button
          size="sm"
          data-active={isActive}
          variant="ghost"
          isIconOnly
          isDisabled={false}
          aria-label="More options"
          className="text-muted hover:text-foreground
            data-[active=true]:bg-default/45 data-[active=true]:text-accent
            data-[active=true]:hover:bg-default/45 data-[active=true]:hover:text-foreground"
        >
          <Icon name="EllipsisVertical" />
        </Button>

        <Popover.Content placement="bottom">
          <Popover.Dialog className="p-1.5">
            <div className="flex h-8 items-center gap-1.5">
              {scriptButtons.map(btn => (
                <EditorButton
                  key={btn.key}
                  editor={editor}
                  isIconOnly
                  withActive
                  buttonKey={btn.key}
                  tooltipText={btn.tooltipText}
                  icon={btn.icon}
                  onPressed={btn.command}
                />
              ))}

              <Separator orientation="vertical" className="h-6" />

              {alignButtons.map(btn => (
                <EditorButton
                  key={btn.key}
                  editor={editor}
                  isIconOnly
                  withActive
                  buttonKey={{ textAlign: btn.key }}
                  tooltipText={btn.tooltipText}
                  icon={btn.icon}
                  onPressed={btn.command}
                />
              ))}
            </div>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      <Tooltip.Content>
        <p>{'More tools'}</p>
      </Tooltip.Content>
    </Tooltip>

  );
};

export default React.memo(MoreOptionsButtonMenu);
