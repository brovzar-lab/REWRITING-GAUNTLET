import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiAssistPanel } from './AiAssistPanel';
import { useAppStore, elementText } from '../store/appStore';
import { parseFountain } from '../io/fountain';

/** A draft with two deliberate polish problems (a double space and a trailing
    space) so the local analyzer produces two real proposals to approve/reject. */
const DRAFT = `Title: PROOF DRAFT

INT. KITCHEN - NIGHT

Marta cooks.  The radio hums.

MARTA
Dinner is cold.

EXT. STREET - NIGHT

A taxi waits  outside.
`;

function primeDraft() {
  useAppStore.getState().replaceDocument(parseFountain(DRAFT));
}

beforeEach(() => {
  useAppStore.getState().resetToSample();
});

describe('AI Assist panel', () => {
  it('is locked before the annotated read, with no way to diagnose', () => {
    useAppStore.getState().setActivePass('polish');
    render(<AiAssistPanel />);
    expect(screen.getByText(/locked until your private annotated read/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^diagnose$/i })).not.toBeInTheDocument();
  });

  it('asks for a pass when none is active', () => {
    useAppStore.getState().completeAnnotatedRead();
    render(<AiAssistPanel />);
    expect(screen.getByText(/choose a rewrite pass/i)).toBeInTheDocument();
  });

  it('diagnose lists findings from the local analyzer with provider label and citations', async () => {
    primeDraft();
    useAppStore.getState().completeAnnotatedRead();
    useAppStore.getState().setActivePass('polish');
    const user = userEvent.setup();
    render(<AiAssistPanel />);
    await user.click(screen.getByRole('button', { name: /^diagnose$/i }));
    await waitFor(() => expect(useAppStore.getState().workflow.findings.length).toBeGreaterThan(0));
    expect(screen.getAllByText(/AI hypothesis/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/local analyzer/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /approve/i }).length).toBe(2);
  });

  it('approve applies exactly the proposed text; reject leaves its element alone', async () => {
    primeDraft();
    useAppStore.getState().completeAnnotatedRead();
    useAppStore.getState().setActivePass('polish');
    const user = userEvent.setup();
    render(<AiAssistPanel />);
    await user.click(screen.getByRole('button', { name: /^diagnose$/i }));
    await waitFor(() => expect(useAppStore.getState().workflow.findings.length).toBe(2));

    const [first, second] = useAppStore.getState().workflow.findings;
    await user.click(screen.getAllByRole('button', { name: /approve/i })[0]);
    await user.click(screen.getAllByRole('button', { name: /reject/i })[0]);

    const s = useAppStore.getState();
    expect(elementText(s.screenplay, first.proposal!.sceneId, first.proposal!.elementId)).toBe(
      first.proposal!.newText,
    );
    expect(elementText(s.screenplay, second.proposal!.sceneId, second.proposal!.elementId)).toBe(
      second.proposal!.oldText,
    );
    expect(s.workflow.findings.find((f) => f.id === first.id)!.resolution).toBe('approved');
    expect(s.workflow.findings.find((f) => f.id === second.id)!.resolution).toBe('rejected');
    expect(s.workflow.approvals).toHaveLength(1);
    // Resolution is visible in the panel.
    expect(screen.getByText(/^approved$/i)).toBeInTheDocument();
    expect(screen.getByText(/^rejected$/i)).toBeInTheDocument();
  });

  it('clicking a citation selects that exact line', async () => {
    primeDraft();
    useAppStore.getState().completeAnnotatedRead();
    useAppStore.getState().setActivePass('polish');
    const user = userEvent.setup();
    render(<AiAssistPanel />);
    await user.click(screen.getByRole('button', { name: /^diagnose$/i }));
    await waitFor(() => expect(useAppStore.getState().workflow.findings.length).toBe(2));
    const finding = useAppStore.getState().workflow.findings[0];
    await user.click(screen.getAllByRole('button', { name: /INT\. KITCHEN - NIGHT/ })[0]);
    expect(useAppStore.getState().selection).toEqual(finding.citations[0]);
  });

  it('shows old and new text side by side for a proposal', async () => {
    primeDraft();
    useAppStore.getState().completeAnnotatedRead();
    useAppStore.getState().setActivePass('polish');
    const user = userEvent.setup();
    render(<AiAssistPanel />);
    await user.click(screen.getByRole('button', { name: /^diagnose$/i }));
    await waitFor(() => expect(useAppStore.getState().workflow.findings.length).toBe(2));
    expect(screen.getAllByText(/^current$/i).length).toBe(2);
    expect(screen.getAllByText(/^proposed$/i).length).toBe(2);
    const olds = [...document.querySelectorAll('.ai-proposal-old')].map((n) => n.textContent);
    const news = [...document.querySelectorAll('.ai-proposal-new')].map((n) => n.textContent);
    expect(olds).toContain('Marta cooks.  The radio hums.');
    expect(news).toContain('Marta cooks. The radio hums.');
  });
});
