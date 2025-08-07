import { Editor, posToDOMRect } from "@tiptap/core"
import { ReactRenderer } from "@tiptap/react"
import { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion"
import { KeyDownRef } from "../../types"
import { computePosition } from "@floating-ui/dom"
import EmojiList from "./TiptopEmojiList"
import { EmojiItem } from "@tiptap/extension-emoji"

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement = {
    getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
  }

  computePosition(virtualElement, element, {
    placement: 'bottom-start',
  }).then(pos => {
    Object.assign(element.style, {
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      position: pos.strategy === 'fixed' ? 'fixed' : 'absolute',
    })
  })
}

export default {
  allowSpaces: false,

  items: ({ editor, query }: { editor: Editor, query: string }) => {
    return editor.storage.emoji.emojis
      .filter(({ name, tags }) => {
        return (
          name.toLocaleLowerCase().trim().startsWith(query.toLocaleLowerCase().trim()) ||
          // shortcodes.find(shortcode => shortcode.startsWith(query.toLowerCase())) ||
          tags.find(tag => tag.startsWith(query.toLowerCase()))
        )
      })
      .slice(0, 50)
  },

  render: () => {
    let reactRenderer: ReactRenderer<KeyDownRef, { items: EmojiItem[]; command: (item: EmojiItem) => void }>

    return {
      onStart: (props: SuggestionProps) => {
        if (!props.clientRect) {
          return
        }

        props.editor.commands.setMeta('lockDragHandle', true)

        reactRenderer = new ReactRenderer(EmojiList, {
          props,
          editor: props.editor,
        })

        document.body.appendChild(reactRenderer.element)

        updatePosition(props.editor, reactRenderer.element as HTMLElement)
      },

      onUpdate(props: SuggestionProps) {
        reactRenderer.updateProps(props)

        if (!props.clientRect) {
          return
        }

        updatePosition(props.editor, reactRenderer.element as HTMLElement)
      },

      onKeyDown(props: SuggestionKeyDownProps): boolean {
        if (props.event.key === 'Escape') {
          reactRenderer.destroy()
          reactRenderer.element.remove()

          reactRenderer.editor.commands.setMeta('lockDragHandle', false)

          return true
        }

        return reactRenderer.ref?.onKeyDown(props) || false
      },

      onExit() {
        reactRenderer.destroy()
        reactRenderer.element.remove()

        reactRenderer.editor.commands.setMeta('lockDragHandle', false)
      },
    }
  },
}