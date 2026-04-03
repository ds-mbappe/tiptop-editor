import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Dropdown, Label } from '@heroui/react'
import TiptopEditor from './TiptopEditor'
import { useTiptopEditor } from './TiptopEditorContext'

const defaultContent = `
  <h1>Tiptop Editor</h1>
  <p>Use this story to verify slash commands, tables, emoji, and image blocks.</p>
  <p>Type <code>/</code> for commands, <code>:</code> for emoji, or insert a table to test the table controls.</p>
  <table>
    <tbody>
      <tr>
        <th>Feature</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>Tables</td>
        <td>Ready</td>
      </tr>
      <tr>
        <td>Emoji</td>
        <td>Ready</td>
      </tr>
    </tbody>
  </table>
`

const meta = {
  title: 'Components/TiptopEditor',
  component: TiptopEditor,
  tags: ['autodocs'],
  args: {
    editorOptions: {
      content: defaultContent,
      immediatelyRender: false,
    },
  },
} satisfies Meta<typeof TiptopEditor>

export default meta

type Story = StoryObj<typeof meta>

const AiToolbar = () => {
  const editor = useTiptopEditor()

  if (!editor) {
    return null
  }

  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl border border-divider bg-background/80 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">AI controls</p>
        <p className="text-xs text-foreground-500">Example custom UI using the editor context hook.</p>
      </div>

      <Button
        size="sm"
        variant="primary"
        onPress={() => {
          editor.chain().focus().insertContent('<p>AI inserted this paragraph.</p>').run()
        }}
      >
        Insert Draft
      </Button>
    </div>
  )
}

const AiRewriteButton = () => {
  const editor = useTiptopEditor()

  if (!editor) {
    return null
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onPress={() => {
        const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ')

        if (!text) {
          return
        }

        editor.chain().focus().insertContent(` ${text.toUpperCase()}`).run()
      }}
    >
      AI Rewrite
    </Button>
  )
}

export const Default: Story = {}

export const Frameless: Story = {
  args: {
    editorOptions: {
      content: defaultContent,
      immediatelyRender: false,
      disableDefaultContainer: true,
      showDragHandle: false,
    },
  },
  render: (args) => (
    <div className="rounded-[28px] border border-divider bg-background px-8 py-8 shadow-sm">
      <TiptopEditor {...args} />
    </div>
  ),
}

export const WithSlots: Story = {
  args: {
    editorOptions: {
      content: defaultContent,
      immediatelyRender: false,
    },
    slots: {
      editorTop: <AiToolbar />,
      selectionMenuAppend: <AiRewriteButton />,
    },
  },
}

export const ViewMode: Story = {
  args: {
    editorOptions: {
      content: defaultContent,
      immediatelyRender: false,
      editable: false,
    },
  },
}

export const WithDragHandleSlot: Story = {
  args: {
    editorOptions: {
      content: defaultContent,
      immediatelyRender: false,
    },
    slots: {
      dragHandleDropdown: ({ editor }) => (
        <Dropdown.Section>
          <Dropdown.Item
            id="ai_rewrite"
            textValue="AI Rewrite"
            onPress={() => {
              const { from, to } = editor.state.selection
              const text = editor.state.doc.textBetween(from, to, ' ')
              if (text) {
                editor.chain().focus().insertContent(` ${text.toUpperCase()}`).run()
              }
            }}
          >
            <Label>AI Rewrite (demo)</Label>
          </Dropdown.Item>
        </Dropdown.Section>
      ),
    },
  },
}
