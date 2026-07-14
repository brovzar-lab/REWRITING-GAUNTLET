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

describe('direct in-card scene point editing (no popover)', () => {
  it('clicking the dotted chip turns it into an editable field inside the card itself', async () => {
    const user = userEvent.setup();
    render(<Board />);
    await user.click(within(frame('sc2')).getByRole('button', { name: 'No point yet' }));

    // The editor lives inside the card frame — in place of the chip.
    const editor = within(frame('sc2')).getByPlaceholderText('The point of this scene is…');
    expect(editor).toBeVisible();
    expect(editor).toHaveFocus();
    // No popover, no floating box, no dialog. Ever.
    expect(document.querySelector('.sp-card-pop')).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Enter saves in place, shows the preview on the card, and syncs the inspector', async () => {
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
    expect(within(frame('sc2')).queryByPlaceholderText('The point of this scene is…')).not.toBeInTheDocument();
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
    await user.click(within(frame('sc2')).getByRole('button', { name: 'No point yet' }));
    await user.keyboard('junk that must not be saved{Escape}');

    expect(useAppStore.getState().scenePoints.sc2?.point ?? '').toBe('');
    expect(within(frame('sc2')).queryByPlaceholderText('The point of this scene is…')).not.toBeInTheDocument();
    expect(within(frame('sc2')).getByRole('button', { name: 'No point yet' })).toHaveFocus();
  });

  it('clicking away saves the draft (save on blur)', async () => {
    const user = userEvent.setup();
    render(<Board />);
    await user.click(within(frame('sc2')).getByRole('button', { name: 'No point yet' }));
    await user.keyboard('Saved by blur.');
    await user.click(screen.getByText('Story Board'));

    expect(useAppStore.getState().scenePoints.sc2.point).toBe('Saved by blur.');
    expect(within(frame('sc2')).queryByPlaceholderText('The point of this scene is…')).not.toBeInTheDocument();
  });

  it('typing in the inspector mirrors onto the card, and its verdict shows as a card marker', async () => {
    const user = userEvent.setup();
    const sc3 = useAppStore.getState().screenplay.scenes.find((s) => s.id === 'sc3')!;
    useAppStore.getState().select({ sceneId: 'sc3', elementId: sc3.elements[0].id });
    render(
      <>
        <Board />
        <EvidenceInspector />
      </>,
    );
    const inspector = screen.getByLabelText('Evidence & Notes', { selector: 'aside' });
    await user.type(
      within(inspector).getByLabelText('Scene point', { selector: 'textarea' }),
      'A drive-by of the cemetery.',
    );
    expect(frame('sc3')).toHaveTextContent('A drive-by of the cemetery.');

    await user.click(within(inspector).getByRole('button', { name: /cut candidate/i }));
    expect(useAppStore.getState().scenePoints.sc3.verdict).toBe('cut_candidate');
    // Small but wordy marker on the card itself — never color alone.
    expect(frame('sc3')).toHaveTextContent('Cut candidate');
  });
});
