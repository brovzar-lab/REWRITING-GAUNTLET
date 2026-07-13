import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from './Board';
import { EvidenceInspector } from '../panels/EvidenceInspector';
import { useAppStore } from '../store/appStore';

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

const frame = (sceneId: string) =>
  document.querySelector(`[data-card-frame="${sceneId}"]`) as HTMLElement;

describe('inline scene point editing on board cards', () => {
  it('clicking "No point yet" opens the inline editor, focused, with the book placeholder', async () => {
    const user = userEvent.setup();
    render(<Board />);
    await user.click(within(frame('sc2')).getByRole('button', { name: 'No point yet' }));
    const editor = screen.getByPlaceholderText('The point of this scene is…');
    expect(editor).toBeVisible();
    expect(editor).toHaveFocus();
  });

  it('Enter saves, closes the editor, turns the chip into a preview, and syncs the inspector', async () => {
    const user = userEvent.setup();
    useAppStore.getState().select({ sceneId: 'sc2', elementId: 'sc2-e5' });
    render(
      <>
        <Board />
        <EvidenceInspector />
      </>,
    );
    await user.click(within(frame('sc2')).getByRole('button', { name: 'No point yet' }));
    await user.keyboard('The wake reopens the ledger.{Enter}');

    expect(useAppStore.getState().scenePoints.sc2.point).toBe('The wake reopens the ledger.');
    expect(screen.queryByRole('dialog', { name: 'Scene point' })).not.toBeInTheDocument();
    const preview = within(frame('sc2')).getByRole('button', { name: /the wake reopens/i });
    expect(preview).toHaveFocus();
    // The inspector's Scene Point card shows the same value immediately.
    expect(screen.getByLabelText('Scene point', { selector: 'textarea' })).toHaveValue(
      'The wake reopens the ledger.',
    );
  });

  it('Escape cancels without saving and returns focus to the chip', async () => {
    const user = userEvent.setup();
    render(<Board />);
    const chip = within(frame('sc2')).getByRole('button', { name: 'No point yet' });
    await user.click(chip);
    await user.keyboard('junk that must not be saved{Escape}');

    expect(useAppStore.getState().scenePoints.sc2?.point ?? '').toBe('');
    expect(screen.queryByPlaceholderText('The point of this scene is…')).not.toBeInTheDocument();
    expect(within(frame('sc2')).getByRole('button', { name: 'No point yet' })).toHaveFocus();
  });

  it('clicking away saves the draft (save on blur)', async () => {
    const user = userEvent.setup();
    render(<Board />);
    await user.click(within(frame('sc2')).getByRole('button', { name: 'No point yet' }));
    await user.keyboard('Saved by blur.');
    await user.click(screen.getByText('Story Board'));

    expect(useAppStore.getState().scenePoints.sc2.point).toBe('Saved by blur.');
    expect(screen.queryByPlaceholderText('The point of this scene is…')).not.toBeInTheDocument();
  });

  it('the verdict set from the card popover updates the store, the card marker, and the inspector', async () => {
    const user = userEvent.setup();
    const sc3 = useAppStore.getState().screenplay.scenes.find((s) => s.id === 'sc3')!;
    useAppStore.getState().select({ sceneId: 'sc3', elementId: sc3.elements[0].id });
    render(
      <>
        <Board />
        <EvidenceInspector />
      </>,
    );
    await user.click(within(frame('sc3')).getByRole('button', { name: 'No point yet' }));
    const pop = screen.getByRole('dialog', { name: 'Scene point' });
    await user.click(within(pop).getByRole('button', { name: /cut candidate/i }));

    expect(useAppStore.getState().scenePoints.sc3.verdict).toBe('cut_candidate');
    // Small but wordy marker on the card itself — never color alone.
    expect(frame('sc3')).toHaveTextContent('Cut candidate');
    // The inspector's verdict button reflects it immediately.
    const inspector = screen.getByLabelText('Evidence & Notes', { selector: 'aside' });
    expect(within(inspector).getByRole('button', { name: /cut candidate/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
