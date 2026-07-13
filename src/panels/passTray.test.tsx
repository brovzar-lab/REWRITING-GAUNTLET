import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassTray } from './PassTray';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('pass tray run states', () => {
  it('chips carry their run state for screen readers and the eye', () => {
    useAppStore.getState().setPassRunState('character', 'reviewing');
    useAppStore.getState().setPassRunState('polish', 'complete');
    render(<PassTray />);
    expect(screen.getByRole('button', { name: /Character.*Reviewing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Polish.*Complete/i })).toBeInTheDocument();
    // Untouched passes stay unadorned.
    expect(screen.getByRole('button', { name: /^1 Foundation/i })).not.toHaveAttribute('data-run-state');
  });
});

describe('active pass detail band', () => {
  it('shows no detail band when no pass is active', () => {
    render(<PassTray />);
    expect(screen.queryByLabelText('Active pass detail')).not.toBeInTheDocument();
  });

  it('activating a pass shows focus, goals, notes, status, and Open pass', async () => {
    const user = userEvent.setup();
    render(<PassTray />);
    await user.click(screen.getByRole('button', { name: /^2 Character/i }));
    const detail = screen.getByLabelText('Active pass detail');
    expect(detail).toBeInTheDocument();
    expect(screen.getByText('Focus')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
    // Before any diagnosis there are no proposals to count: the status shows
    // the run state alone, never "0 of 0 proposals resolved".
    expect(screen.queryByText(/0 of 0/)).not.toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });

  it('Open pass switches the inspector to the pass workspace tab', async () => {
    const user = userEvent.setup();
    render(<PassTray />);
    await user.click(screen.getByRole('button', { name: /^2 Character/i }));
    useAppStore.getState().setInspectorTab('evidence');
    await user.click(screen.getByRole('button', { name: 'Open pass' }));
    expect(useAppStore.getState().inspectorTab).toBe('pass');
    expect(useAppStore.getState().activePassId).toBe('character');
  });
});
