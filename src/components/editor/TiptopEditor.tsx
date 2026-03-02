import { Card, cn } from '@heroui/react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Fragment, forwardRef, useImperativeHandle, useMemo } from 'react'
import TextSelectionMenu from '../menus/TextSelectionMenu'
import { TiptopEditorHandle, TiptopEditorProps } from '../../types'
import TableSelectionMenu from './TableSelectionMenu'
import TiptopDragHandle from './TiptopDragHandle'
import { TiptopEditorContext } from './TiptopEditorContext'
import { createDefaultExtensions } from './createDefaultExtensions'
import { renderTiptopSlot } from './renderTiptopSlot'
import { useDuplicateExtensionWarnings } from './useDuplicateExtensionWarnings'

import 'prosemirror-view/style/prosemirror.css'

const serializeEditorOptions = (value: unknown) => JSON.stringify(value, (_key, currentValue) => {
  if (typeof currentValue === 'function') {
    return '[function]'
  }

  return currentValue
})

const TiptopEditor = forwardRef<TiptopEditorHandle, TiptopEditorProps>(
  ({ editorOptions = {}, slots = {}, className, ...rest }, ref) => {
    const {
      imgUploadUrl,
      imgUploadResponseKey,
      disableDefaultContainer = false,
      showDragHandle = true,
      extraExtensions = [],
      ...tiptapEditorOptions
    } = editorOptions

    const builtInExtensions = useMemo(
      () => createDefaultExtensions({ imgUploadUrl, imgUploadResponseKey }),
      [imgUploadResponseKey, imgUploadUrl]
    )

    const extensions = useMemo(() => [
      ...builtInExtensions,
      ...extraExtensions,
    ], [builtInExtensions, extraExtensions])

    useDuplicateExtensionWarnings(builtInExtensions, extraExtensions)

    const optionsKey = useMemo(() => serializeEditorOptions(tiptapEditorOptions), [tiptapEditorOptions])
    const extraExtensionsKey = useMemo(() => serializeEditorOptions(
      extraExtensions.map(extension => ({
        name: extension.name,
        options: 'options' in extension ? extension.options : undefined,
      }))
    ), [extraExtensions])

    const editorDependencies = useMemo(() => [
      optionsKey,
      extraExtensionsKey,
      imgUploadUrl,
      imgUploadResponseKey,
    ], [
      extraExtensionsKey,
      imgUploadResponseKey,
      imgUploadUrl,
      optionsKey,
    ])

    const editor = useEditor({
      content: '<p>This is just a content</p>',
      extensions,
      ...tiptapEditorOptions,
    }, editorDependencies)

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
      on: ((...args) => {
        editor?.on(...args)
        return editor as NonNullable<typeof editor>
      }) as TiptopEditorHandle['on'],
      off: ((...args) => {
        editor?.off(...args)
        return editor as NonNullable<typeof editor>
      }) as TiptopEditorHandle['off'],
      once: ((...args) => {
        editor?.once(...args)
        return editor as NonNullable<typeof editor>
      }) as TiptopEditorHandle['once'],
    }), [editor])

    const Wrapper = disableDefaultContainer ? Fragment : Card
    const wrapperProps = disableDefaultContainer
      ? {}
      : { className: 'w-full overflow-visible' }

    return (
      <TiptopEditorContext.Provider value={editor}>
        <Wrapper {...wrapperProps}>
          {renderTiptopSlot(slots.editorTop, editor)}
          {editor &&
            <>
              {showDragHandle ? <TiptopDragHandle editor={editor} /> : null}
              <TextSelectionMenu
                editor={editor}
                prepend={renderTiptopSlot(slots.selectionMenuPrepend, editor)}
                append={renderTiptopSlot(slots.selectionMenuAppend, editor)}
              />
              <TableSelectionMenu
                editor={editor}
                prepend={renderTiptopSlot(slots.tableMenuPrepend, editor)}
                append={renderTiptopSlot(slots.tableMenuAppend, editor)}
              />
            </>
          }
          <EditorContent
            {...rest}
            className={cn(className, disableDefaultContainer ? 'tiptop-editor-no-padding' : null)}
            editor={editor}
          />
          {renderTiptopSlot(slots.editorBottom, editor)}
        </Wrapper>
      </TiptopEditorContext.Provider>
    )
  }
)

TiptopEditor.displayName = 'TiptapEditor'

export default TiptopEditor
