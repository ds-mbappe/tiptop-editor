import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Popover, Button } from '@heroui/react';
import type { Editor } from '@tiptap/react';
import Icon from '../ui/Icon';
import { icons } from 'lucide-react';
import { commandGroups } from '../../constants';

interface TransformIntoButtonMenuProps {
  editor: Editor;
}

const TransformIntoButtonMenu = ({ editor }: TransformIntoButtonMenuProps) => {
  const [menuOpened, setMenuOpened] = useState(false);

  const getActiveNodeName = useCallback(
    () => editor.state.selection.$head.parent.type.name,
    [editor]
  );
  const [activeNodeName, setActiveNodeName] = useState(getActiveNodeName);

  useEffect(() => {
    const update = () => setActiveNodeName(getActiveNodeName());
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor, getActiveNodeName]);

  const transformOptions = useMemo(
    () => commandGroups.flatMap(group => group.commands),
    []
  );

  const handleTransform = useCallback(
    (command: (args: { editor: Editor; range: { from: number; to: number } }) => void) => {
      const { from, to } = editor.state.selection;
      command({ editor, range: { from, to } });
      setMenuOpened(false);
    },
    [editor]
  );

  return (
    <Popover isOpen={menuOpened} onOpenChange={setMenuOpened}>
      <Button
        size="sm"
        variant="ghost"
        isIconOnly={false}
        isDisabled={false}
        aria-label="Transform into menu"
        className="w-full text-muted hover:text-foreground px-2.5"
      >
        <p className="w-full capitalize text-sm">{activeNodeName}</p>
      </Button>

      <Popover.Content placement="bottom">
        <Popover.Dialog className="px-1.5 py-2">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold leading-normal capitalize text-foreground px-2">
              {'Turn into'}
            </p>

            <div className="flex flex-col gap-0.5">
              {transformOptions.map(node => (
                <Button
                  key={node.key}
                  size="sm"
                  variant="ghost"
                  isIconOnly={false}
                  isDisabled={false}
                  data-active={false}
                  className="text-muted hover:text-foreground
                    data-[active=true]:font-medium data-[active=true]:bg-default/45
                    data-[active=true]:text-accent data-[active=true]:hover:bg-default/45
                    data-[active=true]:hover:text-foreground"
                  onPress={() => handleTransform(node.command)}
                >
                  <div className="w-full h-full flex items-center gap-1">
                    <Icon name={node.icon as keyof typeof icons} />
                    <p className="text-sm font-normal leading-normal capitalize">
                      {node.title}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
};

export default React.memo(TransformIntoButtonMenu);
