import type { Extensions } from "@tiptap/core"
import type { Editor, EditorContentProps, Range, UseEditorOptions } from "@tiptap/react"
import type { icons } from "lucide-react"

export type ImageUploadResponseResolver =
  | string
  | string[]
  | ((response: Record<string, unknown>) => string | null | undefined)

export type TiptopEditorOptions = Omit<Partial<UseEditorOptions & {
  /**
 * The url of the server where the file should be uploaded.
 * If not specified, the imageUploader will "fake" an upload for
 * some seconds and create a local Url with the image file.
 * @default undefined
 */
  imgUploadUrl?: string
  /**
 * The key that holds the value of the image url from your server's response.
 * Supports nested paths like `data.url`, path arrays like `['data', 'url']`,
 * or a custom resolver function.
 * @default undefined
 */
  imgUploadResponseKey?: ImageUploadResponseResolver
  /**
 * Disables the default Card wrapper and removes the editor's built-in padding.
 * Use this when you want to embed the editor inside your own layout container.
 * @default false
 */
  disableDefaultContainer?: boolean
  /**
 * Controls whether the drag handle is rendered.
 * @default true
 */
  showDragHandle?: boolean
  /**
 * Additional Tiptap extensions to append after the built-in editor set.
 * Use this to add feature-specific extensions like AI commands or collaboration.
 * @default undefined
 */
  extraExtensions?: Extensions
}>, 'extensions'>

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
  /**
 * The exact same options of the `useEditor` hook,
 * plus some other options specific to the Tiptop ccomponent
 * implementation.
 */
  editorOptions?: TiptopEditorOptions
  slots?: TiptopEditorSlots
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

export interface TiptopEditorSlotProps {
  editor: Editor
}

export type TiptopEditorSlot =
  | React.ReactNode
  | ((props: TiptopEditorSlotProps) => React.ReactNode)

export interface TiptopEditorSlots {
  editorTop?: TiptopEditorSlot
  editorBottom?: TiptopEditorSlot
  selectionMenuPrepend?: TiptopEditorSlot
  selectionMenuAppend?: TiptopEditorSlot
  tableMenuPrepend?: TiptopEditorSlot
  tableMenuAppend?: TiptopEditorSlot
}

export interface TiptopEditorHandle {
  getEditor: () => Editor | null
  on: Editor['on']
  off: Editor['off']
  once: Editor['once']
}

export interface KeyDownRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export interface ImageUploaderExtensionOptions {
  /**
   * The url of the server where the file should be uploaded.
   * If not specified, the imageUploader will "fake" an upload for
   * some seconds and create a local Url with the image file.
   * @default undefined
   */
  imgUploadUrl?: string
  /**
   * The key that holds the value of the image url from your server's response.
   * Supports nested paths like `data.url`, path arrays like `['data', 'url']`,
   * or a custom resolver function.
   * @default undefined
   */
  imgUploadResponseKey?: ImageUploadResponseResolver
  allowedMimeTypes?: string[]
  maxFileSize: number
}

export interface ImageUploaderExtensionStorage {
  uploadImageFromFile: (editor: Editor, file: File, id: string, updateExisting?: boolean, pos?: number) => void
}
