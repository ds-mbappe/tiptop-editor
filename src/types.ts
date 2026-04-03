import type { Extensions, JSONContent } from "@tiptap/core"
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
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "danger-soft",
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
  /** The slot before the actual editor content.*/
  editorTop?: TiptopEditorSlot
  /** The slot after the actual editor content.*/
  editorBottom?: TiptopEditorSlot
  /** The slot at the start of the selection Menu, right before the Bold button.*/
  selectionMenuPrepend?: TiptopEditorSlot
  /** The slot at the end of the selection Menu, right before the More options button.*/
  selectionMenuAppend?: TiptopEditorSlot
  /** The slot at the start of the table selection Menu.*/
  tableMenuPrepend?: TiptopEditorSlot
  /** The slot at the end of the table selection Menu.*/
  tableMenuAppend?: TiptopEditorSlot
  /** The slot after the first section in the Drag Handle Menu.
   * 
   * Must have a parent of type DropdownSection in order to be displayed.
  */
  dragHandleDropdown?: TiptopEditorSlot
}

export interface DocumentWord {
  /** 0-based index of this word within its block node */
  index: number
  /** Plain text of this word */
  text: string
  /** Absolute ProseMirror position of the word's first character */
  absFrom: number
  /** Absolute ProseMirror position after the word's last character */
  absTo: number
}

export interface DocumentNode {
  /** 0-based index of this block in the document */
  index: number
  /** ProseMirror node type name (e.g. "paragraph", "heading") */
  type: string
  /** Full plain-text content of this block */
  text: string
  /** Absolute ProseMirror position of the block's opening tag */
  absFrom: number
  /** Absolute ProseMirror position after the block's closing tag */
  absTo: number
  /** Words extracted from this block's text */
  words: DocumentWord[]
  /**
   * Maps each character index in `text` to its absolute ProseMirror position.
   * Use this when word-level precision is not enough.
   */
  charMap: number[]
}

export interface DocumentMap {
  nodes: DocumentNode[]
}

/**
 * Replacement content for a targeted update.
 * - `string`: plain text — marks from the replaced range are automatically preserved.
 * - `JSONContent[]`: rich inline content (text nodes with explicit marks, etc.).
 */
export type TargetedUpdateReplacement = string | JSONContent[]

export interface TargetedUpdate {
  /** 0-based index of the target block in the document */
  nodeIndex?: number
  /** 0-based word index within the target block */
  wordIndex?: number
  /** Inclusive `[startWordIndex, endWordIndex]` word range within the target block */
  wordRange?: [number, number]
  /**
   * 0-based character offset from the start of the block's text content.
   * Must be paired with `charTo`.
   */
  charFrom?: number
  /**
   * 0-based exclusive character offset from the start of the block's text content.
   * Must be paired with `charFrom`.
   */
  charTo?: number
  /** Content to replace the targeted range with */
  replacement: TargetedUpdateReplacement
}

export interface TiptopEditorHandle {
  getEditor: () => Editor | null
  on: Editor['on']
  off: Editor['off']
  once: Editor['once']
  /**
   * Returns a structured map of all top-level block nodes in the document with
   * their text content, word boundaries, and absolute ProseMirror positions.
   * Pass this to your AI model so it can reference specific locations.
   * Returns `null` if the editor is not yet mounted.
   */
  getDocumentMap: () => DocumentMap | null
  /**
   * Applies a single targeted content update, preserving marks on plain-text
   * replacements. Returns `true` on success.
   */
  applyTargetedUpdate: (update: TargetedUpdate) => boolean
  /**
   * Applies multiple targeted updates in one atomic ProseMirror transaction,
   * processing from the bottom of the document upward so earlier replacements
   * never shift the positions of later ones. Returns `true` on success.
   */
  applyTargetedUpdates: (updates: TargetedUpdate[]) => boolean
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
