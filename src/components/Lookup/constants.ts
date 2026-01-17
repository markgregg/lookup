/**
 * Magic values and constants used across the Lookup component
 */

// Colors
export const COLORS = {
  BORDER_DEFAULT: '#e0e0e0',
  BORDER_FOCUS: '#4a90e2',
  BACKGROUND_DROPDOWN: '#f5f5f5',
  BACKGROUND_INPUT: '#fff',
  SEARCH_ICON_COLOR: '#666',
  PILL_BACKGROUND: '#e3f2fd',
  PILL_BORDER: '#90caf9',
  PILL_TEXT: '#1565c0',
  DROPDOWN_SHADOW: 'rgba(0, 0, 0, 0.15)',
  TEXT_PRIMARY: '#333',
  TEXT_SECONDARY: '#999',
  TEXT_MUTED: '#666',
} as const;

// Sizes
export const SIZES = {
  INPUT_HEIGHT: 32,
  ICON_SIZE: 20,
  PADDING_HORIZONTAL: 8,
  PADDING_VERTICAL_ITEM: 2,
  PADDING_HORIZONTAL_ITEM: 6,
  BORDER_RADIUS: 4,
  MAX_HEIGHT_DEFAULT: 300,
  ROW_HEIGHT_DEFAULT: 32,
  MEASURED_VALUE_PADDING: 60, // Search icon + padding
  PILL_MAX_WIDTH: 150,
  MIN_INPUT_WIDTH: 90,
  MIN_WIDTH_ZERO: 0,
} as const;

// Z-index
export const Z_INDEX = {
  DROPDOWN: 1000,
} as const;

// Timing
export const TIMING = {
  TRANSITION_DURATION: '0.2s',
  SEARCH_DEBOUNCE_MS: 0, // No debounce by default
} as const;

// CSS classes and selectors
export const CSS = {
  SEPARATOR_WIDTH: 90, // percentage
} as const;

// Animation
export const ANIMATION = {
  SPIN_DURATION: '1s',
} as const;
