import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopBar } from './TopBar';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('professional top toolbar', () => {
  it('shows the save state and flips to Saving while a write is pending', () => {
    render(<TopBar />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    act(() => {
      useAppStore.getState().setSaveState('saving');
    });
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    act(() => {
      useAppStore.getState().setSaveState('saved');
    });
  });

  it('hosts the revision set control', () => {
    render(<TopBar />);
    expect(screen.getByRole('button', { name: 'Start revision set' })).toBeInTheDocument();
  });

  it('the revision dropdown does not imply an active set before one starts', async () => {
    const user = userEvent.setup();
    render(<TopBar />);
    const select = screen.getByLabelText('Revision set') as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(screen.getByTestId('rev-start')).toBeDisabled();
    await user.selectOptions(select, 'Blue');
    expect(screen.getByTestId('rev-start')).toBeEnabled();
  });

  it('appearance select switches the theme', async () => {
    const user = userEvent.setup();
    render(<TopBar />);
    await user.selectOptions(screen.getByLabelText('Appearance'), 'day');
    expect(useAppStore.getState().theme).toBe('day');
  });
});
