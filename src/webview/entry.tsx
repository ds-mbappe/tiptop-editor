import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ListKit } from '@tiptap/extension-list'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { Placeholder } from '@tiptap/extensions'
import { HorizontalRule } from '../extensions/HorizontalRule'
import { CodeBlock } from '../extensions/CodeBlock'
import './entry.css'

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(msg: string): void }
  }
}

const send = (msg: object) =>
  window.ReactNativeWebView?.postMessage(JSON.stringify(msg))

function App() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
        horizontalRule: false,
      }),
      ListKit,
      HorizontalRule,
      CodeBlock,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
      Subscript,
      Superscript,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    editorProps: {
      attributes: { spellcheck: 'true' },
    },
    onUpdate({ editor }) {
      send({
        type: 'CONTENT_CHANGE',
        json: editor.getJSON(),
        wordCount: editor.getText().trim().split(/\s+/).filter(Boolean).length,
      })
    },
    onSelectionUpdate({ editor }) {
      send({
        type: 'SELECTION_CHANGE',
        state: {
          bold: editor.isActive('bold'),
          italic: editor.isActive('italic'),
          strike: editor.isActive('strike'),
          code: editor.isActive('code'),
          h1: editor.isActive('heading', { level: 1 }),
          h2: editor.isActive('heading', { level: 2 }),
          h3: editor.isActive('heading', { level: 3 }),
          bulletList: editor.isActive('bulletList'),
          orderedList: editor.isActive('orderedList'),
          blockquote: editor.isActive('blockquote'),
          codeBlock: editor.isActive('codeBlock'),
        },
      })
    },
    onFocus: () => send({ type: 'FOCUS' }),
    onBlur: () => send({ type: 'BLUR' }),
  })

  useEffect(() => {
    if (!editor) return

    const handle = (e: MessageEvent) => {
      let msg: any
      try {
        msg = JSON.parse(typeof e.data === 'string' ? e.data : '')
      } catch (err) {
        send({ type: 'BRIDGE_ERROR', context: 'parse', message: String(err) })
        return
      }

      switch (msg.type) {
        case 'SET_CONTENT':
          // emitUpdate: false — loading content programmatically must not fire
          // onUpdate/CONTENT_CHANGE, which would otherwise trigger an unwanted
          // autosave of (possibly schema-reduced) content back over the original.
          try {
            editor.commands.setContent(msg.content ?? '', { emitUpdate: false })
          } catch (err) {
            send({ type: 'BRIDGE_ERROR', context: 'setContent', message: String(err) })
          }
          break
        case 'GET_CONTENT':
          send({ type: 'CONTENT_RESPONSE', json: editor.getJSON() })
          break
        case 'SET_EDITABLE':
          editor.setEditable(msg.editable)
          break
        case 'EXEC': {
          const c = editor.chain().focus()
          switch (msg.command) {
            case 'toggleBold':        c.toggleBold().run();               break
            case 'toggleItalic':      c.toggleItalic().run();             break
            case 'toggleStrike':      c.toggleStrike().run();             break
            case 'toggleCode':        c.toggleCode().run();               break
            case 'toggleH1':          c.toggleHeading({ level: 1 }).run(); break
            case 'toggleH2':          c.toggleHeading({ level: 2 }).run(); break
            case 'toggleH3':          c.toggleHeading({ level: 3 }).run(); break
            case 'toggleBulletList':  c.toggleBulletList().run();         break
            case 'toggleOrderedList': c.toggleOrderedList().run();        break
            case 'toggleBlockquote':  c.toggleBlockquote().run();         break
            case 'toggleCodeBlock':   c.toggleCodeBlock().run();          break
            case 'undo':              c.undo().run();                     break
            case 'redo':              c.redo().run();                     break
          }
          break
        }
      }
    }

    // window → iOS, document → Android
    window.addEventListener('message', handle)
    document.addEventListener('message', handle as any)

    send({ type: 'READY' })

    return () => {
      window.removeEventListener('message', handle)
      document.removeEventListener('message', handle as any)
    }
  }, [editor])

  return <EditorContent editor={editor} />
}

createRoot(document.getElementById('root')!).render(<App />)
