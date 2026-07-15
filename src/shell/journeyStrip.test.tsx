import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JourneyStrip } from './JourneyStrip';
import { useAppStore } from '../store/appStore';

describe('JourneyStrip', () => {
  beforeEach(() => {
    useAppStore.getState().resetToSample();
  });

  it('renders the eight development stages, starting at Private read', () => {
    render(<JourneyStrip />);
    const nav = screen.getByRole('navigation', { name: 'Rewrite journey' });
    // The Script stage is project management (File menu / project chip), not a
    // development stage: once a script is open the journey begins with Read.
    expect(nav.querySelectorAll('.js-stage')).toHaveLength(8);
    expect(nav.querySelector('.js-stage .js-name')?.textContent).toMatch(/Private read/);
    // Sample doc is open, read not complete → Private read is current.
    expect(screen.getByRole('button', { name: /Private read/ })).toHaveAttribute('aria-current', 'step');
  });

  it('stages are never locked: clicking Game plan opens the game plan panel', async () => {
    render(<JourneyStrip />);
    await userEvent.click(screen.getByRole('button', { name: /Game plan/ }));
    expect(useAppStore.getState().rightWorkspace).toBe('gameplan');
  });

  it('shows one contextual continue action', () => {
    render(<JourneyStrip />);
    expect(screen.getByRole('button', { name: 'Start your private read' })).toBeInTheDocument();
  });
});
