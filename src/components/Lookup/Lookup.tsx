import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { VirtualizedList } from '../VirtualizedList/VirtualizedList';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useFilteredItems } from '../../hooks/useFilteredItems';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { LookupPills, LookupInput } from './components';
import styles from './Lookup.module.less';

type SourceCallback<T> = (searchText: string) => Promise<T[]>;

/**
 * Narrower type constraint for object types
 * Ensures the generic T has proper object structure
 */
type ObjectItem = Record<string, any>;

export type DropdownPosition = 'auto' | 'below' | 'above' | 'left' | 'right';

export type LookupProps<T extends string | ObjectItem> = {
  /**
   * The source of items - can be a static list or a callback function
   * For callback: receives typed text and returns promise of items
   */
  // VirtualizedList-compatible property name. Supports array or async callback.
  items: T[] | SourceCallback<T>;

  /**
   * Currently selected value(s)
   */
  // VirtualizedList-compatible selection
  selected?: T | T[];

  /**
   * Callback when selection changes
   */
  onSelect?: (selected: T | T[]) => void;

  /**
   * Type of lookup - 'combobox' allows typing, 'dropdown' shows all items
   */
  type?: 'combobox' | 'dropdown';

  /**
   * Allow multiple selections (shows pills in input)
   */
  multipleSelect?: boolean;

  /**
   * CSS class name to append to list container
   */
  className?: string;

  /**
   * Key to use for object items (required for non-string types)
   * Used to identify unique items. Named `itemKey` to avoid React's reserved `key`.
   */
  itemKey?: keyof T;

  /**
   * Fields to match against when filtering (for typed objects)
   * If not specified, all fields are considered
   */
  matchFields?: (keyof T)[];

  /**
   * Renderer function for object items (required for non-string types)
   */
  renderer?: (item: T) => React.ReactNode;

  /**
   * Height of each item in the virtual list
   */
  rowHeight?: number;
  /**
   * Optional styles applied to the internal VirtualizedList container.
   */
  styles?: React.CSSProperties;

  /**
   * Dropdown placement. 'auto' tries below, then right, then left, then above based on available space.
   */
  dropdownPosition?: DropdownPosition;

  /**
   * Placeholder text for the input
   */
  placeholder?: string;

  /**
   * Maximum height of the dropdown list
   */
  maxHeight?: number;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Show separator lines between list items
   */
  showSeparator?: boolean;

  /**
   * Width of the input area - number (px) or 'auto' to fit content
   */
  inputWidth?: number | 'auto';

  /**
   * Width of the dropdown list - number (px) or 'auto' to match input
   */
  dropdownWidth?: number | 'auto';

  /**
   * Hide the magnifying glass icon in combobox mode
   */
  hideMagnifyingGlass?: boolean;

  /**
   * Debounce time in milliseconds for async callbacks
   * When set, delays the async callback execution until typing stops for the specified duration
   * Prevents excessive API calls while user is typing
   */
  debounceMs?: number;

  /**
   * Minimum number of characters required before triggering async search
   * Reduces server load by avoiding searches for partial/single-letter queries
   * Default: 0 (search on any input)
   */
  minSearchLength?: number;
};

