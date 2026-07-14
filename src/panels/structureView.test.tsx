import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StructureView } from './StructureView';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

const setBeat = (kind: 'setup' | 'payoff', sceneId: string, elementId: string) =>
  useAppStore.getState().setStoryBeat(kind, sceneId, elementId);
const beatId = (elementId: string) =>
  useAppStore.getState().storyBeats.find((b) => b.elementId === elementId)!.id;

describe('the Set-Up Map in full-board mode', () => {
  it('teaches with an empty state when nothing is marked yet — no dead UI', () => {
    render(<StructureView />);
    expect(screen.getByText(/mark a line as a set-up or a pay-off/i)).toBeInTheDocument();
  });

  it('shows a paired set-up/pay-off in order as OK, and jumps to the exact line on click', async () => {
    const user = userEvent.setup();
    setBeat('setup', 'sc1', 'sc1-e2');
    setBeat('payoff', 'sc3', 'sc3-e1');
    useAppStore.getState().pairBeats(beatId('sc1-e2'), beatId('sc3-e1'));
    render(<StructureView />);

    const map = screen.getByRole('list', { name: 'Set-Up / Pay-off Map' });
    const row = within(map).getByRole('listitem');
    expect(row).toHaveTextContent(/OK/);
    await user.click(within(row).getByRole('button', { name: /set-up.*scene 1/i }));
    expect(useAppStore.getState().selection).toEqual({ sceneId: 'sc1', elementId: 'sc1-e2' });
  });

  it('labels a reversed pair as a late set-up (pay-off before set-up)', () => {
    setBeat('setup', 'sc3', 'sc3-e1');
    setBeat('payoff', 'sc1', 'sc1-e2');
    useAppStore.getState().pairBeats(beatId('sc3-e1'), beatId('sc1-e2'));
    render(<StructureView />);
    const map = screen.getByRole('list', { name: 'Set-Up / Pay-off Map' });
    expect(within(map).getByRole('listitem')).toHaveTextContent(/late set-up/i);
  });

  it('shows unpaid set-ups and orphan pay-offs with words, not color alone', () => {
    setBeat('setup', 'sc1', 'sc1-e2');
    setBeat('payoff', 'sc2', 'sc2-e1');
    render(<StructureView />);
    const rows = screen.getAllByRole('listitem');
    const text = rows.map((r) => r.textContent).join(' ');
    expect(text).toMatch(/unpaid set-up/i);
    expect(text).toMatch(/orphan pay-off/i);
  });

  it('pairs an unpaid set-up with an orphan pay-off from the map', async () => {
    const user = userEvent.setup();
    setBeat('setup', 'sc1', 'sc1-e2');
    setBeat('payoff', 'sc3', 'sc3-e1');
    render(<StructureView />);
    // The unpaid set-up row offers a pairing control listing the orphan pay-off.
    const pairSelect = screen.getByLabelText(/pair with a pay-off/i);
    await user.selectOptions(pairSelect, beatId('sc3-e1'));
    expect(useAppStore.getState().storyBeats.find((b) => b.elementId === 'sc1-e2')!.pairedWith).toBe(
      beatId('sc3-e1'),
    );
  });
});
