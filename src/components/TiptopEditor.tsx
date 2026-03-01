import {
  useEditor,
  useEditorState,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Card, cn } from '@heroui/react'
import { EditorContent } from '@tiptap/react'
import {
  Fragment,
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
import { TableKit } from '@tiptap/extension-table'
import { CodeBlock } from '../extensions/CodeBlock'
import HorizontalRule from '../extensions/HorizontalRule'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'

import '../../node_modules/prosemirror-view/style/prosemirror.css'
import { TiptopEditorProps } from '../types'
import TiptopEmoji from '../extensions/emoji/TiptopEmoji'
import { ImageUploader } from '../extensions/image/ImageUploader'
import ImageUploaderExtension from '../extensions/image/ImageUploaderExtension'
import TableSelectionMenu from './TableSelectionMenu'

export interface TiptopEditorHandle {
  getEditor: () => ReturnType<typeof useEditorState> | null
}

const TiptopEditor = forwardRef<TiptopEditorHandle, TiptopEditorProps>(
  ({ editorOptions = {}, className, ...rest }, ref) => {
    const {
      imgUploadUrl,
      imgUploadResponseKey,
      disableDefaultContainer = false,
      showDragHandle = true,
      ...tiptapEditorOptions
    } = editorOptions

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
          link: {
            openOnClick: false,
            defaultProtocol: 'https'
          },
          dropcursor: {
            width: 1.5,
            color: 'hsl(var(--heroui-primary))',
          }
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
        TiptopEmoji,
        TableKit.configure({
          table: {
            resizable: true,
          },
        }),
        ImageUploader,
        ImageUploaderExtension.configure({
          imgUploadUrl,
          imgUploadResponseKey,
        }),
        SlashCommand.configure({
          suggestion: SlashCommandSuggestion
        }),
      ],
      ...tiptapEditorOptions,
    }, [optionsKey]) // We pass optionsKey as dependency array to useEditor

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
    }), [editor])

    const Wrapper = disableDefaultContainer ? Fragment : Card
    const wrapperProps = disableDefaultContainer
      ? {}
      : { className: 'w-full overflow-visible' }

    return (
      <Wrapper {...wrapperProps}>
        {editor &&
          <>
            {showDragHandle ? <TiptopDragHandle editor={editor} /> : null}
            <TextSelectionMenu editor={editor} />
            <TableSelectionMenu editor={editor} />
          </>
        }
        <EditorContent
          {...rest}
          className={cn(className, disableDefaultContainer ? 'tiptop-editor-no-padding' : null)}
          editor={editor}
        />
      </Wrapper>
    )
  }
)

TiptopEditor.displayName = 'TiptapEditor'

export default TiptopEditor
