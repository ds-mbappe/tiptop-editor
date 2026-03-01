import { Editor, Extension, type Range } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import type {
  SlashCommandGroupCommandsProps,
  SlashCommandGroupProps,
} from '../../types'

export type SlashCommandSuggestionOptions = Omit<
  SuggestionOptions<SlashCommandGroupProps, SlashCommandGroupCommandsProps>,
  'editor'
>

export default Extension.create<{ suggestion: SlashCommandSuggestionOptions }>({
  name: 'slash-commands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: {
          editor: Editor,
          range: Range,
          props: {
            command: (opts: { editor: Editor; range: Range }) => void;
          }
        }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        decorationClass: 'tiptop-slash-highlight'
      }),
    ]
  },
})
