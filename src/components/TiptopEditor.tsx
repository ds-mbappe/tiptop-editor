import {
  useEditor,
  useEditorState,
  type EditorOptions,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Card } from '@heroui/react'
import { EditorContent, type EditorContentProps } from '@tiptap/react'
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react'
import TextSelectionMenu from './TextSelectionMenu'
import TiptopDragHandle from './TiptopDragHandle'
import SlashCommand from '../extensions/slashCommand/SlashCommand'
import SlashCommandSuggestion from '../extensions/slashCommand/SlashCommandSuggestion'
import { Placeholder } from '@tiptap/extensions'
import { ListKit } from '@tiptap/extension-list'
import { CodeBlock } from '../extensions/CodeBlock'
import HorizontalRule from '../extensions/HorizontalRule'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'

import '../../node_modules/prosemirror-view/style/prosemirror.css'
import { TiptopEditorProps } from '../types'

export interface TiptopEditorHandle {
  getEditor: () => ReturnType<typeof useEditorState> | null
}

const TiptopEditor = forwardRef<TiptopEditorHandle, TiptopEditorProps>(
  ({ editorOptions = {}, ...rest }, ref) => {
    // Serialized key for all options to force recreation
    const optionsKey = useMemo(() => 
      JSON.stringify({ ...editorOptions }), 
      [editorOptions]
    )

    const editor = useEditor({
      content: '<p>This is just a content</p>',
      extensions: [
        StarterKit.configure({
          bulletList: false,
          orderedList: false,
          listItem: false,
          listKeymap: false,
          codeBlock: false,
          heading: {
            levels: [1, 2, 3]
          },
          horizontalRule: false,
        }),
        ListKit,
        Placeholder.configure({
          placeholder: "Write something, or type '/' for commands.",
        }),
        HorizontalRule,
        CodeBlock,
        TextStyle,
        Color,
        Highlight.configure({
          multicolor: true,
        }),
        TextAlign.configure({
          types: ['paragraph', 'heading']
        }),
        Subscript,
        Superscript,
        SlashCommand.configure({
          suggestion: SlashCommandSuggestion
        }),
      ],
      ...editorOptions,
    }, [optionsKey]) // We pass optionsKey as dependency array to useEditor

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
    }), [editor])

    return (
      <Card className="w-full overflow-visible">
        {editor &&
          <>
            <TiptopDragHandle editor={editor} />
            <TextSelectionMenu editor={editor} />
          </>
        }
        <EditorContent {...rest} editor={editor} />
      </Card>
    )
  }
)

TiptopEditor.displayName = 'TiptapEditor'

export default TiptopEditor
