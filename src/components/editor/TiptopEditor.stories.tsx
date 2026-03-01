import type { Meta, StoryObj } from '@storybook/react-vite'
import TiptopEditor from './TiptopEditor'

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
