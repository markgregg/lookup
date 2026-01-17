import { useEffect } from 'react';

/**
 * Custom hook to detect clicks outside a referenced element
 * @param ref - Reference to the element to monitor
 * @param onClickOutside - Callback function to invoke when a click is detected outside the element
 */
export const useClickOutside = (
  ref: React.RefObject<HTMLElement | null>,
  onClickOutside: () => void
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, onClickOutside]);
};
