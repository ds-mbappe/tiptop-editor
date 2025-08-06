import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Divider } from '@heroui/react';
import EditorButton from './EditorButton';
import LinkButtonMenu from './LinkButtonMenu';
import ColorButtonMenu from './ColorButtonMenu';
import MoreOptionsButtonMenu from './MoreOptionsButtonMenu';
import { icons } from 'lucide-react';
import { hasTextNodeInSelection, isForbiddenNodeSelected, isTextSelected } from '../helpers';
import { TextSelectionMenuProps } from '../types';

const TextSelectionMenu = ({ editor, prepend, append }: TextSelectionMenuProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

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
    return isTextSelected(editor) && hasTextNodeInSelection(editor) && !isForbiddenNodeSelected(editor);
  }, [editor]);

  const handleShow = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
    setTimeout(() => setIsAnimating(true), 10);
  }, []);

  const handleHide = useCallback(() => {
    setIsAnimating(false);
    timeoutRef.current = setTimeout(() => setIsVisible(false), 200);
  }, []);

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
        className={
          `bubble-menu transition-all duration-200 ease-in-out
          ${isVisible && isAnimating ? 'opacity-100' : 'opacity-0'}`
        }
      >
        {prepend && (
          <div className='flex items-center gap-1'>
            {prepend}
            <Divider orientation='vertical' className='h-6' />
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

        <Divider orientation='vertical' className='h-6' />

        <LinkButtonMenu editor={editor} />
        
        <ColorButtonMenu editor={editor} />

        <Divider orientation='vertical' className='h-6' />

        {append && (
          <div className='flex items-center gap-1'>
            {append}
            <Divider orientation='vertical' className='h-6' />
          </div>
        )}

        <MoreOptionsButtonMenu editor={editor} />
      </div>
    </BubbleMenu>
  );
};

export default React.memo(TextSelectionMenu);
