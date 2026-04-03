import type { Preview } from '@storybook/react-vite'
import { Toast } from '@heroui/react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
    },
  },
  decorators: [
    (Story) => (
      <>
        <div className="min-h-screen bg-surface py-10 pr-6 pl-20 md:pr-10 md:pl-24">
          <div className="mx-auto max-w-6xl">
            <Story />
          </div>
        </div>
        <Toast.Provider placement="top end" />
      </>
    ),
  ],
}

export default preview
