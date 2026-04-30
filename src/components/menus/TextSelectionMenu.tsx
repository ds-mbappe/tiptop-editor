import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Separator } from '@heroui/react';
import EditorButton from '../ui/EditorButton';
import LinkButtonMenu from './LinkButtonMenu';
import ColorButtonMenu from './ColorButtonMenu';
import MoreOptionsButtonMenu from './MoreOptionsButtonMenu';
import TableButtonMenu from './TableButtonMenu';
import { icons } from 'lucide-react';
import { hasTextNodeInSelection, isForbiddenNodeSelected, isTextSelected } from '../../helpers';
import { TextSelectionMenuProps } from '../../types';

const TextSelectionMenu = ({ editor, prepend, append }: TextSelectionMenuProps) => {
  const [isInTable, setIsInTable] = useState(() => editor.isActive('table'));

  const formattingButtons = useMemo(
    () => [
      { icon: 'Bold',          buttonKey: 'bold',      tooltipText: 'Bold',          command: () => editor.chain().focus().toggleMark('bold').run() },
      { icon: 'Italic',        buttonKey: 'italic',    tooltipText: 'Italic',        command: () => editor.chain().focus().toggleMark('italic').run() },
      { icon: 'Underline',     buttonKey: 'underline', tooltipText: 'Underline',     command: () => editor.chain().focus().toggleMark('underline').run() },
      { icon: 'Strikethrough', buttonKey: 'strike',    tooltipText: 'Strikethrough', command: () => editor.chain().focus().toggleMark('strike').run() },
      { icon: 'CodeXml',       buttonKey: 'code',      tooltipText: 'Code',          command: () => editor.chain().focus().toggleMark('code').run() },
    ],
    [editor]
  );

  const shouldShow = useCallback(() => {
    return editor.isEditable && isTextSelected(editor) && hasTextNodeInSelection(editor) && !isForbiddenNodeSelected(editor);
  }, [editor]);

  useEffect(() => {
    const update = () => setIsInTable(editor.isActive('table'));
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  return (
    <BubbleMenu editor={editor} updateDelay={200} shouldShow={shouldShow} options={{
      offset: {
        alignmentAxis: 10
      },
    }}>
      <div className='bubble-menu'>
        {prepend && (
          <div className='flex items-center gap-1'>
            {prepend}
            <Separator orientation='vertical' className='h-6' />
          </div>
        )}

        {formattingButtons.map(btn => (
          <div key={btn.buttonKey} className='flex items-center gap-0.5'>
            <EditorButton
              isIconOnly
              withActive
              editor={editor}
              buttonKey={btn.buttonKey}
              tooltipText={btn.tooltipText}
              icon={btn.icon as keyof typeof icons}
              onPressed={btn.command}
            />
          </div>
        ))}

        <Separator orientation='vertical' className='h-6' />

        <LinkButtonMenu editor={editor} />

        <ColorButtonMenu editor={editor} />

        <Separator orientation='vertical' className='h-6' />

        {isInTable && (
          <>
            <TableButtonMenu editor={editor} />
            <Separator orientation='vertical' className='h-6' />
          </>
        )}

        {append && (
          <div className='flex items-center gap-1'>
            {append}
            <Separator orientation='vertical' className='h-6' />
          </div>
        )}

        <MoreOptionsButtonMenu editor={editor} />
      </div>
    </BubbleMenu>
  );
};

export default React.memo(TextSelectionMenu);
