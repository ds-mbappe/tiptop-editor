import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { KeyDownRef } from '../../types';
import type { EmojiItem } from '@tiptap/extension-emoji';
import { cn } from '@heroui/react';

const EmojiList = forwardRef<KeyDownRef, {
  items: EmojiItem[],
  command: (item: EmojiItem) => void;
}
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }: { event: KeyboardEvent }) {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const upHandler = () => {
    setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((prev) => (prev + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  return (
    <div className='w-full max-w-[250px] max-h-[500px] bg-background border border-divider shadow rounded-2xl flex flex-col gap-1 p-2.5 relative overflow-hidden'>
      <div className='w-full flex flex-col gap-1 overflow-y-auto'>
        {items.length > 0 ? (
          items.map((item, index) => (
            <button
              key={item.name}
              className={cn(
                'w-full h-7 rounded-lg flex gap-1.5 items-center p-2 bg-transparent hover:bg-default-100 cursor-pointer text-foreground-500 transition-all',
                selectedIndex === index
                  ? 'bg-default-100 text-primary'
                  : 'hover:text-foreground'
              )}
              data-emoji-name={item.name}
              onClick={() => selectItem(index)}
            >
              {item.fallbackImage ? <img src={item.fallbackImage} width={20} height={20} alt={item.emoji} /> : item.emoji}{' '}
              <span
                title={item.name}
                className='text-sm text-ellipsis overflow-hidden'
              >
                {item.name}
              </span>
            </button>
          ))
        ) : (
          <p className="text-foreground-500 text-sm">
            {'No results'}
          </p>
        )}
      </div>
    </div>
  )
})

export default EmojiList