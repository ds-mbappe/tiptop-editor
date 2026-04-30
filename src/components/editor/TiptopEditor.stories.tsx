import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Dropdown, Label } from '@heroui/react'
import { MessageSquarePlus } from 'lucide-react'
import TiptopEditor from './TiptopEditor'
import { useTiptopEditor } from './TiptopEditorContext'
import { CommentsProvider } from '../comment/CommentsContext'
import { useComments } from '../comment/useComments'

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

// ─── WithComments story ───────────────────────────────────────────────────────

const commentsContent = `
  <h1>Document with Comments</h1>
  <p>Select any text and click the <strong>comment icon</strong> in the floating toolbar to add an inline comment.</p>
  <p>To add a block-level comment, hover over a paragraph and open the drag handle menu — you'll find an <strong>Add comment</strong> option there.</p>
  <p>Click a highlighted comment in the editor to jump to its thread in the sidebar.</p>
  <h2>How comments work</h2>
  <p>Inline comments wrap a text range with a yellow highlight mark. Block comments add a left border to the entire paragraph. Both kinds appear in the sidebar on the right.</p>
  <p>From the sidebar you can reply, resolve (removes the highlight), or delete a comment entirely.</p>
`

/**
 * A Dropdown.Section placed inside the drag handle dropdown.
 * When pressed it snapshots the current NodeSelection (set by the
 * drag handle when the menu opens) and opens the sidebar form.
 */
const NodeCommentButton = () => {
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

export const WithComments: Story = {
  args: {
    editorOptions: {
      content: commentsContent,
      immediatelyRender: false,
      editable: false,
      showCommentMenu: true,
    },
  },
  render: args => (
    <CommentsProvider>
      <div className="flex items-start gap-0">
        <TiptopEditor
          {...args}
          className="flex-1 min-w-0"
          slots={{
            dragHandleDropdown: <NodeCommentButton />,
          }}
        />
      </div>
    </CommentsProvider>
  ),
}
