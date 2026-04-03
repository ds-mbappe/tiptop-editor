import React from 'react'
import { Header, Label, ListBox, Separator } from '@heroui/react'
import { colorSections } from '../../constants'
import type { Editor } from '@tiptap/react'
import ColorIcon from '../ui/ColorIcon'

const DragHandleColorList = ({ editor, onCloseMenu }: { editor: Editor, onCloseMenu: () => void }) => {
  const applyColor = (key: string) => {
    const sectionKey = key?.split('_')?.[0];
    const color = key?.split('_')?.[1];

    if (!sectionKey || !color) return;

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
    <ListBox aria-label='Color list' onAction={(key) => applyColor(key as string)}>
      {colorSections.map((section, index) =>
        <React.Fragment key={section.key}>
          <ListBox.Section id={section.key}>
            <Header>{section.title}</Header>
            {section.colors.map((el) =>
              <ListBox.Item
                key={`${section.key}_${el.hsl}`}
                id={`${section.key}_${el.hsl}`}
                textValue={el.tooltipText}
                className='text-muted hover:text-foreground outline-none'
              >
                <ColorIcon buttonType={section.buttonType} color={el.color} bgColor={el.bgColor} />
                <Label>{el.tooltipText}</Label>
              </ListBox.Item>
            )}
          </ListBox.Section>
          {index !== colorSections.length - 1 && <Separator />}
        </React.Fragment>
      )}
    </ListBox>
  )
}

export default DragHandleColorList
