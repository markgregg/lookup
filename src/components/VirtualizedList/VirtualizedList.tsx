import React, { useState } from 'react';
import { List } from 'react-window';
import componentStyles from './VirtualizedList.module.less';

type StringListProps = {
  items: string[];
  selected: string | string[];
  multipleSelect?: boolean;
  onSelect?: (selected: string | string[]) => void;
  rowHeight?: number;
  styles?: React.CSSProperties;
  className?: string;
  focusedIndex?: number;
  listRef?: React.MutableRefObject<any>;
  showSeparator?: boolean;
};

type ObjectListProps<T extends object | string> = {
  items: (string | T)[];
  selected: T | T[];
  multipleSelect?: boolean;
  onSelect?: (selected: T | T[]) => void;
  rowHeight?: number;
  styles?: React.CSSProperties;
  className?: string;
  itemKey: keyof T;
  renderer: (item: T) => React.ReactNode;
  focusedIndex?: number;
  listRef?: React.MutableRefObject<any>;
  showSeparator?: boolean;
};

type VirtualizedListProps<T> = T extends string
  ? StringListProps
  : T extends object
    ? ObjectListProps<T>
    : never;

export const VirtualizedList = <T extends string | object = string>(props: VirtualizedListProps<T>) => {
  const { items, selected, multipleSelect = false, onSelect, styles, className, focusedIndex = -1, listRef, showSeparator = false } = props;
  const rowHeight = (props as any).rowHeight || 32;
  const isStringList = items.length > 0 && typeof items[0] === 'string';
  const itemKey = (props as any).itemKey;
  const renderer = (props as any).renderer || ((item: T) => <span>{String(item)}</span>);
  const selectedIsString =
    typeof selected === 'string' ||
    (Array.isArray(selected) && selected.length > 0 && typeof selected[0] === 'string');
  const selectedItems = Array.isArray(selected) ? selected : [selected];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const Row = (props: { index: number; style: React.CSSProperties }) => {
    const { index, style } = props;
    const item = items[index];
    const itemValue = isStringList ? (item as string) : (item as any)[itemKey];
    const isSelected = selectedIsString
      ? selectedItems.includes(itemValue)
      : !!selectedItems.find((s: any) => s[itemKey] === itemValue);
    const isFocused = index === focusedIndex;
    const isLastItem = index === items.length - 1;
    const content: React.ReactNode = isStringList ? <span>{item as string}</span> : renderer!(item);

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!onSelect) return;
      if (multipleSelect) {
        const newSelected = isSelected
          ? selectedItems.filter((s) =>
              selectedIsString ? s !== itemValue : s[itemKey] !== itemValue
            )
          : [...selectedItems, selectedIsString ? itemValue : item];
        onSelect(newSelected);
      } else {
        onSelect(selectedIsString ? itemValue : item);
      }
    };
    const handleMouseEnter = () => {
      setHoveredIndex(index);
    };
    const handleMouseLeave = () => {
      setHoveredIndex(null);
    };
    return (
      <div
        style={style}
        className={`${componentStyles.listItem} ${isSelected ? componentStyles.selected : ''} ${isFocused ? componentStyles.keyboardFocused : ''} ${hoveredIndex === index ? componentStyles.hovered : ''}`}
        onMouseDown={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {multipleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            className={componentStyles.checkbox}
          />
        )}
        {content}
        {showSeparator && !isLastItem && (
          <div className={componentStyles.separator}></div>
        )}
      </div>
    );
  };

  return (
    <div style={{ ...styles, width: '100%', height: '100%' }} className={className}>
      <List rowCount={items.length} rowHeight={rowHeight} rowComponent={Row} rowProps={{} as any} {...(listRef ? { ref: listRef } : {})} />
    </div>
  );
};

VirtualizedList.displayName = 'VirtualizedList';
