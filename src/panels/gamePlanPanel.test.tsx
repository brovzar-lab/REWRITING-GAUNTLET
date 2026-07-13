import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GamePlanPanel } from './GamePlanPanel';
import { InspectorTabs } from './InspectorTabs';
import { useAppStore } from '../store/appStore';
import { EPPS_PASSES } from '../model/passes';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('the Game plan inspector tab', () => {
  it('is a real third tab that opens the Game Plan panel', async () => {
    const user = userEvent.setup();
    render(<InspectorTabs />);
    const tab = screen.getByRole('tab', { name: /game plan/i });
    await user.click(tab);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: /objective/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /compass/i })).toBeInTheDocument();
  });
});

describe('Objective section', () => {
  it('teaches with the statement-of-intent empty state and saves what the writer types', async () => {
    const user = userEvent.setup();
    render(<GamePlanPanel />);
    const intent = screen.getByLabelText(/statement of intent/i);
    expect(intent).toHaveAttribute(
      'placeholder',
      'Write one sentence: what must this rewrite accomplish?',
    );
    await user.type(intent, 'Earn the ending.');
    expect(useAppStore.getState().gamePlan.statementOfIntent).toBe('Earn the ending.');
  });

  it('labels the two non-book fields as Studio extensions', () => {
    render(<GamePlanPanel />);
    const chips = screen.getAllByText('EXT');
    expect(chips.length).toBe(2);
    for (const chip of chips) {
      expect(chip).toHaveAttribute('title', "Studio extension — not from Epps's book");
    }
    expect(screen.getByLabelText(/target audience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/emotional truth/i)).toBeInTheDocument();
  });

  it('lists all eleven passes as a reorderable priority list in book order by default', () => {
    render(<GamePlanPanel />);
    const list = screen.getByRole('list', { name: /pass priorities/i });
    const items = list.querySelectorAll('li');
    expect(items.length).toBe(EPPS_PASSES.length);
    expect(items[0].textContent).toContain('Foundation');
    expect(items[10].textContent).toContain('Polish');
  });
});

describe('Compass section', () => {
  it('links the ticking clock to the exact selected line and jumps back on click', async () => {
    const user = userEvent.setup();
    useAppStore.getState().select({ sceneId: 'sc2', elementId: 'sc2-e5' });
    render(<GamePlanPanel />);
    await user.click(screen.getByRole('button', { name: /link current line/i }));
    expect(useAppStore.getState().gamePlan.compass.tickingClockAnchor).toEqual({
      sceneId: 'sc2',
      elementId: 'sc2-e5',
    });

    useAppStore.getState().select(null);
    await user.click(screen.getByRole('button', { name: /established at/i }));
    expect(useAppStore.getState().selection).toEqual({ sceneId: 'sc2', elementId: 'sc2-e5' });
  });

  it('the link button is visibly disabled without a selected line', () => {
    useAppStore.getState().select(null);
    render(<GamePlanPanel />);
    expect(screen.getByRole('button', { name: /link current line/i })).toBeDisabled();
  });

  it('a motif collects exact element occurrences and each occurrence jumps to its line', async () => {
    const user = userEvent.setup();
    useAppStore.getState().select({ sceneId: 'sc2', elementId: 'sc2-e5' });
    render(<GamePlanPanel />);
    await user.type(screen.getByLabelText(/motif name/i), 'Herons');
    await user.click(screen.getByRole('button', { name: /add motif/i }));
    await user.click(screen.getByRole('button', { name: /mark current line/i }));

    const motif = useAppStore.getState().gamePlan.compass.motifs[0];
    expect(motif.name).toBe('Herons');
    expect(motif.occurrences).toEqual([{ sceneId: 'sc2', elementId: 'sc2-e5' }]);

    useAppStore.getState().select(null);
    await user.click(screen.getByRole('button', { name: 'Scene 2' }));
    expect(useAppStore.getState().selection).toEqual({ sceneId: 'sc2', elementId: 'sc2-e5' });
  });
});
