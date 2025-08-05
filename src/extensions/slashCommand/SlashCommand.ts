import { Editor, Extension, type Range } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'

export default Extension.create({
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