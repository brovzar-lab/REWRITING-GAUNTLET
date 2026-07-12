import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryDialog } from './HistoryDialog';
import { useAppStore, elementText } from '../store/appStore';
import { db } from '../store/db';

beforeEach(async () => {
  await db.snapshots.clear();
  useAppStore.getState().resetToSample();
  useAppStore.getState().setHistoryOpen(true);
});

describe('snapshot history', () => {
  it('says how snapshots happen when there are none yet', async () => {
    render(<HistoryDialog />);
    await waitFor(() => expect(screen.getByText(/no snapshots yet/i)).toBeInTheDocument());
  });

  it('lists snapshots across documents, newest first', async () => {
    await useAppStore.getState().takeSnapshot('Before import: LAS GARZAS');
    await useAppStore.getState().takeSnapshot('After Character pass');
    render(<HistoryDialog />);
    await waitFor(() => expect(screen.getByText('After Character pass')).toBeInTheDocument());
    expect(screen.getByText('Before import: LAS GARZAS')).toBeInTheDocument();
    const labels = [...document.querySelectorAll('.history-label')].map((n) => n.textContent);
    expect(labels[0]).toBe('After Character pass');
  });

  it('restore needs a confirmation step and takes a safety snapshot first', async () => {
    await useAppStore.getState().takeSnapshot('Clean state');
    useAppStore.getState().updateElementText('sc2', 'sc2-e5', 'CHANGED LINE.');
    const user = userEvent.setup();
    render(<HistoryDialog />);
    await waitFor(() => expect(screen.getByText('Clean state')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /^restore$/i }));
    // Nothing restored yet: the dialog asks first.
    expect(elementText(useAppStore.getState().screenplay, 'sc2', 'sc2-e5')).toBe('CHANGED LINE.');
    expect(screen.getByText(/saved as a safety snapshot/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /yes, restore/i }));
    await waitFor(() =>
      expect(elementText(useAppStore.getState().screenplay, 'sc2', 'sc2-e5')).toBe(
        'You never stopped keeping score, Papá.',
      ),
    );
    const snaps = await db.snapshots.toArray();
    expect(snaps).toHaveLength(2); // original + the safety snapshot
    expect(snaps.some((s) => /safety/i.test(s.label))).toBe(true);
    expect(useAppStore.getState().historyOpen).toBe(false);
  });
});
