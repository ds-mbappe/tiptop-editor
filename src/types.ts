import type { Editor, EditorContentProps, EditorOptions, Range } from "@tiptap/react"
import type { icons } from "lucide-react"

export type EditorButtonProps = {
  tooltipText?: React.ReactNode,
  isIconOnly?: boolean,
  isDisabled?: boolean,
  withActive?: boolean,
  buttonKey: string | object,
  text?: string,
  editor: Editor,
  iconClass?: string,
  icon?: keyof typeof icons,
  variant?: "flat" | "shadow" | "solid" | "bordered" | "light" | "faded" | "ghost",
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger",
  onPressed?: () => void,
}

export type SlashCommandGroupCommandsProps = {
  key: string,
  title: string,
  icon: string,
  description?: string,
  command: ({ editor, range }: { editor: Editor, range: Range }) => void
}

export type SlashCommandGroupProps = {
  key: string,
  title: string,
  commands: SlashCommandGroupCommandsProps[]
}

export type TiptopEditorProps = Omit<EditorContentProps, 'editor'> & {
  editorOptions?: Partial<EditorOptions>
}
