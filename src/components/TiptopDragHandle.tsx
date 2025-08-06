import DragHandle from '@tiptap/extension-drag-handle-react'
import { Editor } from '@tiptap/react'
import { Node } from '@tiptap/pm/model'
import { useCallback, useState } from 'react'
import { NodeSelection } from '@tiptap/pm/state'
import Icon from './Icon'
import { Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger, Kbd, Listbox, ListboxItem, Popover, PopoverContent, PopoverTrigger } from '@heroui/react'
import { commandGroups } from '../constants'
import type { icons } from 'lucide-react'
import DragHandleColorList from './DragHandleColorList'
import TransformIntoIcon from './TransformIntoIcon'
import { canShowColorTransform, canShowNodeTransform, copyNodeTextContent, deleteNode, duplicateNode, hasAtLeastOneMark, nodeHasTextContent, removeAllFormatting, transformNodeToAlternative } from '../helpers'

const formattedTransformOptions = commandGroups.flatMap(group => group.commands)

const TiptopDragHandle = ({ editor }: { editor: Editor }) => {
  const [currentNodePos, setCurrentNodePos] = useState<number>(-1)
  const [dropdownOpened, setDropdownOpened] = useState<boolean>(false)
  const [isOpenColorMenu, setIsOpenColorMenu] = useState<boolean>(false)
  const [isOpenTransformMenu, setIsOpenTransformMenu] = useState<boolean>(false)

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
        <button
          className='w-6 h-8 rounded-2xl flex justify-center items-center px-0 py-2 bg-transparent hover:bg-default-100 cursor-grab text-foreground-500 hover:text-foreground transition-all'
          onClick={() => addSlashParagraphAfterCurrentBlock(editor, currentNodePos)}
        >
          <Icon name='Plus' />
        </button>

        <Dropdown
          placement="right"
          isOpen={dropdownOpened}
          onOpenChange={setDropdownOpened}
        >
          <DropdownTrigger>
            <button
              className='w-6 h-8 rounded-2xl flex justify-center items-center px-0 py-2 bg-transparent hover:bg-default-100 cursor-grab text-foreground-500 hover:text-foreground transition-all'
              onClick={selectCurrentNode}
            >
              <Icon name='GripVertical' />
            </button>
          </DropdownTrigger>

          <DropdownMenu
            variant='flat'
            closeOnSelect={false}
            classNames={{
              base: 'w-[225px]'
            }}
          >
            <DropdownSection
              showDivider={canShowColorTransform(editor) ? true : false}
            >
              {canShowColorTransform(editor)
                ? <DropdownItem
                    key="color"
                    isReadOnly
                    textValue='color'
                    className='text-foreground-500 hover:text-foreground outline-none p-0 h-8 flex justify-center'
                  >
                    <Popover
                      placement='right'
                      isOpen={isOpenColorMenu}
                      shouldCloseOnBlur={false}
                      triggerScaleOnOpen={false}
                      onOpenChange={(open) => setIsOpenColorMenu(open)}
                    >
                      <PopoverTrigger>
                        <div
                          className='w-full h-8 px-2 py-1.5 flex items-center justify-between'
                          onClick={() => {
                            setIsOpenTransformMenu(false)
                            setIsOpenColorMenu(true)
                          }}
                        >
                          <div className='flex items-center gap-2'>
                            <Icon name='PaintBucket' />
                            
                            <p>{'Color'}</p>
                          </div>

                          <Icon name='ChevronRight' />
                        </div>
                      </PopoverTrigger>

                      <PopoverContent>
                        <DragHandleColorList
                          editor={editor}
                          onCloseMenu={() => {
                            setIsOpenColorMenu(false)

                            setTimeout(() => {
                              setDropdownOpened(false)
                            }, 100);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </DropdownItem>
                : null
              }

              {canShowNodeTransform(editor)
                ? <DropdownItem
                    key="turn_into"
                    isReadOnly
                    textValue='turn_into'
                    className='text-foreground-500 hover:text-foreground outline-none p-0 h-8 flex justify-center'
                  >
                    <Popover
                      placement='right'
                      shouldCloseOnBlur={false}
                      triggerScaleOnOpen={false}
                      isOpen={isOpenTransformMenu}
                      onOpenChange={(open) => setIsOpenTransformMenu(open)}
                    >
                      <PopoverTrigger>
                        <div
                          className='w-full h-8 px-2 py-1.5 flex items-center justify-between'
                          onClick={() => {
                            setIsOpenColorMenu(false)
                            setIsOpenTransformMenu(!isOpenTransformMenu)
                          }}
                        >
                          <div className='flex items-center gap-2'>
                            <TransformIntoIcon />
                            
                            <p>{'Transform into'}</p>
                          </div>

                          <Icon name='ChevronRight' />
                        </div>
                      </PopoverTrigger>

                      <PopoverContent>
                        <Listbox
                          label='Turn into list'
                          variant='flat'
                          classNames={{ list: 'p-0', base: 'p-0' }}
                        >
                          {formattedTransformOptions.map((node) =>
                            <ListboxItem
                              key={node.key}
                              startContent={<Icon name={node.icon as unknown as keyof typeof icons} />}
                              className='text-foreground-500 hover:text-foreground outline-none'
                              onPress={() => {
                                transformNodeToAlternative(editor, node)

                                setIsOpenTransformMenu(false)

                                setTimeout(() => {
                                  setDropdownOpened(false)
                                }, 100);
                              }}
                            >
                              {node.title}
                            </ListboxItem>
                          )}
                        </Listbox>
                      </PopoverContent>
                    </Popover>
                  </DropdownItem>
                : null
              }


              {hasAtLeastOneMark(editor)
                ? <DropdownItem
                    key="reset_formatting"
                    textValue='reset_formatting'
                    className='text-foreground-500 hover:text-foreground outline-none p-0 h-8 flex justify-center'
                    onPress={() => removeAllFormatting(editor)}
                  >
                    <div className='w-full h-8 px-2 py-1.5 flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Icon name='RotateCcw' />
                        
                        <p>{'Reset formatting'}</p>
                      </div>
                    </div>
                  </DropdownItem>
                : null
              }
            </DropdownSection>
            
            <DropdownSection showDivider>
              <DropdownItem
                key="duplicate_node"
                textValue='duplicate_node'
                className='text-foreground-500 hover:text-foreground outline-none p-0 h-8 flex justify-center'
                onPress={() => duplicateNode(editor)}
              >
                <div className='w-full h-8 px-2 py-1.5 flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Icon name='Copy' />
                    
                    <p>{'Duplicate block'}</p>
                  </div>

                  <Kbd keys={['command']}>D</Kbd>
                </div>
              </DropdownItem>

              {nodeHasTextContent(editor)
                ? <DropdownItem
                    key="copy_to_clipboard"
                    closeOnSelect={true}
                    textValue='copy_to_clipboard'
                    className='text-foreground-500 hover:text-foreground outline-none p-0 h-8 flex justify-center'
                    onPress={() => copyNodeTextContent(editor)}
                  >
                    <div className='w-full h-8 px-2 py-1.5 flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Icon name='Clipboard' />
                        
                        <p>{'Copy to clipboard'}</p>
                      </div>

                      <Kbd keys={['command']}>C</Kbd>
                    </div>
                  </DropdownItem>
                : null
              }
            </DropdownSection>

            <DropdownItem
              key="delete"
              textValue='delete'
              className='text-foreground-500 hover:text-foreground outline-none p-0 h-8 flex justify-center'
              onPress={() => deleteNode(editor)}
            >
              <div className='w-full h-8 px-2 py-1.5 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Icon name='Trash' />
                  
                  <p>{'Delete'}</p>
                </div>

                <Kbd>{'Del'}</Kbd>
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </DragHandle>
  )
}

export default TiptopDragHandle