import type { Editor, EditorContentProps, Range, UseEditorOptions } from "@tiptap/react"
import type { icons } from "lucide-react"

export interface EditorButtonProps {
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

export interface SlashCommandGroupCommandsProps {
  key: string,
  title: string,
  icon: string,
  description?: string,
  command: ({ editor, range }: { editor: Editor, range: Range }) => void
}

export interface SlashCommandGroupProps {
  key: string,
  title: string,
  commands: SlashCommandGroupCommandsProps[]
}

export type TiptopEditorProps = Omit<EditorContentProps, 'editor'> & {
  editorOptions?: Omit<Partial<UseEditorOptions>, 'extensions'>
}

export interface ColorButtonProps {
  editor: Editor;
  buttonType: string | 'text' | 'highlight';
  hsl: string;
  color: string;
  bgColor: string;
  tooltipText?: string;
  tooltipDisabled?: boolean;
}

export interface TextSelectionMenuProps {
  editor: Editor;
  prepend?: React.ReactNode;
  append?: React.ReactNode;
}

export interface KeyDownRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}
