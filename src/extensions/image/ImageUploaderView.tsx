import { NodeViewProps } from '@tiptap/core'
import { NodeViewWrapper } from '@tiptap/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../../components/ui/Icon'
import { Button, cn } from '@heroui/react'
import { showToast } from '../../helpers'

const ImageUploaderView = (props: NodeViewProps) => {
  const dragCounter = useRef<number>(0);
  const selectedFile = useRef<File>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const { editor, node } = props
  const { uploading, src, failed, progress, selectMedia, id, errorMessage, name, size } = node.attrs

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent file selection if already uploading
    if (uploading) return;

    const file = e.target.files?.[0]

    if (file && id) {
      selectedFile.current = file
      const pos = typeof props.getPos === 'function' ? props.getPos() : undefined
      // Use the existing node's ID and update it in place
      editor?.storage.imageUploaderExtension.uploadImageFromFile(editor, file, id, true, pos)
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Prevent the event from bubbling up to trigger global FileHandler
    e.nativeEvent.stopImmediatePropagation()

    dragCounter.current = 0
    setIsDragging(false)

    // Prevent drop if already uploading
    if (uploading) {
      return;
    }

    const file = e.dataTransfer?.files?.[0]

    if (file && id) {
      selectedFile.current = file
      const pos = typeof props.getPos === 'function' ? props.getPos() : undefined
      // Use the existing node's ID and update it in place
      editor?.storage.imageUploaderExtension.uploadImageFromFile(editor, file, id, true, pos)
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [editor, id, props, uploading])

  const handleDragEnter = () => {
    dragCounter.current++
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const cancelUpload = () => {
    const pos = typeof props.getPos === 'function' ? props.getPos() : undefined
    editor?.storage.imageUploaderExtension.cancelUpload(editor, id, pos)
    showToast('Info', 'accent', 'Upload cancelled')
  }

  // Always prevent default drop behavior, even when uploading
  // Do nothing else - just prevent browser from opening the file
  // const handleDropWhileUploading = useCallback((e: React.DragEvent) => {
  //   e.preventDefault()
  //   e.stopPropagation()
  //   e.nativeEvent.stopImmediatePropagation()
  // }, [])

  useEffect(() => {
    if (failed || errorMessage) {
      showToast('Error', 'danger', errorMessage)
      
      props.updateAttributes({
        failed: false,
        selectMedia: true,
        errorMessage: null,
      })
    }
  }, [failed, errorMessage, props])

  return (
    <NodeViewWrapper
      data-drag-handle
      data-uploading={uploading}
      data-type="image-uploader"
      className='w-full h-full rounded-lg'
      onDrop={(!uploading && !src) ? handleDrop : undefined}
      onDragOver={(!uploading && !src) ? handleDragOver : undefined}
      onDragEnter={(!uploading && !src) ? handleDragEnter : undefined}
      onDragLeave={(!uploading && !src) ? handleDragLeave : undefined}
    >
      <div
        className={cn(
          isDragging ? 'bg-accent-soft' : ' bg-background',
          selectMedia ? 'border border-dashed px-6 py-8' : '',
          'w-full h-full flex flex-col rounded-lg text-center cursor-pointer relative overflow-hidden transition-all'
        )}
        draggable={false}
        contentEditable={false}
      >
        <input
          type="file"
          ref={inputRef}
          style={{ display: 'none' }}
          accept="image/png, image/jpeg, image/jpg"
          onChange={handleFileChange}
        />

        {selectMedia && !uploading && (
          <div onClick={handleClick} className='flex flex-col gap-2 items-center justify-center'>
            <div>
              <Icon
                name='File'
                className='w-14 h-14'
              />
            </div>

            <div className='flex flex-col items-center justify-center gap-1'>
              <span className='text-foreground-700 font-normal text-sm'>
                <span className='underline'>
                  {'Click to upload '}
                </span>
                {'or drag and drop'}
              </span>

              <span className='text-foreground-400 font-medium text-xs'>
                {'Maximum file size 5MB.'}
              </span>
            </div>
          </div>
        )}

        {uploading && (
          <div className="w-full flex justify-between items-center gap-5 border p-4 overflow-hidden rounded-lg relative">
            <div
              className='h-full bg-accent-soft dark:bg-accent/20 absolute top-0 left-0 z-0 transition-all'
              style={{
                width: `${progress}%`
              }}
            >

            </div>

            <div className='w-full flex items-center gap-3 z-1'>
              <div className='w-[46px] h-10 flex items-center justify-center bg-accent dark:bg-foreground rounded-lg'>
                <Icon name='CloudUpload' className='text-background w-6 h-6' />
              </div>

              <div className='w-full flex flex-col items-start gap-1'>
                <span className='text-sm text-foreground'>
                  {name ? name?.toLowerCase() : selectedFile.current?.name.toLowerCase()}
                </span>

                <span className='text-sm text-foreground-500'>
                  {size ? (size / (1024 * 1024)).toFixed(2) : selectedFile.current?.size ? (selectedFile.current.size / (1024 * 1024)).toFixed(2) : '0.00'} MB
                </span>
              </div>
            </div>

            <div className='flex items-center gap-3 z-1'>
              <span className='text-sm text-accent'>
                {progress}%
              </span>

              <Button
                size='sm'
                variant='ghost'
                isIconOnly
                onPress={cancelUpload}
              >
                <Icon name='X' />
              </Button>
            </div>
          </div>
        )}

        {!uploading && src && (
          <div className="uploaded-image w-full pointer-events-none">
            <img
              src={src}
              alt="Uploaded"
              draggable={false}
              style={{ maxWidth: '100%' }}
              className='h-[350px] rounded-lg pointer-events-none select-none'
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default ImageUploaderView
