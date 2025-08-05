import type { Editor, Range } from "@tiptap/react"

export const colorSections = [
  {
    key: 'text',
    buttonType: 'text',
    title: 'Text color',
    colors: [
      { hsl: 'hsl()', color: '--heroui-foreground', bgColor: '--heroui-background', tooltipText: 'Default text' },
      { hsl: 'hsl(0, 0%, 61%)', color: '--text-color-gray', bgColor: '', tooltipText: 'Gray text' },
      { hsl: 'hsl(18, 35%, 58%)', color: '--text-color-brown', bgColor: '', tooltipText: 'Brown text' },
      { hsl: 'hsl(25, 53%, 53%)', color: '--text-color-orange', bgColor: '', tooltipText: 'Orange text' },
      { hsl: 'hsl(36, 54%, 55%)', color: '--text-color-yellow', bgColor: '', tooltipText: 'Yellow text' },
      { hsl: 'hsl(145, 32%, 47%)', color: '--text-color-green', bgColor: '', tooltipText: 'Green text' },
      { hsl: 'hsl(202, 64%, 52%)', color: '--text-color-blue', bgColor: '', tooltipText: 'Blue text' },
      { hsl: 'hsl(270, 55%, 62%)', color: '--text-color-purple', bgColor: '', tooltipText: 'Purple text' },
      { hsl: 'hsl(329, 57%, 58%)', color: '--text-color-pink', bgColor: '', tooltipText: 'Pink text' },
      { hsl: 'hsl(1, 69%, 60%)', color: '--text-color-red', bgColor: '', tooltipText: 'Red text' },
    ]
  },
  {
    key: 'highlight',
    buttonType: 'highlight',
    title: 'Highlight color',
    colors: [
      { hsl: 'hsl()', color: '--heroui-background', bgColor: '--heroui-background', tooltipText: 'Default background' },
      { hsl: 'hsl(0, 0%, 61%)', color: '--text-color-gray', bgColor: '--text-color-gray', tooltipText: 'Gray background' },
      { hsl: 'hsl(18, 35%, 58%)', color: '--text-color-brown', bgColor: '--text-color-brown', tooltipText: 'Brown background' },
      { hsl: 'hsl(25, 53%, 53%)', color: '--text-color-orange', bgColor: '--text-color-orange', tooltipText: 'Orange background' },
      { hsl: 'hsl(36, 54%, 55%)', color: '--text-color-yellow', bgColor: '--text-color-yellow', tooltipText: 'Yellow background' },
      { hsl: 'hsl(145, 32%, 47%)', color: '--text-color-green', bgColor: '--text-color-green', tooltipText: 'Green background' },
      { hsl: 'hsl(202, 64%, 52%)', color: '--text-color-blue', bgColor: '--text-color-blue', tooltipText: 'Blue background' },
      { hsl: 'hsl(270, 55%, 62%)', color: '--text-color-purple', bgColor: '--text-color-purple', tooltipText: 'Purple background' },
      { hsl: 'hsl(329, 57%, 58%)', color: '--text-color-pink', bgColor: '--text-color-pink', tooltipText: 'Pink background' },
      { hsl: 'hsl(1, 69%, 60%)', color: '--text-color-red', bgColor: '--text-color-red', tooltipText: 'Red background' },
    ]
  },
]

export const commandGroups = [
  {
    key: 'typography',
    title: 'Typography',
    commands: [
      {
        key: 'paragraph',
        title: 'Paragraph',
        icon: 'Type',
        description: '',
        command: ({ editor, range }: { editor: Editor, range: Range }) => {
          editor.chain().focus().deleteRange(range).setNode('paragraph').run()
        },
      },
      {
        key: 'heading1',
        title: 'Heading 1',
        icon: 'Heading1',
        description: '',
        command: ({ editor, range }: { editor: Editor, range: Range }) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
        },
      },
      {
        key: 'heading2',
        title: 'Heading 2',
        icon: 'Heading2',
        description: '',
        command: ({ editor, range }: { editor: Editor, range: Range }) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
        },
      },
      {
        key: 'heading3',
        title: 'Heading 3',
        icon: 'Heading3',
        description: '',
        command: ({ editor, range }: { editor: Editor, range: Range }) => {
          editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
        },
      },
    ]
  },
  {
    key: 'format',
    title: 'Format',
    commands: [
      {
        key: 'bulletList',
        title: 'Bulleted list',
        icon: 'List',
        description: '',
        command: ({ editor, range }: { editor: Editor, range: Range }) => {
          editor.chain().focus().deleteRange(range).toggleList('bulletList', 'listItem').run()
        },
      },
      {
        key: 'orderedList',
        title: 'Ordered list',
        icon: 'ListOrdered',
        description: '',
        command: ({ editor, range }: { editor: Editor, range: Range }) => {
          editor.chain().focus().deleteRange(range).toggleList('orderedList', 'listItem').run()
        },
      },
      {
        key: 'taskList',
        title: 'Todo list',
        icon: 'ListTodo',
        description: '',
        command: ({ editor, range }: { editor: Editor, range: Range }) => {
          editor.chain().focus().deleteRange(range).toggleList('taskList', 'taskItem').run()
        },
      },
      {
        key: 'blockquote',
        title: 'Blockquote',
        icon: 'Quote',
        description: '',
        command: ({ editor, range }: { editor: Editor, range: Range }) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run()
        },
      },
      {
        key: 'codeBlock',
        title: 'Code block',
        icon: 'SquareCode',
        description: '',
        command: ({ editor, range }: { editor: Editor, range: Range }) => {
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
        },
      },
    ]
  },
  {
    key: 'insert',
    title: 'Insert',
    commands: [
      {
        key: 'horizontalRule',
        title: 'Separator',
        icon: 'Minus',
        description: '',
        command: ({ editor, range }: { editor: Editor, range: Range }) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run()
        },
      },
    ]
  }
]