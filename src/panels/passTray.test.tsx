import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
