import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInTable, setIsInTable] = useState(() => editor.isActive('table'));
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const isHoveringRef = useRef(false);

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
    if (isHoveringRef.current) return true;
    return editor.isEditable && isTextSelected(editor) && hasTextNodeInSelection(editor) && !isForbiddenNodeSelected(editor);
  }, [editor]);

  const handleShow = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
    setTimeout(() => setIsAnimating(true), 10);
  }, []);

  const handleHide = useCallback(() => {
    if (isHoveringRef.current) return;
    setIsAnimating(false);
    timeoutRef.current = setTimeout(() => setIsVisible(false), 200);
  }, []);

  useEffect(() => {
    const update = () => setIsInTable(editor.isActive('table'));

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return (
    <BubbleMenu
      editor={editor}
      updateDelay={200}
      options={{ offset: 3, onShow: handleShow, onHide: handleHide }}
      shouldShow={shouldShow}
    >
      <div
        onMouseEnter={() => { isHoveringRef.current = true; }}
        onMouseLeave={() => { isHoveringRef.current = false; }}
        className={
          `bubble-menu transition-all duration-200 ease-in-out
          ${isVisible && isAnimating ? 'opacity-100' : 'opacity-0'}`
        }
      >
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
