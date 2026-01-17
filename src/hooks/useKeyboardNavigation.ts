import { useCallback, useRef } from 'react';

interface UseKeyboardNavigationProps {
  isOpen: boolean;
  focusedIndex: number;
  itemCount: number;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (index: number) => void;
  onNavigate: (direction: 'up' | 'down', newIndex: number) => void;
  listRef: React.RefObject<any>;
}

/**
 * Custom hook for managing keyboard navigation in dropdown/combobox components
 * Handles Arrow Up/Down, Enter, Escape, and Tab keys
 */
export const useKeyboardNavigation = ({
  isOpen,
  focusedIndex,
  itemCount,
  onOpen,
  onClose,
  onSelect,
  onNavigate,
  listRef,
}: UseKeyboardNavigationProps) => {
  const previousFocusedIndexRef = useRef(focusedIndex);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Store previous index for animation/scrolling
      previousFocusedIndexRef.current = focusedIndex;

      if (!isOpen) {
        // When closed, arrow down and enter open the dropdown
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          e.preventDefault();
          onOpen();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = focusedIndex < itemCount - 1 ? focusedIndex + 1 : focusedIndex;
          onNavigate('down', nextIndex);

          // Scroll focused item into view
          if (listRef.current && nextIndex !== focusedIndex) {
            listRef.current.scrollToItem?.(nextIndex, 'auto');
          }
          break;
        }

        case 'ArrowUp': {
          e.preventDefault();
          const nextIndex = focusedIndex > 0 ? focusedIndex - 1 : focusedIndex;
          onNavigate('up', nextIndex);

          // Scroll focused item into view
          if (listRef.current && nextIndex !== focusedIndex) {
            listRef.current.scrollToItem?.(nextIndex, 'auto');
          }
          break;
        }

        case 'Enter': {
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < itemCount) {
            onSelect(focusedIndex);
          }
          break;
        }

        case 'Escape': {
          e.preventDefault();
          onClose();
          break;
        }

        case 'Tab': {
          // Tab closes the dropdown but doesn't prevent default
          // (allows tab to move to next element)
          onClose();
          break;
        }

        default:
          break;
      }
    },
    [isOpen, focusedIndex, itemCount, onOpen, onClose, onSelect, onNavigate, listRef]
  );

  return {
    handleKeyDown,
  };
};
