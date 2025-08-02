import { Card } from '@heroui/react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const TiptopEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello Tiptop!</p>',
  })

  return (
    <Card className="p-4">
      <EditorContent editor={editor} />
    </Card>
  )
}

export default TiptopEditor