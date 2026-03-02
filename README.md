# Tiptop Editor

A Notion-like rich text editor built with [Tiptap v3](https://tiptap.dev/), [HeroUI](https://www.heroui.com/), and Tailwind CSS, packaged as a plug-and-play React component.

Inspired by Tiptap's Notion-like editor template:
https://tiptap.dev/docs/ui-components/templates/notion-like-editor

![npm version](https://img.shields.io/npm/v/tiptop-editor.svg)
![bundle size](https://img.shields.io/bundlephobia/minzip/tiptop-editor)
![license](https://img.shields.io/npm/l/tiptop-editor)

## Features

- Tiptap v3 editor with a ready-to-use Notion-like UI
- Slash commands for inserting blocks
- Table support with row, column, header, split, and merge actions
- Emoji suggestions triggered with `:`
- Built-in image uploader block
- Text formatting, lists, code blocks, highlights, alignment, subscript, and superscript
- TypeScript support

## Installation

```bash
npm install tiptop-editor
```

## Basic Usage

```tsx
import { TiptopEditor } from 'tiptop-editor'
import 'tiptop-editor/dist/tiptop-editor.css'

export function Editor() {
  return (
    <TiptopEditor
      editorOptions={{
        content: '<p>I am the Tiptop Editor</p>',
        immediatelyRender: false,
      }}
    />
  )
}
```

`editorOptions` accepts the same options as `useEditor` from `@tiptap/react`, except `extensions`, which is managed internally by the package. To add your own extensions, use `editorOptions.extraExtensions`.

## Editor Ref and Events

You can access the editor instance and bind Tiptap runtime event listeners through the component ref.

```tsx
import { useEffect, useRef } from 'react'
import { TiptopEditor, type TiptopEditorHandle } from 'tiptop-editor'

export function EditorWithEvents() {
  const editorRef = useRef<TiptopEditorHandle>(null)

  useEffect(() => {
    const handleUpdate = ({ editor }: { editor: NonNullable<ReturnType<TiptopEditorHandle['getEditor']>> }) => {
      console.log(editor.getHTML())
    }

    editorRef.current?.on('update', handleUpdate)

    return () => {
      editorRef.current?.off('update', handleUpdate)
    }
  }, [])

  return <TiptopEditor ref={editorRef} />
}
```

Available ref methods:

- `getEditor()`
- `on(event, callback)`
- `off(event, callback?)`
- `once(event, callback)`

## Extending the Editor

The package now supports two extension points:

- `editorOptions.extraExtensions`
  Appends custom Tiptap extensions after the built-in set.
- `slots`
  Lets you inject custom React UI around the editor and inside the selection menus.

### Add custom Tiptap extensions

```tsx
import { Extension } from '@tiptap/core'
import { TiptopEditor } from 'tiptop-editor'

const MyExtension = Extension.create({
  name: 'myExtension',
})

export function EditorWithExtraExtensions() {
  return (
    <TiptopEditor
      editorOptions={{
        immediatelyRender: false,
        extraExtensions: [MyExtension],
      }}
    />
  )
}
```

`extraExtensions` is additive only. If you pass an extension with the same name as one of the built-in extensions, the editor will warn in the console and show a toast because duplicate extension names can lead to unstable behavior.

### Add custom UI with slots

Supported slots:

- `editorTop`
- `editorBottom`
- `selectionMenuPrepend`
- `selectionMenuAppend`
- `tableMenuPrepend`
- `tableMenuAppend`

Each slot accepts either:

- a React node
- a render function receiving `{ editor }`

```tsx
<TiptopEditor
  slots={{
    editorTop: ({ editor }) => (
      <button onClick={() => editor.chain().focus().insertContent('<p>Draft</p>').run()}>
        Insert draft
      </button>
    ),
  }}
/>
```

### Use the editor context hook

For slotted components, you can consume the current editor instance through `useTiptopEditor()` instead of passing `editor` down manually.

```tsx
import { TiptopEditor, useTiptopEditor } from 'tiptop-editor'

function AiToolbar() {
  const editor = useTiptopEditor()

  if (!editor) {
    return null
  }

  return (
    <button onClick={() => editor.chain().focus().insertContent('<p>AI draft</p>').run()}>
      Insert draft
    </button>
  )
}

export function EditorWithSlots() {
  return (
    <TiptopEditor
      slots={{
        editorTop: <AiToolbar />,
      }}
    />
  )
}
```

## Custom Editor UI Options

`TiptopEditor` also supports a few package-specific options inside `editorOptions`:

```tsx
<TiptopEditor
  editorOptions={{
    content: '<p>Custom layout</p>',
    disableDefaultContainer: true,
    showDragHandle: false,
  }}
/>
```

- `disableDefaultContainer`
  Disables the default HeroUI `Card` wrapper and removes the editor's built-in padding. Use this when you want the editor to live inside your own container/layout.
- `showDragHandle`
  Controls whether the block drag handle is rendered. Default: `true`.
- `extraExtensions`
  Appends custom Tiptap extensions after the built-in editor set.

## Built-in Extensions

The package ships with these extensions enabled out of the box:

- `StarterKit`
- `ListKit`
- `Placeholder`
- custom slash command menu
- custom code block
- custom horizontal rule
- `TextStyle` and `Color`
- `Highlight`
- `TextAlign`
- `Subscript`
- `Superscript`
- emoji suggestions
- `TableKit`
- image uploader block and upload handler

### Tables

Type `/table` to insert a table.

Inside a table you can:

- add or remove rows
- add or remove columns
- toggle header row or header column
- split a merged cell
- merge adjacent selected cells

To merge cells, drag across adjacent cells first, then use the table controls.

### Emoji

Type `:` followed by an emoji name to open emoji suggestions.

## Image Extension

The image feature is built around an `imageUploader` block.

### How to insert an image block

- Type `/image`
- or use the slash menu and select `Image`

Once inserted, the block lets the user click to upload or drag and drop an image.

### Supported files

- `image/png`
- `image/jpeg`
- `image/jpg`
- max size: `5MB`

### Demo mode with no backend

If you do not provide upload options, the editor simulates an upload and displays the image using a local object URL. This is useful for local demos and prototypes.

```tsx
<TiptopEditor
  editorOptions={{
    content: '<p>Upload demo</p>',
  }}
/>
```

### Real upload mode

To upload files to your backend, set both `imgUploadUrl` and `imgUploadResponseKey`.

```tsx
<TiptopEditor
  editorOptions={{
    content: '<p>Upload to my API</p>',
    imgUploadUrl: '/api/upload',
    imgUploadResponseKey: 'url',
  }}
/>
```

The editor sends a `POST` request with `multipart/form-data` and the file under the `file` field.

`imgUploadResponseKey` is flexible. It supports:

- a top-level key like `'url'`
  Example:
  ```tsx
  <TiptopEditor
    editorOptions={{
      imgUploadUrl: '/api/upload',
      imgUploadResponseKey: 'url',
    }}
  />
  ```
- a nested path like `'data.url'`
  Example:
  ```tsx
  <TiptopEditor
    editorOptions={{
      imgUploadUrl: '/api/upload',
      imgUploadResponseKey: 'data.url',
    }}
  />
  ```
- a path array like `['data', 'url']`
  Example:
  ```tsx
  <TiptopEditor
    editorOptions={{
      imgUploadUrl: '/api/upload',
      imgUploadResponseKey: ['data', 'url'],
    }}
  />
  ```
- a resolver function
  Example:
  ```tsx
  <TiptopEditor
    editorOptions={{
      imgUploadUrl: '/api/upload',
      imgUploadResponseKey: (response) => {
        const asset = response.asset as { cdnUrl?: string } | undefined
        return asset?.cdnUrl
      },
    }}
  />
  ```

Your server response must include the uploaded image URL at the location you describe with `imgUploadResponseKey`.

Example:

```json
{
  "data": {
    "url": "https://cdn.example.com/uploads/image-123.jpg"
  }
}
```

## Notes

- If you use SSR, keep `immediatelyRender: false`.
- The package manages the built-in editor extensions internally. Use `editorOptions.extraExtensions` to append your own feature extensions.

## Feedback

Issues and pull requests are welcome.
