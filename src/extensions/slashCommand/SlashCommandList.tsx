import {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import type { SlashCommandGroupProps, SlashCommandGroupCommandsProps } from '../../types';
import { cn, Divider } from '@heroui/react';
import { icons } from 'lucide-react';
import Icon from '../../components/Icon';

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const SlashCommandList = forwardRef<SlashCommandListRef, {
  items: SlashCommandGroupProps[];
  command: (item: SlashCommandGroupCommandsProps) => void;
}>(({ items, command }, ref) => {
  const flatItems: SlashCommandGroupCommandsProps[] = items.flatMap(group => group.commands);
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
    setSelectedIndex((prev) => (prev + flatItems.length - 1) % flatItems.length);
  };

  const downHandler = () => {
    setSelectedIndex((prev) => (prev + 1) % flatItems.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  const selectItem = (index: number) => {
    const item = flatItems[index];
    if (item) {
      command(item);
    }
  };

  return (
    <div
      aria-label="Command menu"
      className='w-[200px] bg-background border border-divider shadow rounded-2xl flex flex-col gap-2 p-2.5 relative'
    >
      {items.length > 0 ? (
        items.map((group, groupIndex) => (
          <div key={group.key} className='flex flex-col gap-2'>
            <div className='w-full items-start flex flex-col gap-1'>
              <p className='px-1 text-sm font-medium text-foreground'>
                {group.title}
              </p>

              {group.commands.map((item, index) => {
                const globalIndex = items
                  .slice(0, groupIndex)
                  .reduce((acc, g) => acc + g.commands.length, 0) + index;

                return (
                  <button
                    key={item.key}
                    className={cn(
                      'w-full h-8 rounded-lg flex gap-1.5 items-center p-2 bg-transparent hover:bg-default-100 cursor-pointer text-foreground-500 transition-all',
                      selectedIndex === globalIndex
                        ? 'bg-default-100 text-primary'
                        : 'hover:text-foreground'
                    )}
                    onClick={() => selectItem(globalIndex)}
                  >
                    <div>
                      <Icon name={item.icon as keyof typeof icons} />
                    </div>

                    <span className='text-sm'>{item.title}</span>
                  </button>
                );
              })}
            </div>

            {groupIndex !== items.length - 1 &&
              <Divider />
            }
          </div>
        ))
      ) : (
        <p
          className="text-foreground-500 text-sm"
        >
          {'No results'}
        </p>
      )}
    </div>
  );
});

export default SlashCommandList;
