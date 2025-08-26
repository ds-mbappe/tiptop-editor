import { Editor, Extension } from '@tiptap/core'
import FileHandler from '@tiptap/extension-file-handler'
import { showToast, updateNodeByPos, uploadWithProgress } from '../../helpers'
import { ImageUploaderExtensionOptions, ImageUploaderExtensionStorage } from '../../types'

declare module '@tiptap/core' {
  interface Storage {
    imageUploaderExtension: {
      uploadImageFromFile: (editor: Editor, file: File, id: string, updateExisting?: boolean, pos?: number) => void
      cancelUpload: (editor: Editor, id: string, pos?: number) => void
    }
  }
}

export const ImageUploaderExtension = Extension.create<ImageUploaderExtensionOptions, ImageUploaderExtensionStorage>({
  name: 'imageUploaderExtension',

  addOptions() {
    return {
      imgUploadUrl: undefined,
      imgUploadResponseKey: undefined,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
      maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
    }
  },

  addExtensions() {
    return [
      FileHandler.configure({
        allowedMimeTypes: this.options.allowedMimeTypes,
        // Comment this for now, because there are a lot of edge cases
        // that I have not yet accounted for
        onDrop: (editor, files, pos) => {
          // if (!files?.length) return false
          // const file = files[0]
          // const found = getUploaderAtPos(editor.state, pos)
          // if (found) {
          //   const id = (found.node.attrs as Record<string, string | boolean | number>).id as string
          //   this.storage.uploadImageFromFile(editor, file, id, true, found.pos)
          //   return true
          // }
          // const id = generateUniqueId()
          // this.storage.uploadImageFromFile(editor, file, id, false /* pos omitted for new node */)
          // return true
        },
        onPaste: (editor, files) => {
          // Only handle paste operations that contain files
          // if (!files || files.length === 0) return false
          
          // // Create new nodes for paste operations
          // const file = files[0]
          // const id = generateUniqueId()
          // this.storage.uploadImageFromFile(editor, file, id, false)

          // return true
        },
      }),
    ]
  },

  addStorage() {
    const uploadCancelTokens = new Map<string, { cancelled: boolean; cleanup?: () => void }>()

    return {
      uploadImageFromFile: (editor: Editor, file: File, id: string, updateExisting?: boolean, pos?: number) => {
        const { imgUploadUrl, imgUploadResponseKey, allowedMimeTypes, maxFileSize } = this.options

        if (!file) return

        let errorMessage = null

        if (!allowedMimeTypes?.includes(file.type)) {
          errorMessage = `Unsupported file type: ${file.type}`
        } else if (file.size >= maxFileSize) {
          const maxSizeMB = Math.round(maxFileSize / (1024 * 1024))
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
          errorMessage = `File too large: ${fileSizeMB}MB. Maximum size is ${maxSizeMB}MB.`
        }
        
        if (errorMessage) {
          if (!updateExisting) {
            showToast('Error', 'danger', errorMessage)
            return
          }

          setNodeState(
            editor,
            id,
            updateExisting,
            {
              failed: true,
              uploading: false,
              selectMedia: true,
              errorMessage,
            },
            pos
          )
          return
        }

        const hasToken = () => uploadCancelTokens.has(id)

        setNodeState(
          editor,
          id,
          updateExisting,
          {
            src: null,
            progress: 0,
            failed: false,
            uploading: true,
            selectMedia: false,
            errorMessage: null,
            // Dropped file metadata
            name: file.name,
            size: file.size
          },
          pos
        )

        const updateNode = (attrs: Record<string, string | boolean | number>) => {
          if (!hasToken()) return
          updateNodeByPos(editor, { id, pos }, attrs)
        }

        const handleSuccess = (url: string) => {
          if (!hasToken()) return
          updateNode({ uploading: false, failed: false, src: url, progress: 100 })
          uploadCancelTokens.delete(id)
        }

        const handleError = (message = 'Upload failed') => {
          if (!hasToken()) return
          updateNode({ uploading: false, failed: true, errorMessage: message, progress: 0 })
          uploadCancelTokens.delete(id)
        }

        const handleCancel = () => {
          updateNodeByPos(
            editor,
            { id, pos },
            { uploading: false, failed: true, errorMessage: 'Upload cancelled', progress: 0 }
          )
          uploadCancelTokens.delete(id)
        }

        const handleProgress = (percent: number, file?: File): boolean => {
          const token = uploadCancelTokens.get(id)
          if (!token || token.cancelled) return false
          updateNode({ progress: percent })
          return true
        }

        ;(async () => {
          try {
            if (!imgUploadUrl) {
              const localUrl = URL.createObjectURL(file)
              const startTime = Date.now()
              const increment = 1 // Change this to control increment size
              const updateIntervalMs = 200 // How often to update (200ms = 5 updates per second)
              const totalDuration = (100 / increment) * updateIntervalMs // Calculate total time

              let timeoutId: ReturnType<typeof setTimeout>
              
              const updateProgress = () => {
                const token = uploadCancelTokens.get(id)
                if (token?.cancelled) {
                  handleCancel()
                  URL.revokeObjectURL(localUrl)
                  return
                }

                const elapsed = Date.now() - startTime
                const expectedProgress = Math.min((elapsed / totalDuration) * 100, 100)
                const roundedProgress = Math.floor(expectedProgress / increment) * increment

                const shouldContinue = handleProgress(Math.min(roundedProgress, 100), file)
                if (!shouldContinue) return
                                
                if (expectedProgress >= 100) {
                  handleSuccess(localUrl)
                } else {
                  timeoutId = setTimeout(updateProgress, updateIntervalMs)
                }
              }
              
              // Store cleanup function
              uploadCancelTokens.set(id, { 
                cancelled: false, 
                cleanup: () => {
                  clearTimeout(timeoutId)
                  URL.revokeObjectURL(localUrl)
                }
              })
              
              timeoutId = setTimeout(updateProgress, updateIntervalMs)

              return
            }

            // Real upload with AbortController
            const abortController = new AbortController()
            
            // Store cleanup function for real uploads
            uploadCancelTokens.set(id, { 
              cancelled: false, 
              cleanup: () => {
                abortController.abort()
              }
            })

            const response = await uploadWithProgress({
              file,
              url: imgUploadUrl,
              onProgress: handleProgress,
              signal: abortController.signal,
            })

            // Check if cancelled after upload completes
            const token = uploadCancelTokens.get(id)
            if (token?.cancelled) {
              handleCancel()
              return
            }

            if (!imgUploadResponseKey) throw new Error('You need to specify a key for the upload response, using the parameter *imgUploadResponseKey* of editorOptions !')

            const uploadedUrl = response?.[imgUploadResponseKey as keyof typeof response]

            if (!uploadedUrl) throw new Error('No URL returned from server')

            handleSuccess(uploadedUrl)
          } catch (error: unknown) {
            // Check if error was due to cancellation
            if (error instanceof Error) {
              if (error.name === 'AbortError') {
                handleCancel()
              } else {
                handleError(error.message)
              }
            }
          }
        })()
      },

      cancelUpload: (editor: Editor, id: string, pos?: number) => {
        const token = uploadCancelTokens.get(id)

        // mark cancelled first so progress handler returns false
        if (token) {
          token.cancelled = true
          token.cleanup?.()
          uploadCancelTokens.delete(id)
        }

        // reset node UI
        updateNodeByPos(
          editor,
          { id, pos },
          {
            src: null,
            progress: 0,
            failed: false,
            uploading: false,
            selectMedia: true,
            errorMessage: null,
          }
        )
      }
    }
  },
})

const setNodeState = (editor: Editor, id: string, updateExisting: boolean | undefined, attrs: Record<string, string | boolean | number | null>, pos?: number) => {
  if (updateExisting) {
    updateNodeByPos(
      editor,
      { id, pos },
      attrs
    )
  } else {
    editor.commands.insertContent({
      type: 'imageUploader',
      attrs: { id, ...attrs },
    })
  }
}

export default ImageUploaderExtension