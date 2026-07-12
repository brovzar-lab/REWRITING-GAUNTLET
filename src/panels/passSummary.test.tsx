import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassSummaryDialog } from './PassSummaryDialog';
import { useAppStore } from '../store/appStore';
import type { Finding } from '../workflow/types';

function fakeFinding(partial: Partial<Finding> = {}): Finding {
  return {
    id: 'f1',
    passId: 'character',
    passRunId: 'run1',
    provider: 'local',
    claimType: 'ai_hypothesis',
    status: 'uncertain',
    summary: 'Test hypothesis',
    citations: [{ sceneId: 'sc2', elementId: 'sc2-e5' }],
    proposal: {
      sceneId: 'sc2',
      elementId: 'sc2-e5',
      oldText: 'You never stopped keeping score, Papá.',
      newText: 'You never stopped counting, Papá.',
      rationale: 'Sharper verb.',
    },
    resolution: 'open',
    createdAt: 1,
    ...partial,
  };
}

async function completeCharacterPass() {
  const s = useAppStore.getState();
  s.completeAnnotatedRead();
  s.setFindings('run1', [
    fakeFinding(),
    fakeFinding({ id: 'f2', proposal: undefined, citations: [{ sceneId: 'sc3', elementId: 'sc3-e2' }] }),
  ]);
  s.approveProposal('f1');
  s.rejectFinding('f2');
  await s.completePass('character');
}

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('pass completion summary', () => {
  it('shows what happened: approved, rejected, unresolved, snapshot, label, next pass', async () => {
    await completeCharacterPass();
    render(<PassSummaryDialog />);
    const dialog = screen.getByRole('dialog', { name: /character pass complete/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/approved changes/i)).toBeInTheDocument();
    expect(screen.getByText(/You never stopped counting, Papá./)).toBeInTheDocument();
    expect(screen.getByText(/rejected proposals: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/unresolved concerns: 0/i)).toBeInTheDocument();
    expect(screen.getByText(/After Character pass/)).toBeInTheDocument();
    expect(screen.getByText(/Rewrite 1/)).toBeInTheDocument();
  });

  it('the export button opens the export menu and closes the summary', async () => {
    await completeCharacterPass();
    const user = userEvent.setup();
    render(<PassSummaryDialog />);
    await user.click(screen.getByRole('button', { name: /export/i }));
    expect(useAppStore.getState().exportOpen).toBe(true);
    expect(useAppStore.getState().passSummary).toBeNull();
  });

  it('the next-pass button activates the recommended pass', async () => {
    await completeCharacterPass();
    const user = userEvent.setup();
    render(<PassSummaryDialog />);
    await user.click(screen.getByRole('button', { name: /story and theme/i }));
    await waitFor(() => expect(useAppStore.getState().activePassId).toBe('story-theme'));
    expect(useAppStore.getState().passSummary).toBeNull();
  });

  it('renders nothing when there is no summary', () => {
    render(<PassSummaryDialog />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
