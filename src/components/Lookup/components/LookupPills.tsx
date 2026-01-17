import React, { useRef, useEffect, useState } from 'react';
import styles from '../Lookup.module.less';

export interface LookupPillsProps<T> {
  /**
   * Array of selected items to display as pills
   */
  selectedArray: T[];

  /**
   * Whether pills should be shown (when not focused)
   */
  show: boolean;

  /**
   * Function to render a single item as a string/node
   */
  renderItem: (item: T) => React.ReactNode;

  /**
   * Callback when the remove button (×) is clicked
   */
  onRemove: (index: number, e: React.MouseEvent) => void;
}

/**
 * Displays selected items as removable pills/tags
 */
export const LookupPills = <T extends any>({
  selectedArray,
  show,
  renderItem,
  onRemove,
}: LookupPillsProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (!show || selectedArray.length === 0) {
      setShowSummary(false);
      return;
    }

    const checkOverflow = () => {
      const container = containerRef.current;
      if (!container) return;

      // Use requestAnimationFrame to ensure DOM has rendered
      requestAnimationFrame(() => {
        // Check if content is scrollable (overflow)
        const hasOverflow = container.scrollWidth > container.clientWidth;
        setShowSummary(hasOverflow);
      });
    };

    // Small delay to ensure pills are rendered first
    const timer = setTimeout(checkOverflow, 0);

    // Also check on window resize
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [show, selectedArray]);

  if (!show || selectedArray.length === 0) {
    return null;
  }

  if (showSummary) {
    return (
      <div className={styles.pills}>
        <div className={styles.summaryPill}>
          {selectedArray.length} selected item{selectedArray.length !== 1 ? 's' : ''}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.pills}>
      {selectedArray.map((item, index) => (
        <div key={index} className={styles.pill}>
          <span>{renderItem(item)}</span>
          <button
            className={styles.pillRemove}
            onClick={(e) => onRemove(index, e)}
            aria-label="Remove selection"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

LookupPills.displayName = 'LookupPills';
