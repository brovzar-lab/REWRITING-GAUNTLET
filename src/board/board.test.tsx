import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board, resolveDragEnd } from './Board';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('board legend', () => {
  it('explains card colors and connection line styles in words', () => {
    render(<Board />);
    const legend = screen.getByLabelText('Board legend');
    for (const word of ['Plot', 'Set-up', 'Opposition', 'Resolution', 'Relationship']) {
      expect(within(legend).getAllByText(word).length).toBeGreaterThanOrEqual(1);
    }
    expect(within(legend).getByText('Set-up / pay-off')).toBeInTheDocument();
    expect(within(legend).getByText('Escalation')).toBeInTheDocument();
  });
});

describe('Board', () => {
  it('groups cards by act with act headers in side dock', () => {
    useAppStore.getState().setBoardDock('side');
    render(<Board />);
    const headers = screen.getAllByRole('heading', { level: 3 });
    expect(headers.map((h) => h.textContent)).toEqual(
      expect.arrayContaining(['ACT ONE', 'ACT TWO', 'ACT THREE']),
    );
  });

  it('renders one card per scene with slug, number, and a story-function text label', () => {
    render(<Board />);
    const cards = screen.getAllByRole('button', { name: /Scene \d+/ });
    expect(cards).toHaveLength(16);
    const card6 = screen.getByRole('button', { name: /Scene 6/ });
    expect(card6).toHaveTextContent('EXT. CANAL SIETE - DAWN');
    expect(card6).toHaveTextContent('Opposition'); // color never carries meaning alone
  });

  it('clicking a card selects the scene in the store', async () => {
    const user = userEvent.setup();
    render(<Board />);
    await user.click(screen.getByRole('button', { name: /Scene 4/ }));
    expect(useAppStore.getState().selection).toEqual({ sceneId: 'sc4', elementId: 'sc4-e1' });
  });

  it('marks the selected scene card with a non-color indicator', () => {
    useAppStore.getState().select({ sceneId: 'sc4', elementId: 'sc4-e1' });
    render(<Board />);
    const card = screen.getByRole('button', { name: /Scene 4/ });
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(card.querySelector('.card-selected-marker')).not.toBeNull();
  });

  it('renders one connection per sample relationship with kind label and distinct style', () => {
    render(<Board />);
    const lines = document.querySelectorAll('[data-connection-id]');
    expect(lines).toHaveLength(7);
    expect(document.querySelector('[data-connection-kind="setup_payoff"]')).not.toBeNull();
    expect(document.querySelector('[data-connection-kind="escalation"]')).not.toBeNull();
    expect(document.querySelector('[data-connection-kind="relationship"]')).not.toBeNull();
  });
});

describe('resolveDragEnd', () => {
  it('reorders scenes when a card is dropped on another card', () => {
    resolveDragEnd('sc1', 'sc3');
    const scenes = useAppStore.getState().screenplay.scenes;
    expect(scenes.map((s) => s.id).slice(0, 3)).toEqual(['sc2', 'sc3', 'sc1']);
    scenes.forEach((s, i) => expect(s.number).toBe(i + 1));
  });

  it('does nothing when dropped on itself or nothing', () => {
    const before = useAppStore.getState().screenplay.scenes.map((s) => s.id);
    resolveDragEnd('sc1', 'sc1');
    resolveDragEnd('sc1', null);
    expect(useAppStore.getState().screenplay.scenes.map((s) => s.id)).toEqual(before);
  });
});

describe('scene point chip on board cards', () => {
  const frame = (sceneId: string) =>
    document.querySelector(`[data-card-frame="${sceneId}"]`) as HTMLElement;

  it('every card says "No point yet" until its scene point is stated, then shows a preview', () => {
    const { rerender } = render(<Board />);
    expect(frame('sc2')).toHaveTextContent('No point yet');

    useAppStore.getState().updateScenePoint('sc2', { point: 'The wake reopens the ledger.' });
    rerender(<Board />);
    expect(frame('sc2')).not.toHaveTextContent('No point yet');
    expect(frame('sc2')).toHaveTextContent('The wake reopens the ledger.');
    // The others still carry the chip.
    expect(frame('sc3')).toHaveTextContent('No point yet');
  });
});
