import React, { useEffect, useMemo, useState } from 'react'
import { Button, Popover, Separator } from '@heroui/react'
import type { Editor } from '@tiptap/react'
import Icon from '../ui/Icon'

interface TableButtonMenuProps {
  editor: Editor
}

const TableButtonMenu = ({ editor }: TableButtonMenuProps) => {
  const [menuOpened, setMenuOpened] = useState(false)
  const [, setSelectionVersion] = useState(0)

  useEffect(() => {
    const update = () => setSelectionVersion((value) => value + 1)

    editor.on('selectionUpdate', update)
    editor.on('transaction', update)

    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  const isActive = editor.isActive('table')

  const actionGroups = useMemo(() => {
    const canRun = (command: () => boolean) => command()

    return [
      {
        key: 'columns',
        actions: [
          {
            key: 'add-column-before',
            label: 'Col before',
            command: () => editor.chain().focus().addColumnBefore().run(),
            canRun: () => canRun(() => editor.can().chain().focus().addColumnBefore().run()),
          },
          {
            key: 'add-column-after',
            label: 'Col after',
            command: () => editor.chain().focus().addColumnAfter().run(),
            canRun: () => canRun(() => editor.can().chain().focus().addColumnAfter().run()),
          },
          {
            key: 'delete-column',
            label: 'Delete col',
            command: () => editor.chain().focus().deleteColumn().run(),
            canRun: () => canRun(() => editor.can().chain().focus().deleteColumn().run()),
          },
        ],
      },
      {
        key: 'rows',
        actions: [
          {
            key: 'add-row-before',
            label: 'Row above',
            command: () => editor.chain().focus().addRowBefore().run(),
            canRun: () => canRun(() => editor.can().chain().focus().addRowBefore().run()),
          },
          {
            key: 'add-row-after',
            label: 'Row below',
            command: () => editor.chain().focus().addRowAfter().run(),
            canRun: () => canRun(() => editor.can().chain().focus().addRowAfter().run()),
          },
          {
            key: 'delete-row',
            label: 'Delete row',
            command: () => editor.chain().focus().deleteRow().run(),
            canRun: () => canRun(() => editor.can().chain().focus().deleteRow().run()),
          },
        ],
      },
      {
        key: 'cells',
        actions: [
          {
            key: 'merge-cells',
            label: 'Merge',
            command: () => editor.chain().focus().mergeCells().run(),
            canRun: () => canRun(() => editor.can().chain().focus().mergeCells().run()),
          },
          {
            key: 'split-cell',
            label: 'Split',
            command: () => editor.chain().focus().splitCell().run(),
            canRun: () => canRun(() => editor.can().chain().focus().splitCell().run()),
          },
          {
            key: 'toggle-header-row',
            label: 'Header row',
            command: () => editor.chain().focus().toggleHeaderRow().run(),
            canRun: () => canRun(() => editor.can().chain().focus().toggleHeaderRow().run()),
          },
          {
            key: 'toggle-header-column',
            label: 'Header col',
            command: () => editor.chain().focus().toggleHeaderColumn().run(),
            canRun: () => canRun(() => editor.can().chain().focus().toggleHeaderColumn().run()),
          },
        ],
      },
    ]
  }, [editor])

  if (!isActive) {
    return null
  }

  return (
    <Popover isOpen={menuOpened} onOpenChange={setMenuOpened}>
      <Button
        size="sm"
        variant="ghost"
        isIconOnly
        aria-label="Table controls"
        className="text-muted hover:text-foreground data-[active=true]:bg-default/45 data-[active=true]:text-accent data-[active=true]:hover:bg-default/45 data-[active=true]:hover:text-foreground"
      >
        <Icon name="Table2" />
      </Button>

      <Popover.Content placement="bottom">
        <Popover.Dialog className="p-1.5">
          <div className="flex flex-col gap-1">
            {actionGroups.map((group, index) => (
              <React.Fragment key={group.key}>
                <div className="grid grid-cols-2 gap-1">
                  {group.actions.map((action) => (
                    <Button
                      key={action.key}
                      size="sm"
                      variant="ghost"
                      isDisabled={!action.canRun()}
                      className="justify-start text-muted hover:text-foreground"
                      onPress={() => {
                        action.command()
                        setMenuOpened(false)
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>

                {index < actionGroups.length - 1
                  ? <Separator className="my-0.5" />
                  : null}
              </React.Fragment>
            ))}

            <Button
              size="sm"
              variant="danger-soft"
              isDisabled={!editor.can().chain().focus().deleteTable().run()}
              className="justify-start text-danger"
              onPress={() => {
                editor.chain().focus().deleteTable().run()
                setMenuOpened(false)
              }}
            >
              Delete table
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}

export default React.memo(TableButtonMenu)
