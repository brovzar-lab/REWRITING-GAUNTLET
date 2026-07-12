import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneNavigator } from './SceneNavigator';
import { PassTray } from './PassTray';
import { useAppStore } from '../store/appStore';
import { EPPS_PASSES } from '../model/passes';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('SceneNavigator', () => {
  it('groups scenes under three act headers', () => {
    render(<SceneNavigator />);
    const acts = screen.getAllByRole('group');
    expect(acts).toHaveLength(3);
    expect(screen.getByText('ACT ONE')).toBeInTheDocument();
    expect(screen.getByText('ACT TWO')).toBeInTheDocument();
    expect(screen.getByText('ACT THREE')).toBeInTheDocument();
    expect(within(acts[1]).getAllByRole('button').length).toBe(5); // sc5..sc9
  });

  it('shows slug, scene number, and approximate page reference per scene', () => {
    render(<SceneNavigator />);
    const row = screen.getByRole('button', { name: /EXT\. CANAL SIETE - DAWN/ });
    expect(row).toHaveTextContent('6');
    expect(row).toHaveTextContent(/p\.\s*\d+/);
  });

  it('clicking a scene selects its heading element in the store', async () => {
    const user = userEvent.setup();
    render(<SceneNavigator />);
    await user.click(screen.getByRole('button', { name: /INT\. MUNICIPAL ARCHIVE - DAY/ }));
    expect(useAppStore.getState().selection).toEqual({ sceneId: 'sc7', elementId: 'sc7-e1' });
  });

  it('renders Spanish act headers when the app language is Spanish', () => {
    useAppStore.getState().setLang('es');
    render(<SceneNavigator />);
    expect(screen.getByText('PRIMER ACTO')).toBeInTheDocument();
  });
});

describe('PassTray', () => {
  it('renders the 11 Epps passes as chips in book order', () => {
    render(<PassTray />);
    const chips = screen.getAllByRole('button');
    expect(chips.map((c) => c.textContent)).toEqual(
      EPPS_PASSES.map((p) => expect.stringContaining(p.name.toUpperCase()) as unknown as string),
    );
  });

  it('clicking a chip activates that pass with aria-pressed', async () => {
    const user = userEvent.setup();
    render(<PassTray />);
    const chip = screen.getByRole('button', { name: /CHARACTER/i });
    await user.click(chip);
    expect(useAppStore.getState().activePassId).toBe('character');
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('arrow keys move focus between chips', async () => {
    const user = userEvent.setup();
    render(<PassTray />);
    const chips = screen.getAllByRole('button');
    chips[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(chips[1]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(chips[0]).toHaveFocus();
  });
});
