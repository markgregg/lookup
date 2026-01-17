import React from 'react';
import styles from '../Lookup.module.less';

export interface LookupInputProps {
  /**
   * Current input value
   */
  value: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether the input is hidden (used for multiple select with pills showing)
   */
  hidden: boolean;

  /**
   * Whether the input is disabled
   */
  disabled: boolean;

  /**
   * Whether the dropdown is open
   */
  isOpen: boolean;

  /**
   * Ref to the input element
   */
  inputRef: React.RefObject<HTMLInputElement | null>;

  /**
   * Callback when input value changes
   */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Callback when input gains focus
   */
  onFocus: () => void;

  /**
   * Callback when input loses focus
   */
  onBlur: () => void;

  /**
   * Callback when key is pressed
   */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  /**
   * ID for aria-controls on parent
   */
  listboxId?: string;
}

/**
 * Lookup input field component
 */
export const LookupInput = React.forwardRef<HTMLInputElement, LookupInputProps>(
  (
    {
      value,
      placeholder,
      hidden,
      disabled,
      isOpen,
      inputRef,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      listboxId,
    }
  ) => {
    const hiddenStyles = hidden
      ? {
          position: 'absolute' as const,
          opacity: 0,
          pointerEvents: 'none' as const,
          width: '1px',
          height: '1px',
          padding: 0,
          margin: 0,
        }
      : {};

    const keyboardHelpText = `Use arrow keys to navigate, Enter to select, Escape to close. ${
      !isOpen ? 'Press arrow down to open list.' : ''
    }`;

    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={styles.input}
        style={hiddenStyles}
        disabled={disabled}
        autoComplete="off"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={`${placeholder || 'Search'} input. ${keyboardHelpText}`}
        role="combobox"
      />
    );
  }
);

LookupInput.displayName = 'LookupInput';
