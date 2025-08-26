import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ImageUploaderView from './ImageUploaderView'
import { generateUniqueId } from '../../helpers'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUploader: {
      insertImageUploader: () => ReturnType
    }
  }
}

export const ImageUploader = Node.create({
  name: 'imageUploader',

  group: 'block',
  
  defining: true,
  
  isolating: true,

  draggable: true,

  selectable: true,

  inline: false,

  addAttributes() {
    return {
      id: { default: undefined },
      src: { default: null },
      progress: { default: 0 },
      failed: { default: false },
      uploading: { default: true },
      selectMedia: { default: true },
      errorMessage: { default: null },
      // Dropped file metadata
      name: { default: undefined },
      size: { default: undefined },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-uploader"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'image-uploader',
        'data-uploading': String(HTMLAttributes.uploading),
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploaderView)
  },

  addCommands() {
    return {
      insertImageUploader:
        () =>
        ({ commands }) => {
          const id = generateUniqueId()
        
          return commands.insertContent({
            type: this.name,
            attrs: {
              id,
              uploading: false,
              selectMedia: true,
              src: null,
              failed: false,
              progress: 0,
              errorMessage: null,
            },
          })
        },
    }
  },
})