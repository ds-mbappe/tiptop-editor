import type { Preview } from '@storybook/react-vite'
import { HeroUIProvider, ToastProvider } from '@heroui/react'
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
      <HeroUIProvider>
        <div className="min-h-screen bg-default-50 py-10 pr-6 pl-20 md:pr-10 md:pl-24">
          <div className="mx-auto max-w-6xl">
            <Story />
          </div>
        </div>
        <ToastProvider placement="top-right" />
      </HeroUIProvider>
    ),
  ],
}

export default preview
