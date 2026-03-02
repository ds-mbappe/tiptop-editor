import { createContext, useContext } from 'react'
import type { Editor } from '@tiptap/react'

export const TiptopEditorContext = createContext<Editor | null>(null)

export const useTiptopEditor = () => useContext(TiptopEditorContext)
