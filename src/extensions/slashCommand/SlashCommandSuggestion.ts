import { computePosition, flip, shift } from '@floating-ui/dom'
import { Editor, posToDOMRect, ReactRenderer } from '@tiptap/react'
import { PluginKey } from '@tiptap/pm/state'

import SlashCommandList, { type SlashCommandListRef } from './SlashCommandList'
import { commandGroups } from '../../constants'
import type { SlashCommandGroupCommandsProps, SlashCommandGroupProps } from '../../types'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement = {
    getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
  }

  computePosition(virtualElement, element, {
    placement: 'bottom-start',
    strategy: 'absolute',
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.width = 'max-content'
    element.style.position = strategy
    element.style.left = `${x}px`
    element.style.top = `${y}px`
  })
}

export default {
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
    let reactRenderer: ReactRenderer<SlashCommandListRef, { items: SlashCommandGroupProps[]; command: (item: SlashCommandGroupCommandsProps) => void }>

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

        (reactRenderer.element as HTMLElement).style.position = 'absolute';

        document.body.appendChild(reactRenderer.element)

        updatePosition(props.editor, reactRenderer.element as HTMLElement);
      },

      onUpdate(props: SuggestionProps) {
        reactRenderer.updateProps(props)

        if (!props.clientRect) {
          return
        }

        updatePosition(props.editor, reactRenderer.element as HTMLElement);
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === 'Escape') {
          reactRenderer.destroy()
          reactRenderer.element.remove()

          reactRenderer.editor.commands.setMeta('lockDragHandle', false)

          return true
        }

        return reactRenderer.ref?.onKeyDown(props)
      },

      onExit() {
        reactRenderer.destroy()
        reactRenderer.element.remove()

        reactRenderer.editor.commands.setMeta('lockDragHandle', false)
      },
    }
  },
}