import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassWorkspace } from './PassWorkspace';
import { useAppStore } from '../store/appStore';
import type { Finding } from '../workflow/types';

function seedFinding(extra: Partial<Finding> = {}) {
  useAppStore.getState().completeAnnotatedRead();
  useAppStore.getState().setActivePass('polish');
  const finding: Finding = {
    id: 'f-test-1',
    passId: 'polish',
    passRunId: 'run-test',
    provider: 'local',
    claimType: 'ai_hypothesis',
    status: 'priority_concern',
    summary: 'Marta never answers the money question.',
    citations: [{ sceneId: 'sc2', elementId: 'sc2-e5' }],
    proposal: {
      sceneId: 'sc2',
      elementId: 'sc2-e5',
      oldText: 'THE OLD LINE.',
      newText: 'THE NEW LINE.',
      rationale: 'Tighten the exchange so the dodge is visible.',
    },
    resolution: 'open',
    createdAt: 1,
    ...extra,
  };
  useAppStore.getState().setFindings('run-test', [finding]);
}

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('structured finding card', () => {
  it('shows labeled sections for suggestion, example rewrite, source, and links', () => {
    seedFinding();
    render(<PassWorkspace />);
    expect(screen.getByText('Suggestion')).toBeInTheDocument();
    expect(screen.getByText('Tighten the exchange so the dodge is visible.')).toBeInTheDocument();
    expect(screen.getByText('Example rewrite')).toBeInTheDocument();
    expect(screen.getByText('THE NEW LINE.')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('THE OLD LINE.')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Linked to')).toBeInTheDocument();
    // Root carries the first citation for identity-based assertions.
    expect(document.querySelector('.ai-finding')?.getAttribute('data-cited-element')).toBe('sc2-e5');
  });

  it('Go to script selects the exact cited line', async () => {
    seedFinding();
    const user = userEvent.setup();
    render(<PassWorkspace />);
    await user.click(screen.getAllByRole('button', { name: /go to script/i })[0]);
    expect(useAppStore.getState().selection).toEqual({ sceneId: 'sc2', elementId: 'sc2-e5' });
  });

  it('a failed approval explains itself and reassures nothing changed', async () => {
    // Proposal targets an element the finding does not cite: the store refuses.
    seedFinding({
      proposal: {
        sceneId: 'sc3',
        elementId: 'sc3-e2',
        oldText: 'X',
        newText: 'Y',
        rationale: 'Bad target.',
      },
    });
    const user = userEvent.setup();
    render(<PassWorkspace />);
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/scene lock/i);
    expect(alert.textContent).toMatch(/nothing was changed in the script/i);
  });

  it('hides confidence when the finding has none', () => {
    seedFinding();
    render(<PassWorkspace />);
    expect(screen.queryByText('Confidence')).not.toBeInTheDocument();
  });

  it('shows a labeled percentage meter when confidence is present', () => {
    seedFinding({ confidence: 0.78 });
    render(<PassWorkspace />);
    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });
});
