import { Extensions } from '@tiptap/core'
import { Placeholder } from '@tiptap/extensions'
import { ListKit } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import Highlight from '@tiptap/extension-highlight'
import StarterKit from '@tiptap/starter-kit'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { CodeBlock } from '../../extensions/CodeBlock'
import TiptopEmoji from '../../extensions/emoji/TiptopEmoji'
import { ImageUploader } from '../../extensions/image/ImageUploader'
import ImageUploaderExtension from '../../extensions/image/ImageUploaderExtension'
import HorizontalRule from '../../extensions/HorizontalRule'
import SlashCommand from '../../extensions/slashCommand/SlashCommand'
import SlashCommandSuggestion from '../../extensions/slashCommand/SlashCommandSuggestion'
import { ImageUploadResponseResolver } from '../../types'

interface CreateDefaultExtensionsOptions {
  imgUploadUrl?: string
  imgUploadResponseKey?: ImageUploadResponseResolver
}

export const createDefaultExtensions = ({
  imgUploadUrl,
  imgUploadResponseKey,
}: CreateDefaultExtensionsOptions): Extensions => [
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
]
