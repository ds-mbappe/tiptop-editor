import { computePosition, flip, shift, size } from '@floating-ui/dom'
import { Editor, posToDOMRect, ReactRenderer } from '@tiptap/react'
import { PluginKey } from '@tiptap/pm/state'

import SlashCommandList from './SlashCommandList'
import { commandGroups } from '../../constants'
import type { KeyDownRef, SlashCommandGroupCommandsProps, SlashCommandGroupProps } from '../../types'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import type { SlashCommandSuggestionOptions } from './SlashCommand'

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement = {
    getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
  }

  computePosition(virtualElement, element, {
    placement: 'bottom-start',
    middleware: [
      flip(),
      shift(),
      size({
        apply({ availableHeight, elements }) {
          elements.floating.style.setProperty('--slash-available-height', `${Math.max(availableHeight - 8, 0)}px`)
        },
      }),
    ],
  }).then(pos => {
    Object.assign(element.style, {
      width: 'max-content',
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      position: pos.strategy === 'fixed' ? 'fixed' : 'absolute',
      zIndex: '9999',
    })
  })
}

const SlashCommandSuggestion: SlashCommandSuggestionOptions = {
  pluginKey: new PluginKey('slashCommand'),

  items: ({ query }: { query: string }) => {
    const groupsWithFilteredCommands = commandGroups.map(group => ({
      ...group,
      commands: group.commands
        .filter(item => {
          const labelNormalized = item.title.toLocaleLowerCase().trim()
          const queryNormalized = query.toLocaleLowerCase().trim()

          return labelNormalized.startsWith(queryNormalized)
        })
    }));

    const withoutEmptyGroups = groupsWithFilteredCommands.filter(group => {
      if (group.commands.length > 0) {
        return true
      }

      return false
    })

    return withoutEmptyGroups;
  },

  render: () => {
    let reactRenderer: ReactRenderer<KeyDownRef, { items: SlashCommandGroupProps[]; command: (item: SlashCommandGroupCommandsProps) => void }>

    return {
      onStart: (props: SuggestionProps) => {
        if (!props.clientRect) {
          return
        }

        props.editor.commands.setMeta('lockDragHandle', true)

        reactRenderer = new ReactRenderer(SlashCommandList, {
          props,
          editor: props.editor,
        });

        const el = reactRenderer.element as HTMLElement;
        el.style.position = 'fixed';
        // Mark as a React Aria top-layer overlay so modals don't dismiss
        // when the user clicks inside this menu.
        el.setAttribute('data-react-aria-top-layer', 'true');

        document.body.appendChild(el)

        updatePosition(props.editor, reactRenderer.element as HTMLElement);
      },

      onUpdate(props: SuggestionProps) {
        if (!reactRenderer) return

        reactRenderer.updateProps(props)

        if (!props.clientRect) {
          return
        }

        updatePosition(props.editor, reactRenderer.element as HTMLElement);
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (!reactRenderer) return false

        if (props.event.key === 'Escape') {
          reactRenderer.destroy()
          reactRenderer.element.remove()
          reactRenderer.editor.commands.setMeta('lockDragHandle', false)
          return true
        }

        // If React hasn't finished the initial render yet (ref not set),
        // still intercept navigation keys so ProseMirror doesn't move the cursor
        // and exit the suggestion before the list becomes interactive.
        if (!reactRenderer.ref) {
          return ['ArrowUp', 'ArrowDown', 'Enter'].includes(props.event.key)
        }

        return reactRenderer.ref.onKeyDown(props)
      },

      onExit() {
        if (!reactRenderer) return

        reactRenderer.destroy()
        reactRenderer.element.remove()
        reactRenderer.editor.commands.setMeta('lockDragHandle', false)
      },
    }
  },
}

export default SlashCommandSuggestion
