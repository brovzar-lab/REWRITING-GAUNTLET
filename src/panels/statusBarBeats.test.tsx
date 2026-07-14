import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusBar } from './StatusBar';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('marking set-ups and pay-offs directly on the selected line', () => {
  it('marks the selected line as a set-up, and reflects it as pressed', async () => {
    const user = userEvent.setup();
    useAppStore.getState().select({ sceneId: 'sc1', elementId: 'sc1-e2' });
    render(<StatusBar />);
    const setup = screen.getByRole('button', { name: /mark set-up|set-up/i });
    await user.click(setup);
    expect(useAppStore.getState().storyBeats.find((b) => b.elementId === 'sc1-e2')).toMatchObject({
      kind: 'setup',
    });
    expect(setup).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches a line from set-up to pay-off', async () => {
    const user = userEvent.setup();
    useAppStore.getState().select({ sceneId: 'sc1', elementId: 'sc1-e2' });
    render(<StatusBar />);
    await user.click(screen.getByRole('button', { name: /set-up/i }));
    await user.click(screen.getByRole('button', { name: /pay-off/i }));
    expect(useAppStore.getState().storyBeats.find((b) => b.elementId === 'sc1-e2')).toMatchObject({
      kind: 'payoff',
    });
  });

  it('the mark controls are disabled without a selected line — no dead UI', () => {
    useAppStore.getState().select(null);
    render(<StatusBar />);
    expect(screen.getByRole('button', { name: /set-up/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /pay-off/i })).toBeDisabled();
  });
});
