import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Lookup } from '../components/Lookup/Lookup';

afterEach(() => {
  cleanup();
});

describe('Lookup combobox behavior', () => {
  it('selects an item and closes for single-select combobox', async () => {
    const onSelect = vi.fn();

    render(
      <Lookup
        items={['Alpha', 'Beta']}
        onSelect={onSelect}
        placeholder="Search"
      />
    );

    const input = screen.getByPlaceholderText('Search');
    await userEvent.click(input);

    const option = await screen.findByText('Alpha');
    fireEvent.mouseDown(option);

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith('Alpha'));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('keeps dropdown open for multi-select combobox and commits on close', async () => {
    const onSelect = vi.fn();

    render(
      <Lookup
        items={['Alpha', 'Beta']}
        multipleSelect
        onSelect={onSelect}
        placeholder="Search"
      />
    );

    const [input] = screen.getAllByPlaceholderText('Search');
    await userEvent.click(input);

    const option = await screen.findByText('Beta');
    fireEvent.mouseDown(option);

    expect(onSelect).toHaveBeenLastCalledWith(['Beta']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    await userEvent.click(outside);

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(await screen.findByText('Beta')).toBeInTheDocument();
  });
});

describe('Lookup dropdown behavior', () => {
  it('selects an item and closes for single-select dropdown', async () => {
    const onSelect = vi.fn();

    render(
      <Lookup
        type="dropdown"
        items={['One', 'Two']}
        onSelect={onSelect}
        placeholder="Choose"
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    const option = await screen.findByText('Two');
    fireEvent.mouseDown(option);

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith('Two'));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('keeps dropdown open for multi-select dropdown until closed manually', async () => {
    const onSelect = vi.fn();

    render(
      <Lookup
        type="dropdown"
        items={['One', 'Two']}
        multipleSelect
        onSelect={onSelect}
        placeholder="Choose"
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    const option = await screen.findByText('One');
    fireEvent.mouseDown(option);

    expect(onSelect).toHaveBeenLastCalledWith(['One']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Close manually by clicking trigger again
    await userEvent.click(trigger);
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });
});

describe('Lookup async behavior', () => {
  it('honors minSearchLength before calling async source', async () => {
    const source = vi.fn().mockResolvedValue(['Alpha']);

    render(
      <Lookup
        items={source}
        minSearchLength={2}
        placeholder="Type"
      />
    );

    const input = screen.getByPlaceholderText('Type');
    await userEvent.type(input, 'A');
    expect(source).not.toHaveBeenCalled();

    await userEvent.type(input, 'B');
    await waitFor(() => expect(source).toHaveBeenCalledTimes(1));
  });

  it('shows error message when async source fails type validation', async () => {
    const badSource = vi.fn().mockResolvedValue('not-an-array' as any);

    render(
      <Lookup
        items={badSource}
        placeholder="Async"
      />
    );

    const input = screen.getByPlaceholderText('Async');
    await userEvent.type(input, 'abc');

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('must return an array');
  });
});
