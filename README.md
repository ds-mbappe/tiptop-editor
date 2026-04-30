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

## Setup

This package requires HeroUI v3. Add its styles import to your CSS entry file:

```css
@import "tailwindcss";
@import "@heroui/styles";
```

No `HeroUIProvider` wrapper is needed in your app — HeroUI v3 works without a root provider.

If you use the toast notifications, render `Toast.Provider` once near the root of your app:

```tsx
import { Toast } from '@heroui/react'

export function App() {
  return (
    <>
      <YourApp />
      <Toast.Provider placement="top end" />
    </>
  )
}
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
- `dragHandleDropdown`

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

The `dragHandleDropdown` slot injects additional items into the block drag-handle dropdown. The slot content must be wrapped in a `<Dropdown.Section>`:

```tsx
import { Dropdown, Label } from '@heroui/react'

<TiptopEditor
  slots={{
    dragHandleDropdown: ({ editor }) => (
      <Dropdown.Section>
        <Dropdown.Item id="ai_rewrite" textValue="AI Rewrite" onPress={() => console.log('AI rewrite', editor)}>
          <Label>AI Rewrite</Label>
        </Dropdown.Item>
      </Dropdown.Section>
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
- `imgUploadUrl`
  The URL of the server endpoint that receives image uploads.
- `imgUploadResponseKey`
  Locates the image URL in the server response. Accepts a top-level key, a dot-separated path, a path array, or a resolver function.
- `imgUploadHeaders`
  Custom HTTP headers sent with every image upload request (e.g. `Authorization`).

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

### Sending custom headers

Use `imgUploadHeaders` to attach custom HTTP headers to every upload request. This is the standard way to pass an authorization token or any other API header.

```tsx
<TiptopEditor
  editorOptions={{
    imgUploadUrl: '/api/upload',
    imgUploadResponseKey: 'url',
    imgUploadHeaders: {
      Authorization: 'Bearer YOUR_TOKEN',
    },
  }}
/>
```

Multiple headers are supported:

```tsx
imgUploadHeaders: {
  Authorization: 'Bearer YOUR_TOKEN',
  'X-Api-Key': 'YOUR_API_KEY',
}
```

> **Note**: The editor sends `multipart/form-data`. Do **not** include a `Content-Type` header in `imgUploadHeaders` — the browser sets it automatically with the correct boundary string.

Your server response must include the uploaded image URL at the location you describe with `imgUploadResponseKey`.

Example:

```json
{
  "data": {
    "url": "https://cdn.example.com/uploads/image-123.jpg"
  }
}
```

## Comments

The package ships a full inline and block comment system designed for **review / view mode**. Comments are stored entirely in the calling app — the package exposes hooks and callbacks so you can persist and sync with your own API.

### Comment types

| Type | What it annotates | How it looks |
|------|------------------|--------------|
| `inline` | A selected text range | Yellow underline highlight on the text |
| `node` | An entire block (paragraph, heading, …) | Left amber border on the block |

### Quick setup

Wrap the editor in `CommentsProvider`, pass `showCommentMenu: true` and `editable: false` to put the editor into view mode, then render your own comment drawer next to it.

```tsx
import { TiptopEditor, CommentsProvider, useComments, useCommentActions } from 'tiptop-editor'
import { Dropdown, Label } from '@heroui/react'
import { MessageSquarePlus } from 'lucide-react'
import { useTiptopEditor } from 'tiptop-editor'

// Optional: lets users add block-level comments from the drag-handle menu
function NodeCommentButton() {
  const editor = useTiptopEditor()
  const comments = useComments()

  if (!editor || !comments) return null

  return (
    <Dropdown.Section>
      <Dropdown.Item
        id="add_node_comment"
        textValue="Add comment"
        onPress={() => {
          comments.setPendingComment({
            id: crypto.randomUUID(),
            type: 'node',
            nodePos: editor.state.selection.from,
          })
        }}
      >
        <MessageSquarePlus size={16} />
        <Label>Add comment</Label>
      </Dropdown.Item>
    </Dropdown.Section>
  )
}

export function ReviewPage() {
  return (
    <CommentsProvider>
      <div style={{ display: 'flex' }}>
        <TiptopEditor
          editorOptions={{
            content: '<p>Document content…</p>',
            immediatelyRender: false,
            editable: false,
            showCommentMenu: true,
          }}
          slots={{
            dragHandleDropdown: <NodeCommentButton />,
          }}
        />
        {/* Your own drawer component here — see "Building a custom comment drawer" below */}
      </div>
    </CommentsProvider>
  )
}
```

> `showCommentMenu: true` registers the `CommentMark` and `NodeCommentExtension` Tiptap extensions and renders the floating "Add comment" button that appears on text selection.

### Persisting comments with your API

`CommentsProvider` accepts an `onCommentsChange` callback that fires whenever the comment list changes. Use it to sync with your backend.

```tsx
import { useState } from 'react'
import { CommentsProvider, TiptopEditor } from 'tiptop-editor'
import type { TiptopComment } from 'tiptop-editor'

export function ReviewPage() {
  const [initialComments] = useState<TiptopComment[]>([
    // Comments loaded from your API on mount
  ])

  const handleCommentsChange = async (comments: TiptopComment[]) => {
    await fetch('/api/documents/123/comments', {
      method: 'PUT',
      body: JSON.stringify(comments),
    })
  }

  return (
    <CommentsProvider
      initialComments={initialComments}
      onCommentsChange={handleCommentsChange}
    >
      <div style={{ display: 'flex' }}>
        <TiptopEditor
          editorOptions={{
            content: '<p>…</p>',
            editable: false,
            showCommentMenu: true,
            immediatelyRender: false,
          }}
        />
        {/* Your own drawer here */}
      </div>
    </CommentsProvider>
  )
}
```

`onCommentsChange` receives the full updated array after every add, resolve, reply, or delete. It fires synchronously after the state update — debounce or batch API calls on your side as needed.

### Loading existing comments

Pass your persisted comments as `initialComments` to `CommentsProvider`. The comment marks in the editor HTML already carry a `data-comment-id` attribute, so the sidebar threads reconnect automatically as long as the IDs match.

> The editor content (HTML string with mark attributes) and the comments array are two separate things to persist. Store both and restore both — the HTML goes into `editorOptions.content`, the comments go into `initialComments`.

### Reading comment state programmatically

Use `useComments()` anywhere inside `CommentsProvider` to read or mutate the comment state directly.

```tsx
import { useComments } from 'tiptop-editor'

function CommentCount() {
  const comments = useComments()
  if (!comments) return null

  const open = comments.comments.filter(c => !c.resolved).length
  return <span>{open} open comment{open !== 1 ? 's' : ''}</span>
}
```

Available values and actions from `useComments()`:

| Name | Type | Description |
|------|------|-------------|
| `comments` | `TiptopComment[]` | All comments (open and resolved) |
| `activeCommentId` | `string \| null` | ID of the currently focused comment |
| `pendingComment` | `PendingComment \| null` | Comment being drafted (not yet submitted) |
| `addComment` | `(id, type, content, author?) => void` | Finalize a pending comment |
| `removeComment` | `(id) => void` | Delete a comment from the context (use `useCommentActions().remove` to also strip the editor mark) |
| `resolveComment` | `(id) => void` | Mark as resolved in the context (use `useCommentActions().resolve` to also strip the editor mark) |
| `replyToComment` | `(commentId, content, author?) => void` | Append a reply |
| `setActiveCommentId` | `(id \| null) => void` | Highlight a comment thread |
| `setPendingComment` | `(PendingComment \| null) => void` | Open the new-comment form |
| `getComment` | `(id) => TiptopComment \| undefined` | Look up a single comment |

### Building a custom comment drawer

The package does not ship a styled sidebar — you build your own. The only non-obvious part is that resolving or deleting a comment requires two coordinated steps: removing the mark from the editor **and** updating the context. The `useCommentActions` hook handles both so you don't have to.

```tsx
import {
  TiptopEditor,
  CommentsProvider,
  useComments,
  useCommentActions,
} from 'tiptop-editor'

function MyCommentDrawer() {
  const ctx = useComments()
  const { submit, resolve, remove } = useCommentActions()

  if (!ctx) return null
  const { comments, pendingComment, activeCommentId, setActiveCommentId } = ctx

  return (
    <aside>
      {/* New comment form — shown when the user clicks "Add comment" */}
      {pendingComment && (
        <form onSubmit={e => {
          e.preventDefault()
          const text = new FormData(e.currentTarget).get('comment') as string
          submit(pendingComment, text)
        }}>
          <textarea name="comment" placeholder="Add a comment…" autoFocus />
          <button type="submit">Save</button>
          <button type="button" onClick={() => ctx.setPendingComment(null)}>Cancel</button>
        </form>
      )}

      {/* Comment threads */}
      {comments.map(comment => (
        <div
          key={comment.id}
          data-active={activeCommentId === comment.id || undefined}
          onClick={() => setActiveCommentId(comment.id)}
        >
          <p>{comment.content}</p>
          <button onClick={e => { e.stopPropagation(); resolve(comment.id) }}>Resolve</button>
          <button onClick={e => { e.stopPropagation(); remove(comment.id) }}>Delete</button>
        </div>
      ))}
    </aside>
  )
}

export function ReviewPage() {
  return (
    <CommentsProvider onCommentsChange={comments => saveToApi(comments)}>
      <div style={{ display: 'flex' }}>
        <TiptopEditor editorOptions={{ editable: false, showCommentMenu: true, immediatelyRender: false }} />
        <MyCommentDrawer />
      </div>
    </CommentsProvider>
  )
}
```

`useCommentActions` provides three methods:

| Method | Description |
|--------|-------------|
| `submit(pending, content, author?)` | Applies the pending comment to the editor (adds the mark/attribute) and registers it in the context |
| `resolve(commentId)` | Removes the mark/attribute from the editor and marks the comment as resolved |
| `remove(commentId)` | Removes the mark/attribute from the editor and deletes the comment from the context |

## Notes

- If you use SSR, keep `immediatelyRender: false`.
- The package manages the built-in editor extensions internally. Use `editorOptions.extraExtensions` to append your own feature extensions.

## Feedback

Issues and pull requests are welcome.
