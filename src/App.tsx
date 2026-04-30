import { Button, Dropdown, Label, Separator, Toast } from "@heroui/react"
import { useState } from "react"
import { Pencil, Eye } from "lucide-react"
import TiptopEditor from "./components/editor/TiptopEditor"
import { CommentsProvider } from "./components/comment/CommentsContext"
import { useComments } from "./components/comment/useComments"
import { useTiptopEditor } from "./components/editor/TiptopEditorContext"

const testContent = `
  <h1>Comments feature test</h1>
  <p>Switch to <strong>View mode</strong> to start commenting. Select any text and a comment bubble will appear above your selection.</p>
  <p>To add a comment to an entire block, hover over a paragraph and open the drag handle (⋮) menu — you'll find an <strong>Add comment</strong> option.</p>
  <h2>Try these scenarios</h2>
  <p>Select a few words in this sentence and add an inline comment.</p>
  <p>This whole paragraph can have a block comment via the drag handle menu.</p>
  <p>After adding comments, click the yellow highlights to open the thread. You can reply, resolve, or delete from the sidebar.</p>
`

/** Node comment button placed in the drag handle dropdown slot. */
const NodeCommentButton = () => {
  const editor = useTiptopEditor()
  const comments = useComments()

  if (!editor || !comments) return null
  const { setPendingComment } = comments

  return (
    <Dropdown.Section>
      <Dropdown.Item
        id="add_node_comment"
        textValue="Add comment"
        onPress={() => {
          setPendingComment({
            id: crypto.randomUUID(),
            type: "node",
            nodePos: editor.state.selection.from,
          })
        }}
      >
        <Label>Add comment</Label>
      </Dropdown.Item>
    </Dropdown.Section>
  )
}

function App() {
  const [editable, setEditable] = useState(false)

  return (
    <div className="light" data-theme="light">
      <CommentsProvider>
        <div className="flex items-start min-h-screen">
          {/* Editor column */}
          <div className="flex-1 min-w-0">
            {/* Mode toggle bar */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-divider bg-background sticky top-0 z-10">
              <p className="text-sm text-foreground-400 mr-1">Mode:</p>
              <Button
                size="sm"
                variant={editable ? "primary" : "ghost"}
                onPress={() => setEditable(true)}
              >
                <Pencil size={14} />
                Edit
              </Button>
              <Button
                size="sm"
                variant={!editable ? "primary" : "ghost"}
                onPress={() => setEditable(false)}
              >
                <Eye size={14} />
                Review
              </Button>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <p className="text-xs text-foreground-400">
                {editable
                  ? "Edit mode — formatting tools active"
                  : "Review mode — select text to comment"}
              </p>
            </div>

            <TiptopEditor
              editorOptions={{
                content: testContent,
                editable,
                immediatelyRender: false,
                showCommentMenu: true,
              }}
              slots={{
                dragHandleDropdown: <NodeCommentButton />,
              }}
            />
          </div>

          {/* TODO: add your own comments drawer here using useComments() + useCommentActions() */}
        </div>
      </CommentsProvider>

      <Toast.Provider placement="top end" />
    </div>
  )
}

export default App
