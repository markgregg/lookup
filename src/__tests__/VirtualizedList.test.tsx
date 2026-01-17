import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VirtualizedList } from '../components/VirtualizedList/VirtualizedList';

afterEach(() => {
  cleanup();
});

describe('VirtualizedList', () => {
  it('calls onSelect for single string list', async () => {
    const onSelect = vi.fn();
    render(
      <VirtualizedList
        items={['Alpha', 'Beta']}
        selected=""
        onSelect={onSelect}
      />
    );

    fireEvent.mouseDown(screen.getByText('Alpha'));
    expect(onSelect).toHaveBeenCalledWith('Alpha');
  });

  it('adds selection in multiple object list', async () => {
    const onSelect = vi.fn();
    const items = [
      { id: 1, label: 'One' },
      { id: 2, label: 'Two' },
    ];

    render(
      <VirtualizedList
        items={items}
        selected={[] as typeof items}
        multipleSelect
        onSelect={onSelect}
        itemKey="id"
        renderer={(item) => <span>{item.label}</span>}
      />
    );

    fireEvent.mouseDown(screen.getByText('Two'));
    expect(onSelect).toHaveBeenCalledWith([items[1]]);
  });

  it('renders checkboxes when multipleSelect is true', () => {
    const items = ['A', 'B'];
    render(
      <VirtualizedList<string>
        items={items}
        selected={[] as string[]}
        multipleSelect
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('toggles selection off when clicking selected item in multiple mode', () => {
    const onSelect = vi.fn();

    const items = ['A', 'B'];
    render(
      <VirtualizedList<string>
        items={items}
        selected={['A'] as string[]}
        multipleSelect
        onSelect={onSelect}
      />
    );

    const [firstA] = screen.getAllByText('A');
    fireEvent.mouseDown(firstA);
    expect(onSelect).toHaveBeenCalledWith([]);
  });
});
