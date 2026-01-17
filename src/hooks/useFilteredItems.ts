import { useState, useCallback } from 'react';

type SourceCallback<T> = (searchText: string) => Promise<T[]>;

interface UseFilteredItemsProps<T> {
  items: T[] | SourceCallback<T>;
  isStringType: boolean;
  matchFields?: (keyof T)[];
  type: 'combobox' | 'dropdown';
}

interface UseFilteredItemsReturn<T> {
  filteredItems: T[];
  isLoading: boolean;
  setFilteredItems: (items: T[]) => void;
  setIsLoading: (loading: boolean) => void;
  filterItems: (searchText: string, baseItems: T[]) => Promise<void>;
}

/**
 * Custom hook for managing filtered items and async item loading
 * Handles filtering logic for both string and object types
 */
export const useFilteredItems = <T extends string | object>({
  items,
  isStringType,
  matchFields,
  type,
}: UseFilteredItemsProps<T>): UseFilteredItemsReturn<T> => {
  const isCallback = typeof items === 'function';
  const baseItems = Array.isArray(items) ? items : [];
  
  const [filteredItems, setFilteredItems] = useState<T[]>(
    isCallback ? [] : baseItems
  );
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Filter items based on search text
   * For combobox: filters items matching search text
   * For dropdown: shows all items
   */
  const filterItems = useCallback(
    async (searchText: string, baseItems: T[]) => {
      if (!searchText) {
        setFilteredItems(baseItems);
        return;
      }

      // Dropdown type doesn't filter
      if (type === 'dropdown') {
        setFilteredItems(baseItems);
        return;
      }

      const searchLower = searchText.toLowerCase();

      if (isStringType) {
        const filtered = baseItems.filter((item: any) =>
          String(item).toLowerCase().includes(searchLower)
        );
        setFilteredItems(filtered);
      } else {
        // For objects
        const filtered = baseItems.filter((item: any) => {
          if (matchFields && matchFields.length > 0) {
            // Only search in specified fields
            return matchFields.some((field) =>
              String(item[field]).toLowerCase().includes(searchLower)
            );
          } else {
            // Search in all fields
            return Object.values(item).some((value) =>
              String(value).toLowerCase().includes(searchLower)
            );
          }
        });
        setFilteredItems(filtered);
      }
    },
    [isStringType, matchFields, type]
  );

  return {
    filteredItems,
    isLoading,
    setFilteredItems,
    setIsLoading,
    filterItems,
  };
};
