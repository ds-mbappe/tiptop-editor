import { Listbox, ListboxItem, ListboxSection } from '@heroui/react'
import { colorSections } from '../constants'
import type { Editor } from '@tiptap/react'
import ColorIcon from './ColorIcon'

const DragHandleColorList = ({ editor, onCloseMenu }: { editor: Editor, onCloseMenu: () => void }) => {
  const applyColor = (sectionKey: string, color: string) => {
    switch (sectionKey) {
      case 'text':
        editor.chain().focus().setColor(color).run()
        break;
      case 'highlight':
        editor.chain().focus().setHighlight({ color }).run()
        break;
      default:
        return;
    }

    onCloseMenu()
  }

  return (
    <Listbox label='Color list' variant='flat' classNames={{ list: 'p-0', base: 'p-0' }}>
      {colorSections.map((section, index) =>
        <ListboxSection
          key={section.key}
          title={section.title}
          showDivider={index !== colorSections.length - 1}
        >
          {section.colors.map((el) =>
            <ListboxItem
              key={`${section.key}_${el.color}`}
              startContent={<ColorIcon buttonType={section.buttonType} color={el.color} bgColor={el.bgColor} />}
              className='text-foreground-500 hover:text-foreground outline-none'
              onPress={() => applyColor(section.key, el.hsl)}
            >
              {el.tooltipText}
            </ListboxItem>
          )}
        </ListboxSection>
      )}
    </Listbox>
  )
}

export default DragHandleColorList