export const Lookup = <T extends string | ObjectItem = string>(
{
  items,
  selected,
  onSelect,
  type = 'combobox',
  multipleSelect = false,
  className,
  itemKey,
  matchFields,
  renderer,
  rowHeight = 32,
  dropdownPosition = 'below',
  placeholder,
  maxHeight = 300,
  disabled = false,
  showSeparator = false,
  inputWidth,
  dropdownWidth,
  hideMagnifyingGlass = false,
  styles: listStyles,
  debounceMs,
  minSearchLength = 0,
}: LookupProps<T> ) => {
  const baseItems: any[] = useMemo(
    () => Array.isArray(items) ? (items as any[]) : [],
    [items]
  );
  const isCallback = typeof items === 'function';
  const isStringType = useMemo(
    () => baseItems.length > 0 && typeof baseItems[0] === 'string',
    [baseItems]
  );

  // State management
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayedSelected, setDisplayedSelected] = useState(selected);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [workingSelected, setWorkingSelected] = useState<any>(null); // Temporary selection for multiple select

  // Use filtered items hook
  const { filteredItems, setFilteredItems, filterItems } = useFilteredItems({
    items,
    isStringType,
    matchFields,
    type,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<any>(null);
  const displayValueRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [resolvedPosition, setResolvedPosition] = useState<DropdownPosition>('below');

  // Convert selected value to array for easier manipulation
  const selectedArray = useMemo(() => {
    if (!displayedSelected) return [];
    return Array.isArray(displayedSelected) ? displayedSelected : [displayedSelected];
  }, [displayedSelected]);

  // Get the active selection for multiple select (working or displayed)
  const activeSelectedArray = useMemo(() => {
    if (!multipleSelect) return selectedArray;
    const activeSelected = workingSelected ?? displayedSelected;
    if (!activeSelected) return [];
    return Array.isArray(activeSelected) ? activeSelected : [activeSelected];
  }, [multipleSelect, workingSelected, displayedSelected, selectedArray]);

  // Handle input change
  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value;
      setInputValue(value);
      setIsOpen(true);
      setFocusedIndex(-1);
      setError(null); // Clear previous errors

      // Only filter on input change for combobox, not dropdown
      if (type === 'dropdown') {
        return;
      }

      if (isCallback) {
        // Clear previous debounce timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        const executeCallback = async () => {
          // Cancel previous request if it's still pending
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }

          // Create new abort controller for this request
          abortControllerRef.current = new AbortController();
          const signal = abortControllerRef.current.signal;

          // Check minimum search length
          if (value.length < minSearchLength) {
            setFilteredItems([]);
            setIsLoading(false);
            return;
          }

          setIsLoading(true);
          try {
            const results = await (items as SourceCallback<any>)(value);
            
            // Check if request was aborted
            if (signal.aborted) {
              return;
            }
            
            // Validate callback returns an array
            if (!Array.isArray(results)) {
              throw new Error('Async callback must return an array of items');
            }
            
            // Validate array items match expected type
            if (results.length > 0) {
              const firstItem = results[0];
              const isString = typeof firstItem === 'string';
              const isObject = typeof firstItem === 'object' && firstItem !== null;
              
              if (!isString && !isObject) {
                throw new Error('Items must be strings or objects');
              }
            }
            
            await filterItems(value, results);
            
            // Auto-focus first result if we have items
            if (results.length > 0) {
              setFocusedIndex(0);
            }
          } catch (error) {
            // Ignore abort errors
            if (error instanceof Error && error.name === 'AbortError') {
              return;
            }
            
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Failed to load items. Please try again.';
            setError(errorMessage);
            setFilteredItems([]);
            console.error('Error fetching lookup items:', error);
          } finally {
            setIsLoading(false);
          }
        };

        if (debounceMs) {
          // Debounce the callback execution
          debounceTimeoutRef.current = setTimeout(executeCallback, debounceMs);
        } else {
          // Execute immediately if no debounce
          await executeCallback();
        }
      } else {
        await filterItems(value, baseItems);
      }
    },
    [isCallback, items, filterItems, baseItems, type, debounceMs, minSearchLength]
  );

  // Announce selection to screen readers
  const announceSelection = useCallback((item: any) => {
    if (!item) return;
    // Note: renderSelectedDisplay will be defined later, so we use a simple approach
    const announcement = Array.isArray(item) 
      ? `${item.length} items selected`
      : `Item selected`;
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('role', 'status');
    ariaLive.setAttribute('aria-live', 'polite');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.textContent = announcement;
    document.body.appendChild(ariaLive);
    setTimeout(() => ariaLive.remove(), 1000);
  }, []);

  // Handle item selection
  const handleSelectItem = useCallback(
    (selected: any) => {
      if (multipleSelect) {
        // Store in working state, don't update displayed yet
        setWorkingSelected(selected);
        onSelect?.(selected);
        setInputValue('');
      } else {
        // Single select: update immediately, close, and blur to show selected value
        setDisplayedSelected(selected);
        onSelect?.(selected);
        setInputValue('');
        setIsOpen(false);
        setIsFocused(false);
        // Announce selection to screen readers
        announceSelection(selected);
        // Blur input in next event loop to avoid race conditions
        setTimeout(() => {
          inputRef.current?.blur();
        }, 0);
      }
    },
    [multipleSelect, onSelect, announceSelection]
  );

  // Handle removing a selected item (for pills)
  const handleRemoveSelected = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!multipleSelect || selectedArray.length === 0) return;

      const newSelected = selectedArray.filter((_, i) => i !== index);
      const valueToSet = newSelected.length === 1 ? newSelected[0] : newSelected;
      setDisplayedSelected(valueToSet);
      onSelect?.(valueToSet);
    },
    [multipleSelect, selectedArray, onSelect]
  );

  // Handle clearing all selections
  const handleClearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!multipleSelect) return;
      setDisplayedSelected([]);
      onSelect?.([] as any);
      setInputValue('');
    },
    [multipleSelect, onSelect]
  );

  // Handle keyboard navigation
  const handleNavigate = useCallback(
    (_direction: 'up' | 'down', newIndex: number) => {
      setFocusedIndex(newIndex);
    },
    []
  );

  const handleKeyboardSelect = useCallback(
    (index: number) => {
      if (index >= 0 && index < filteredItems.length) {
        const item = filteredItems[index];
        if (multipleSelect) {
          const itemValue = isStringType ? item : (item as ObjectItem)[itemKey as keyof ObjectItem];
          const isAlreadySelected = activeSelectedArray.some((s) =>
            isStringType ? s === item : (s as ObjectItem)[itemKey as keyof ObjectItem] === itemValue
          );
          const newSelected = isAlreadySelected
            ? activeSelectedArray.filter((s) =>
                isStringType ? s !== item : (s as ObjectItem)[itemKey as keyof ObjectItem] !== itemValue
              )
            : [...activeSelectedArray, item];
          handleSelectItem(newSelected);
        } else {
          handleSelectItem(item);
        }
      }
    },
    [filteredItems, multipleSelect, isStringType, itemKey, activeSelectedArray, handleSelectItem]
  );

  const handleKeyboardClose = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.blur();
    // Commit working selections for multiple select
    if (multipleSelect && workingSelected !== null) {
      setDisplayedSelected(workingSelected);
      setWorkingSelected(null);
    }
  }, [multipleSelect, workingSelected]);

  const { handleKeyDown } = useKeyboardNavigation({
    isOpen,
    focusedIndex,
    itemCount: filteredItems.length,
    onOpen: () => {
      setIsOpen(true);
      setFocusedIndex(0);
    },
    onClose: handleKeyboardClose,
    onSelect: handleKeyboardSelect,
    onNavigate: handleNavigate,
    listRef,
  });

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
    setFocusedIndex(-1);
    setError(null); // Clear errors on focus
    // Initialize working selection with current selection for multiple select
    if (multipleSelect) {
      setWorkingSelected(displayedSelected);
    }
    if (!isCallback && !inputValue) {
      setFilteredItems(baseItems as any[]);
    }
  }, [isCallback, inputValue, baseItems, multipleSelect, displayedSelected]);

  // Handle blur - close dropdown and reset focus
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setIsOpen(false);
    // Commit working selections for multiple select
    if (multipleSelect && workingSelected !== null) {
      setDisplayedSelected(workingSelected);
      setWorkingSelected(null);
    }
  }, [multipleSelect, workingSelected]);

  // Handle clicking the displayed single value: toggle open/close
  const handleSingleValueClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      setIsFocused(false);
      inputRef.current?.blur();
    } else {
      setIsOpen(true);
      setIsFocused(true);
      // Use microtask queue for DOM operations
      Promise.resolve().then(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Handle click outside - close dropdown and reset focus
  const handleClickOutside = useCallback(() => {
    setIsOpen(false);
    setIsFocused(false);
    // Commit working selections for multiple select
    if (multipleSelect && workingSelected !== null) {
      setDisplayedSelected(workingSelected);
      setWorkingSelected(null);
    }
  }, [multipleSelect, workingSelected]);

  useClickOutside(containerRef, handleClickOutside);

  // Update displayed selected when prop changes
  useEffect(() => {
    setDisplayedSelected(selected);
  }, [selected]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Render selected value for display
  const renderSelectedDisplay = (item: any) => {
    if (isStringType) {
      return item;
    }
    return renderer ? renderer(item) : itemKey ? String(item[itemKey]) : String(item);
  };

  const hasContent = filteredItems && filteredItems.length > 0;
  const listHeight = Math.min(
    hasContent ? filteredItems.length * rowHeight : 0,
    maxHeight
  );

  // Resolve dropdown position based on available space when open
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const availableBottom = window.innerHeight - rect.bottom;
    const availableTop = rect.top;
    const availableRight = window.innerWidth - rect.right;
    const availableLeft = rect.left;
    // For horizontal positioning, dropdown starts at container top and extends down
    const availableFromTop = window.innerHeight - rect.top;

    const estimatedHeight = Math.min(listHeight || maxHeight, maxHeight);
    const estimatedWidth = dropdownWidth === 'auto'
      ? rect.width
      : typeof dropdownWidth === 'number'
        ? dropdownWidth
        : rect.width;

    const chooseAutoPosition = (): DropdownPosition => {
      // Prefer below if there's space
      if (availableBottom >= estimatedHeight) return 'below';
      
      // For horizontal positions, check if width fits AND if height fits from top of container down
      const canFitRight = availableRight >= estimatedWidth && availableFromTop >= estimatedHeight;
      const canFitLeft = availableLeft >= estimatedWidth && availableFromTop >= estimatedHeight;
      
      // If both sides fit, choose the one with more space
      if (canFitRight && canFitLeft) {
        return availableLeft > availableRight ? 'left' : 'right';
      }
      if (canFitRight) return 'right';
      if (canFitLeft) return 'left';
      
      // Try above if there's space
      if (availableTop >= estimatedHeight) return 'above';
      
      // Default to below even if it doesn't fit
      return 'below';
    };

    const next = dropdownPosition === 'auto' ? chooseAutoPosition() : dropdownPosition;
    setResolvedPosition(next);
  }, [isOpen, dropdownPosition, listHeight, maxHeight, dropdownWidth]);

  // Calculate container width style
  const containerWidthStyle = useMemo(() => {
    if (inputWidth === 'auto') {
      return { width: 'fit-content', minWidth: '90px' };
    } else if (typeof inputWidth === 'number') {
      return { width: `${inputWidth}px` };
    }
    return { width: '100%' };
  }, [inputWidth]);

  // Calculate dropdown width style
  const dropdownWidthStyle = useMemo(() => {
    if (dropdownWidth === 'auto') {
      return { width: 'fit-content', minWidth: '90px' };
    } else if (typeof dropdownWidth === 'number') {
      return { width: `${dropdownWidth}px` };
    }
    // Default: match container width
    return { width: '100%' };
  }, [dropdownWidth]);

  // Handle input box click
  const handleInputBoxClick = useCallback(() => {
    if (disabled) return;
    if (type === 'dropdown') {
      setIsOpen(!isOpen);
      setIsFocused(true);
      setFocusedIndex(-1);
      if (multipleSelect) {
        setWorkingSelected(displayedSelected);
      }
      if (!isCallback && !inputValue) {
        setFilteredItems(baseItems as any[]);
      }
    } else {
      inputRef.current?.focus();
    }
  }, [disabled, type, isOpen, multipleSelect, displayedSelected, isCallback, inputValue, baseItems]);

  // Determine if input should be hidden
  const shouldHideInput = useMemo(() => {
    return (multipleSelect && selectedArray.length > 0 && !isFocused) ||
           (!multipleSelect && selectedArray.length > 0 && !isFocused);
  }, [multipleSelect, selectedArray, isFocused]);

  // Determine if single value should be shown
  const shouldShowSingleValue = useMemo(() => {
    return !multipleSelect && selectedArray.length > 0 && (!isFocused || type === 'dropdown');
  }, [multipleSelect, selectedArray, isFocused, type]);

  // Determine if magnifying glass should show
  const shouldShowMagnifyingGlass = useMemo(() => {
    return type === 'combobox' && !hideMagnifyingGlass;
  }, [type, hideMagnifyingGlass]);

  // Determine if clear button should show
  const shouldShowClearButton = useMemo(() => {
    return multipleSelect && selectedArray.length > 0;
  }, [multipleSelect, selectedArray]);

  // Determine if dropdown arrow should show
  const shouldShowDropdownArrow = useMemo(() => {
    return type === 'dropdown';
  }, [type]);

  // Handle single value keydown
  const handleSingleValueKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSingleValueClick(e as any);
    }
  }, []);

  // Generate unique ID for this component instance for ARIA attributes
  const componentId = useMemo(() => `lookup-${Math.random().toString(36).substr(2, 9)}`, []);
  const listboxId = `${componentId}-listbox`;
  const errorId = `${componentId}-error`;

  // Determine if error state should be shown
  const shouldShowError = useMemo(() => {
    return error !== null && error !== '';
  }, [error]);

  // Get selected value for virtualized list (string type)
  const getStringListSelected = useMemo(() => {
    return multipleSelect
      ? (Array.isArray(workingSelected ?? displayedSelected) ? (workingSelected ?? displayedSelected) as string[] : [])
      : (typeof displayedSelected === 'string' ? displayedSelected : '');
  }, [multipleSelect, workingSelected, displayedSelected]);

  // Get selected value for virtualized list (object type)
  const getObjectListSelected = useMemo(() => {
    return multipleSelect
      ? (Array.isArray(workingSelected ?? displayedSelected) ? (workingSelected ?? displayedSelected) : [])
      : (Array.isArray(displayedSelected) ? (displayedSelected[0] ?? ({} as any)) : (displayedSelected ?? ({} as any)));
  }, [multipleSelect, workingSelected, displayedSelected]);

  // Get virtualized list styles
  const virtualizedListStyles = useMemo(() => {
    return { height: `${listHeight}px`, ...(listStyles || {}) };
  }, [listHeight, listStyles]);

  // Get input box className
  const inputBoxClassName = useMemo(() => {
    return `${styles.inputBox} ${type === 'dropdown' ? styles.dropdown : ''}`;
  }, [type]);

  // Get dropdown list className
  const dropdownListClassName = useMemo(() => {
    const positionClass =
      resolvedPosition === 'above'
        ? styles.above
        : resolvedPosition === 'right'
          ? styles.right
          : resolvedPosition === 'left'
            ? styles.left
            : '';
    return `${styles.dropdownList} ${positionClass} ${className || ''}`;
  }, [resolvedPosition, className]);

  // Get dropdown arrow className
  const dropdownArrowClassName = useMemo(() => {
    return `${styles.dropdownArrow} ${isOpen ? styles.open : ''}`;
  }, [isOpen]);

  return (
    <div 
      ref={containerRef}
      className={`${styles.lookupContainer} ${disabled ? styles.disabled : ''}`}
      style={containerWidthStyle}
    >
      <div className={styles.inputWrapper}>
        <div 
          className={`${inputBoxClassName} ${shouldShowError ? styles.error : ''}`}
          onClick={handleInputBoxClick}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-disabled={disabled}
          aria-describedby={shouldShowError ? errorId : undefined}
        >
          {/* Magnifying glass icon for combobox */}
          {shouldShowMagnifyingGlass && (
            <div className={styles.searchIcon}>
              🔍
            </div>
          )}

          {/* Display pills for multiple selections - only when not focused */}
          <LookupPills
            selectedArray={selectedArray}
            show={multipleSelect && selectedArray.length > 0 && !isFocused}
            renderItem={renderSelectedDisplay}
            onRemove={handleRemoveSelected}
          />

          {/* Display single selected value when not focused (or when dropdown type) */}
          {shouldShowSingleValue && (
            <div
              ref={displayValueRef}
              className={styles.singleValue}
              onClick={handleSingleValueClick}
              role="button"
              tabIndex={0}
              onKeyDown={handleSingleValueKeyDown}
            >
              {renderSelectedDisplay(selectedArray[0])}
            </div>
          )}

          {/* Input field - hidden for dropdown type, always in DOM otherwise */}
          {type !== 'dropdown' && (
            <LookupInput
              inputRef={inputRef}
              value={inputValue}
              placeholder={placeholder}
              hidden={shouldHideInput}
              disabled={disabled}
              isOpen={isOpen}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              listboxId={listboxId}
            />
          )}

          {/* Clear button for multiple select */}
          {shouldShowClearButton && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClearAll}
              aria-label="Clear all selections"
            >
              ✕
            </button>
          )}

          {/* Dropdown indicator */}
          {shouldShowDropdownArrow && (
            <div className={dropdownArrowClassName}>
              ▼
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && <div className={styles.loader}>⏳</div>}
        </div>

        {/* Error message */}
        {shouldShowError && (
          <div
            id={errorId}
            className={styles.errorMessage}
            role="alert"
            aria-live="assertive"
          >
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Available options"
          className={dropdownListClassName}
          style={{ maxHeight, ...dropdownWidthStyle }}
        >
          {isLoading ? (
            <div className={styles.loadingMessage}>Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className={styles.noResults}>No results found</div>
          ) : (
            isStringType ? (
              <VirtualizedList
                items={filteredItems as string[]}
                selected={getStringListSelected}
                multipleSelect={multipleSelect}
                onSelect={handleSelectItem as (selected: string | string[]) => void}
                rowHeight={rowHeight}
                styles={virtualizedListStyles}
                focusedIndex={focusedIndex}
                listRef={listRef}
                showSeparator={showSeparator}
              />
            ) : (
              <VirtualizedList<any>
                items={filteredItems}
                selected={getObjectListSelected}
                multipleSelect={multipleSelect}
                onSelect={handleSelectItem}
                rowHeight={rowHeight}
                styles={virtualizedListStyles}
                focusedIndex={focusedIndex}
                listRef={listRef}
                showSeparator={showSeparator}
                itemKey={itemKey as string | number | symbol}
                renderer={renderer || ((item: any) => <span>{itemKey ? String(item[itemKey]) : String(item)}</span>)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

Lookup.displayName = 'Lookup';
