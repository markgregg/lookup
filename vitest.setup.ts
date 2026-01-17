import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

vi.mock('react-window', () => {
  const List = ({ rowCount, rowHeight, rowComponent: Row, rowProps, ref: listRef }: any) => {
    const children = Array.from({ length: rowCount }, (_, index) =>
      React.createElement(Row, { key: index, index, style: { height: rowHeight }, ...rowProps })
    );
    return React.createElement('div', { ref: listRef }, children);
  };
  return { List };
});
