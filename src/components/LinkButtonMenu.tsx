import React, { useCallback, useEffect, useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent, Button, Tooltip, Divider } from '@heroui/react';
import { Editor } from '@tiptap/react';
import Icon from './Icon';
import EditorButton from './EditorButton';
import { addOrUpdateLink, unsetLink } from '../helpers';

interface LinkButtonMenuProps {
  editor: Editor;
}

const LinkButtonMenu = ({ editor }: LinkButtonMenuProps) => {
  const [menuOpened, setMenuOpened] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [isActive, setIsActive] = useState(false);

  const getCurrentLink = useCallback(() => {
    return editor.getAttributes('link')?.href || '';
  }, [editor]);

  useEffect(() => {
    const updateState = () => {
      const href = getCurrentLink();
      setLinkValue(href);
      setIsActive(editor.isActive('link', { href }));
    };

    editor.on('selectionUpdate', updateState);
    editor.on('transaction', updateState);

    return () => {
      editor.off('selectionUpdate', updateState);
      editor.off('transaction', updateState);
    };
  }, [editor, getCurrentLink]);

  const addLink = useCallback(() => {
    if (!linkValue) return;
    addOrUpdateLink(editor, linkValue);
    // ensure active state updates post-link
    setIsActive(true);
  }, [editor, linkValue]);

  const openInNewTab = useCallback(() => {
    if (linkValue) {
      window.open(linkValue, '_blank', 'noopener,noreferrer,nofollow');
    }
  }, [linkValue]);

  const removeLink = useCallback(() => {
    unsetLink(editor);
    setLinkValue('');
    setIsActive(false);
    setMenuOpened(false);
  }, [editor]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && linkValue) {
        e.preventDefault();
        addLink();
      }
    },
    [addLink, linkValue]
  );

  return (
    <Popover
      placement="bottom"
      isOpen={menuOpened}
      onOpenChange={setMenuOpened}
    >
      <PopoverTrigger>
        <Button
          size="sm"
          data-active={isActive}
          color="default"
          variant="light"
          isIconOnly
          isDisabled={false}
          aria-label="Link menu"
          className="text-foreground-500 hover:text-foreground data-[active=true]:bg-divider/45 data-[active=true]:text-primary data-[active=true]:hover:bg-divider/45 data-[active=true]:hover:text-foreground"
          onPress={() => setMenuOpened(open => !open)}
        >
          <Tooltip content="Link" delay={250} closeDelay={0}>
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="Link" />
            </div>
          </Tooltip>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-1.5">
        <div className="flex items-center gap-1">
          <div className="relative flex flex-wrap items-stretch">
            <input
              className="block w-full h-8 text-sm font-normal leading-1.5 px-2 py-1.5 bg-none appearance-none outline-none"
              placeholder="Enter a link..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              autoFocus
              type="url"
              value={linkValue}
              onChange={e => setLinkValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <EditorButton
            isIconOnly
            isDisabled={!linkValue}
            editor={editor}
            buttonKey="validate"
            tooltipText="Set link"
            icon="CornerDownLeft"
            withActive={false}
            onPressed={addLink}
          />

          <Divider orientation="vertical" className="h-6" />

          <div className="flex items-center gap-1.5">
            <EditorButton
              isIconOnly
              isDisabled={!linkValue}
              editor={editor}
              buttonKey="open_in_new_tab"
              tooltipText="Open link"
              icon="ExternalLink"
              withActive={false}
              onPressed={openInNewTab}
            />

            <EditorButton
              isIconOnly
              isDisabled={!linkValue}
              color="danger"
              buttonKey="remove_link"
              iconClass="text-danger"
              editor={editor}
              tooltipText="Remove link"
              icon="Trash"
              withActive={false}
              onPressed={removeLink}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default React.memo(LinkButtonMenu);