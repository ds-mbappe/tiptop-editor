import DragHandle from '@tiptap/extension-drag-handle-react'
import { Editor } from '@tiptap/react'
import { Node } from '@tiptap/pm/model'
import { useCallback, useMemo, useState } from 'react'
import { NodeSelection } from '@tiptap/pm/state'
import Icon from '../ui/Icon'
import { Dropdown, Kbd, Label, Separator } from '@heroui/react'
import { commandGroups } from '../../constants'
import type { icons } from 'lucide-react'
import DragHandleColorList from './DragHandleColorList'
import TransformIntoIcon from './TransformIntoIcon'
import { canShowColorTransform, canShowNodeTransform, hasAtLeastOneMark, isUploadingImage, nodeHasTextContent, removeAllFormatting, transformNodeToAlternative } from '../../helpers'

const excludedCommands = ['imageUploader'];

const formattedTransformOptions = commandGroups.flatMap(group => group.commands).filter(command => !excludedCommands.includes(command.key))

const TiptopDragHandle = ({ editor, dragHandleSlot }: { editor: Editor, dragHandleSlot?: React.ReactNode }) => {
  const [currentNodePos, setCurrentNodePos] = useState<number>(-1)
  const [dropdownOpened, setDropdownOpened] = useState<boolean>(false)

  const dragHandleDisabledKeys = useMemo(() => {
    const isUploading = isUploadingImage(editor.state)

    if (isUploading) {
      return new Set(['duplicate_node'])
    }
    return new Set<string>()
  }, [editor.state])

  const handleNodeChange = useCallback(
    ({ pos }: { editor: Editor; node: Node | null; pos: number }) => {
      setCurrentNodePos(pos);
    },
    []
  );

  const selectCurrentNode = useCallback(() => {
    setDropdownOpened(!dropdownOpened)
  
    const { state, view } = editor;
  
    const selection = window.getSelection();
  
    if (selection && !selection.isCollapsed) {
      selection.removeAllRanges();
    }

    if (currentNodePos === -1) return;
  
    const transaction = state.tr.setSelection(
      NodeSelection.create(state.doc, currentNodePos)
    );
  
    view.dispatch(transaction);
  }, [dropdownOpened, editor, currentNodePos])

  const addSlashParagraphAfterCurrentBlock = useCallback(
    (editor: Editor, currentNodePos: number) => {
      if (currentNodePos === null) { /* empty */ };

      const resolvedPos = editor.state.doc.resolve(currentNodePos);
      const blockNode = resolvedPos.nodeAfter || resolvedPos.parent;

      // Calculate the end of the current block
      const blockEnd = currentNodePos + blockNode.nodeSize;

      editor
        .chain()
        .focus(blockEnd, { scrollIntoView: true })
        .insertContentAt(blockEnd, {
          type: 'paragraph',
          content: [{ type: 'text', text: '/' }]
        })
        .setTextSelection(blockEnd + 2)
        .run();
    },
    []
  );

  return (
    <DragHandle
      editor={editor}
      computePositionConfig={{
        placement: 'left',
      }}
      onNodeChange={handleNodeChange}
    >
      <div className='flex items-center pr-3'>
        <div
          className='w-6 h-8 rounded-2xl flex justify-center items-center px-0 py-2 bg-transparent hover:bg-default/10 cursor-grab text-muted hover:text-foreground transition-all'
          onClick={() => addSlashParagraphAfterCurrentBlock(editor, currentNodePos)}
        >
          <Icon name='Plus' />
        </div>

        <Dropdown
          isOpen={dropdownOpened}
          onOpenChange={(isOpen) => {
            setDropdownOpened(isOpen);
            selectCurrentNode();
          }}
        >
          <Dropdown.Trigger>
            <div
              className='w-6 h-8 rounded-2xl flex justify-center items-center px-0 py-2 bg-transparent hover:bg-default/10 cursor-grab text-muted hover:text-foreground transition-all'
            >
              <Icon name='GripVertical' />
            </div>
          </Dropdown.Trigger>

          <Dropdown.Popover>
            <Dropdown.Menu
              shouldCloseOnSelect={true}
              disabledKeys={dragHandleDisabledKeys}
              className='w-[225px]'
              onAction={(key) => console.log(key)}
            >
              <Dropdown.Section>
                {canShowColorTransform(editor)
                  ? <Dropdown.SubmenuTrigger>
                      <Dropdown.Item
                        id="color"
                        textValue='color'
                        className='text-muted hover:text-foreground outline-none'
                      >
                        <Icon name='PaintBucket' />
                        <Label>{'Color'}</Label>
                        <Dropdown.SubmenuIndicator />
                      </Dropdown.Item>
                      <Dropdown.Popover>
                        <DragHandleColorList
                          editor={editor}
                          onCloseMenu={() => {}}
                        />
                      </Dropdown.Popover>
                    </Dropdown.SubmenuTrigger>
                  : null
                }

                {canShowNodeTransform(editor)
                  ? <Dropdown.SubmenuTrigger>
                      <Dropdown.Item
                        id="turn_into"
                        textValue='turn_into'
                        className='text-muted hover:text-foreground outline-none'
                      >
                        <TransformIntoIcon />
                        <Label>{'Transform into'}</Label>
                        <Dropdown.SubmenuIndicator />
                      </Dropdown.Item>
                      <Dropdown.Popover>
                        <Dropdown.Menu
                          aria-label='Transform into'
                          onAction={(key) => {
                            const node = formattedTransformOptions.find(n => n.key === key)
                            if (!node) return
                            if (currentNodePos >= 0) {
                              try {
                                const { state, view } = editor
                                view.dispatch(state.tr.setSelection(NodeSelection.create(state.doc, currentNodePos)))
                              } catch { return }
                            }
                            transformNodeToAlternative(editor, node)
                            setTimeout(() => setDropdownOpened(false), 100)
                          }}
                        >
                          {formattedTransformOptions.map((node) =>
                            <Dropdown.Item
                              key={node.key}
                              id={node.key}
                              textValue={node.title}
                              className='text-muted hover:text-foreground outline-none'
                            >
                              <Icon name={node.icon as unknown as keyof typeof icons} />
                              <Label>{node.title}</Label>
                            </Dropdown.Item>
                          )}
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown.SubmenuTrigger>
                  : null
                }

                {hasAtLeastOneMark(editor)
                  ? <Dropdown.Item
                      id="reset_formatting"
                      textValue='reset_formatting'
                      className='text-muted hover:text-foreground outline-none p-0 h-8 flex justify-center'
                    >
                      <div className='w-full h-8 px-2 py-1.5 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <Icon name='RotateCcw' />
                          <Label>{'Reset formatting'}</Label>
                        </div>
                      </div>
                    </Dropdown.Item>
                  : null
                }
              </Dropdown.Section>

              <>
                {dragHandleSlot && dragHandleSlot}
              </>

              <Separator />

              <Dropdown.Section>
                <Dropdown.Item
                  id="duplicate_node"
                  textValue='duplicate_node'
                  className='text-muted hover:text-foreground outline-none p-0 h-8 flex justify-center'
                >
                  <div className='w-full h-8 px-2 py-1.5 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Icon name='Copy' />
                      <Label>{'Duplicate block'}</Label>
                    </div>
                    <Kbd slot="keyboard">
                      <Kbd.Abbr keyValue="command" />
                      <Kbd.Content>D</Kbd.Content>
                    </Kbd>
                  </div>
                </Dropdown.Item>

                {nodeHasTextContent(editor)
                  ? <Dropdown.Item
                      id="copy_to_clipboard"
                      textValue='copy_to_clipboard'
                      className='text-muted hover:text-foreground outline-none p-0 h-8 flex justify-center'
                    >
                      <div className='w-full h-8 px-2 py-1.5 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <Icon name='Clipboard' />
                          <Label>{'Copy to clipboard'}</Label>
                        </div>
                        <Kbd slot="keyboard">
                          <Kbd.Abbr keyValue="command" />
                          <Kbd.Content>C</Kbd.Content>
                        </Kbd>
                      </div>
                    </Dropdown.Item>
                  : null
                }
              </Dropdown.Section>

              <Dropdown.Item
                id="delete"
                textValue='delete'
                className='text-muted hover:text-foreground outline-none p-0 h-8 flex justify-center'
              >
                <div className='w-full h-8 px-2 py-1.5 flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Icon name='Trash' />
                    <Label>{'Delete'}</Label>
                  </div>
                  <Kbd slot="keyboard">
                    <Kbd.Content>Del</Kbd.Content>
                  </Kbd>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </DragHandle>
  )
}

export default TiptopDragHandle
